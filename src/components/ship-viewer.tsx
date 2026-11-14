import { useEffect, useRef, useState } from "react";
import { RotateCcw, Maximize2, Minimize2, X } from "lucide-react";
import initWasm, { Viewer } from "@/lib/wasm/viewer/viewer";

const WASM_URL = "https://raw.githubusercontent.com/VYNESHINDEN1417/view-pathfinder/d8f38e06152ca8ce853431a2993682794206d3bc/public/wasm/viewer_bg.wasm";

const RESOURCE_PACK_URL = "/resource-pack/minecraft_resource_pack_1.18.zip";
let packCache: Promise<Map<string, Blob>> | null = null;
async function loadPack(): Promise<Map<string, Blob>> {
  if (packCache) return packCache;
  packCache = (async () => {
    const response = await fetch(RESOURCE_PACK_URL);
    if (!response.ok) throw new Error("Resource pack unavailable");
    const buffer = await response.arrayBuffer();
    const view = new DataView(buffer);
    const decoder = new TextDecoder();
    let end = -1;
    for (let p = buffer.byteLength - 22; p >= Math.max(0, buffer.byteLength - 65558); p--) {
      if (view.getUint32(p, true) === 0x06054b50) { end = p; break; }
    }
    if (end < 0) throw new Error("Invalid resource pack ZIP");
    const count = view.getUint16(end + 10, true);
    let offset = view.getUint32(end + 16, true);
    const result = new Map<string, Blob>();
    for (let i = 0; i < count; i++) {
      if (view.getUint32(offset, true) !== 0x02014b50) break;
      const method = view.getUint16(offset + 10, true);
      const size = view.getUint32(offset + 20, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const local = view.getUint32(offset + 42, true);
      const filename = decoder.decode(new Uint8Array(buffer, offset + 46, nameLength)).toLowerCase();
      offset += 46 + nameLength + extraLength + commentLength;
      if (!filename.endsWith(".png")) continue;
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      const compressed = buffer.slice(start, start + size);
      let data: ArrayBuffer;
      if (method === 0) data = compressed;
      else if (method === 8) data = await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer();
      else continue;
      result.set(filename, new Blob([data], { type: "image/png" }));
    }
    return result;
  })();
  return packCache;
}
function blockTextureName(material: string): string {
  const aliases: Record<string, string> = { stationary_water: "water_still", mob_head: "skull", wall_sign: "oak_sign", block_of_gold: "gold_block", block_of_quartz: "quartz_block_side", monster_spawner: "mob_spawner", colored_terracotta: "hardened_clay", smooth_stone: "stone", dried_kelp_block: "dried_kelp_side" };
  const key = material.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return aliases[key] || key;
}
async function rebuildModelAtlases(obj: string, names: string[]): Promise<Map<string, Uint8Array>> {
  const pack = await loadPack();
  const textures = [...pack.entries()];
  const uv: Array<[number, number]> = [];
  const tilesByMaterial = new Map<string, Set<string>>();
  let material = "";
  for (const line of obj.split(/\r?\n/)) {
    const p = line.trim().split(/\s+/);
    if (p[0] === "vt") uv.push([Number(p[1]), Number(p[2])]);
    else if (p[0] === "usemtl") material = p.slice(1).join(" ");
    else if (p[0] === "f" && material) {
      const tiles = tilesByMaterial.get(material) || new Set<string>();
      for (const v of p.slice(1)) {
        const index = Number(v.split("/")[1]) - 1, point = uv[index];
        if (!point) continue;
        const x = Math.max(0, Math.min(31, Math.floor((point[0] - Math.floor(point[0])) * 32)));
        const y = Math.max(0, Math.min(31, Math.floor((point[1] - Math.floor(point[1])) * 32)));
        tiles.add(x + "," + y);
      }
      tilesByMaterial.set(material, tiles);
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingEnabled = false;
  const bitmaps = new Map<string, ImageBitmap>();
  for (const [mat, tiles] of tilesByMaterial) {
    const key = blockTextureName(mat);
    const entry = textures.find(([file]) => file.endsWith("/" + key + ".png")) || textures.find(([file]) => file.endsWith("/" + key + "_side.png")) || textures.find(([file]) => file.endsWith("/" + key + "_top.png"));
    if (!entry) continue;
    let bitmap = bitmaps.get(key);
    if (!bitmap) { bitmap = await createImageBitmap(entry[1]); bitmaps.set(key, bitmap); }
    for (const tile of tiles) {
      const [x, y] = tile.split(",").map(Number);
      ctx.drawImage(bitmap, x * 16, y * 16, 16, 16);
    }
  }
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("PNG encoding failed")), "image/png"));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const result = new Map<string, Uint8Array>();
  for (const name of names) result.set(name, bytes);
  bitmaps.forEach(bitmap => bitmap.close());
  return result;
}

type ShipViewerProps = { name: string; objUrl: string; mtlUrl: string; sizeLabel: string; textureBasePath?: string; textureUrls?: Record<string, string>; };
export function ShipViewer({ name, objUrl, mtlUrl, sizeLabel, textureBasePath = "/models", textureUrls }: ShipViewerProps) {
  const [open, setOpen] = useState(false);
  const [confirmDownload, setConfirmDownload] = useState(false);
  const [startDownload, setStartDownload] = useState(false);
  const [status, setStatus] = useState("Preparing viewer…");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [textureMissing, setTextureMissing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const rafRef = useRef<number | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    if (!open || !startDownload || !canvasRef.current || !hostRef.current) return;
    aliveRef.current = true;
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const controller = new AbortController();
    let resizeObserver: ResizeObserver | null = null;
    let localViewer: Viewer | null = null;

    const render = () => {
      if (!aliveRef.current || !localViewer) return;
      localViewer.frame();
      if (localViewer.needs_redraw() || localViewer.animating()) {
        rafRef.current = requestAnimationFrame(render);
      } else {
        rafRef.current = null;
      }
    };
    const requestRender = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(render);
    };
    const resize = () => {
      if (!localViewer) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      // Always synchronize the WebGPU surface, even when the backing canvas
      // already has the requested dimensions.
      localViewer.resize(width, height, rect.width, rect.height);
      requestRender();
    };

    const load = async () => {
      try {
        setStatus("Downloading ship model…");
        setProgress(5);
        const [objResponse, mtlResponse] = await Promise.all([
          fetch(objUrl, { signal: controller.signal }),
          fetch(mtlUrl, { signal: controller.signal }),
        ]);
        if (!objResponse.ok || !mtlResponse.ok) throw new Error("Could not load the ship model files.");
        const [obj, mtl] = await Promise.all([objResponse.text(), mtlResponse.text()]);
        if (!aliveRef.current) return;
        setProgress(35);
        setStatus("Starting Pathfinder renderer…");
        // Set the backing-store dimensions BEFORE creating the GPU surface.
        // Viewer.create reads canvas.width/height to configure that surface
        // and uses the same dimensions when fitting its initial camera.
        const initialRect = canvas.getBoundingClientRect();
        const initialDpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.max(1, Math.round(initialRect.width * initialDpr));
        canvas.height = Math.max(1, Math.round(initialRect.height * initialDpr));
        await initWasm(WASM_URL);
        if (!aliveRef.current) return;
        localViewer = await Viewer.create(canvas, obj, mtl, () => {});
        viewerRef.current = localViewer;
        const backgroundResponse = await fetch("/images/3d-viewer/3untitled.png", { signal: controller.signal });
        if (backgroundResponse.ok) {
          const bitmap = await createImageBitmap(await backgroundResponse.blob());
          const maxBackgroundDimension = 2048;
          const scale = Math.min(1, maxBackgroundDimension / Math.max(bitmap.width, bitmap.height));
          const backgroundCanvas = document.createElement("canvas");
          backgroundCanvas.width = Math.max(1, Math.round(bitmap.width * scale));
          backgroundCanvas.height = Math.max(1, Math.round(bitmap.height * scale));
          const backgroundContext = backgroundCanvas.getContext("2d");
          if (backgroundContext) {
            backgroundContext.drawImage(bitmap, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
            const backgroundBlob = await new Promise<Blob>((resolve, reject) => {
              backgroundCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not prepare the viewer background image.")), "image/png");
            });
            const backgroundBytes = new Uint8Array(await backgroundBlob.arrayBuffer());
            const backgroundApplied = localViewer.set_background_image(backgroundBytes);
            if (!backgroundApplied) console.warn("Pathfinder could not apply the custom background image.");
          }
          bitmap.close();
        }
        // Draw parsed geometry before optional resource-pack reconstruction.
        localViewer.set_light(2.5);
        localViewer.set_fancy(true, 1);
        localViewer.set_shadow_mode(1);
        resize();
        // Refit after the real CSS dimensions are applied; the renderer's
        // first camera fit happens during create(), before CSS sizing is known.
        localViewer.reset();
        requestRender();
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        setProgress(65);
        setStatus("Loading Minecraft textures…");
        const textureNames = localViewer.texture_names();
        setStatus("Rebuilding Minecraft block textures…");
        try {
          const atlases = await rebuildModelAtlases(obj, textureNames);
          for (const [textureName, bytes] of atlases) localViewer.set_texture(textureName, bytes);
          if (atlases.size === 0) setTextureMissing(true);
        } catch (atlasError) {
          console.warn("Minecraft atlas reconstruction failed:", atlasError);
          setTextureMissing(true);
        }
        if (aliveRef.current) setProgress(99);
        if (!aliveRef.current) return;
        localViewer.set_light(2.5);
        localViewer.set_fancy(true, 1);
        localViewer.set_shadow_mode(1);
        setProgress(100);
        setStatus("Ready");
        resize();
        requestRender();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "The 3D viewer could not be started.");
      }
    };
    void load();

    const onPointerDown = (event: PointerEvent) => {
      if (!localViewer) return;
      const rect = canvas.getBoundingClientRect();
      canvas.setPointerCapture(event.pointerId);
      localViewer.pointer_down(event.pointerId, event.clientX - rect.left, event.clientY - rect.top, event.button);
      requestRender();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!localViewer || !canvas.hasPointerCapture(event.pointerId)) return;
      const rect = canvas.getBoundingClientRect();
      localViewer.pointer_move(event.pointerId, event.clientX - rect.left, event.clientY - rect.top);
      requestRender();
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!localViewer) return;
      const rect = canvas.getBoundingClientRect();
      localViewer.pointer_up(event.pointerId, event.clientX - rect.left, event.clientY - rect.top, performance.now());
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      requestRender();
    };
    const onPointerCancel = (event: PointerEvent) => localViewer?.pointer_cancel(event.pointerId);
    const onWheel = (event: WheelEvent) => {
      if (!localViewer) return;
      event.preventDefault();
      localViewer.wheel(event.deltaY);
      requestRender();
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      aliveRef.current = false;
      controller.abort();
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("wheel", onWheel);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      localViewer?.destroy();
      viewerRef.current = null;
    };
  }, [open, startDownload]);

  const reset = () => {
    viewerRef.current?.reset();
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(() => {
      viewerRef.current?.frame();
      rafRef.current = null;
    });
  };

  const toggleFullscreen = async () => {
    if (!hostRef.current) return;
    try {
      if (!document.fullscreenElement) await hostRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      setError("Fullscreen is not available in this browser.");
    }
  };

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  return (
    <section className="wisconsin-3d-section" aria-label={"Interactive " + name + " 3D model"}>
      {!open ? (
        <button type="button" className="wisconsin-3d-launch" onClick={() => { setError(""); setTextureMissing(false); setProgress(0); setStartDownload(false); setConfirmDownload(true); setOpen(true); }}>
          <span>VIEW IN 3D</span>
          <span className="wisconsin-3d-launch-sub">Interactive ship model</span>
        </button>
      ) : (
        <div className="wisconsin-viewer-shell" ref={hostRef}>
          <div className="wisconsin-viewer-toolbar">
            <span>{name.toUpperCase()} / 3D VIEWER</span>
            <div>
              <button type="button" onClick={reset} aria-label="Reset camera" title="Reset camera"><RotateCcw size={18} /></button>
              <button type="button" onClick={toggleFullscreen} aria-label="Toggle fullscreen" title="Fullscreen">{fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
              <button type="button" onClick={() => { setConfirmDownload(false); setStartDownload(false); setOpen(false); }} aria-label="Close 3D viewer" title="Close"><X size={18} /></button>
            </div>
          </div>
          <div className="wisconsin-viewer-stage">
            {confirmDownload ? (
              <div className="wisconsin-download-notice" role="dialog" aria-labelledby="ship-download-title" aria-describedby="ship-download-description">
                <div className="wisconsin-download-symbol" aria-hidden="true">!</div>
                <h2 id="ship-download-title">BEFORE YOU CONTINUE</h2>
                <p id="ship-download-description">The {name} OBJ model is approximately {sizeLabel}. Downloading time depends on your internet connection. Referenced texture maps are checked separately.</p>
                <div className="wisconsin-download-actions">
                  <button type="button" className="wisconsin-download-cancel" onClick={() => { setConfirmDownload(false); setOpen(false); setStartDownload(false); }}>Cancel</button>
                  <button type="button" className="wisconsin-download-continue" onClick={() => { setConfirmDownload(false); setError(""); setStartDownload(true); }}>Continue</button>
                </div>
              </div>
            ) : (
              <>
                <canvas ref={canvasRef} aria-label={"Drag to rotate " + name + ", scroll to zoom"} />
                {error ? <div className="wisconsin-viewer-message" role="alert">{error}</div> : progress < 100 ? (
              <div className="wisconsin-viewer-loading" role="status">
                <span>{status}</span>
                {progress < 35 && (
                  <small className="wisconsin-viewer-download-note">
                    The {name} OBJ model is approximately {sizeLabel}. Texture maps may add to the download.
                  </small>
                )}
                <div><i style={{ width: progress + "%" }} /></div>
                <small>{progress}%</small>
              </div>
                ) : <div className="wisconsin-viewer-hint">{textureMissing ? "MODEL LOADED · SOME TEXTURE MAPS ARE MISSING" : "DRAG TO ROTATE · SCROLL TO ZOOM · DOUBLE-TAP TO RESET"}</div>}
              </>
            )}
          </div>
        </div>
      )}

    </section>
  );
}

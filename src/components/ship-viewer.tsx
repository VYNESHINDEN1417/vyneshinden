import { useEffect, useRef, useState } from "react";
import { RotateCcw, Maximize2, Minimize2, X } from "lucide-react";
import initWasm, { Viewer } from "@/lib/wasm/viewer/viewer";

const WASM_URL = "https://raw.githubusercontent.com/VYNESHINDEN1417/view-pathfinder/d8f38e06152ca8ce853431a2993682794206d3bc/public/wasm/viewer_bg.wasm";
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
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        localViewer.resize(width, height, rect.width, rect.height);
        requestRender();
      }
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
        setProgress(65);
        setStatus("Loading Minecraft textures…");
        const textureNames = localViewer.texture_names();
        let loaded = 0;
        await Promise.all(textureNames.map(async (name) => {
          const safeName = name.split("/").filter((part) => part && part !== "." && part !== "..").map(encodeURIComponent).join("/");
          const url = textureUrls?.[name] || textureBasePath + "/" + safeName;
          
          try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) { setTextureMissing(true); return; }
            const bytes = new Uint8Array(await response.arrayBuffer());
            localViewer?.set_texture(name, bytes);
          } catch {
            // Keep the material's base color if an optional texture is unavailable.
          } finally {
            loaded += 1;
            if (aliveRef.current) setProgress(65 + Math.round((loaded / Math.max(1, textureNames.length)) * 34));
          }
        }));
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

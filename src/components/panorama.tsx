import { useEffect, useRef } from "react";
import type { CubeTexture } from "three";
import { advancePanoramaBlend, panoramaYaw, PANORAMA_PITCH_DEGREES } from "@/lib/panorama-motion";

// Keep the decoded morning cubemap alive between route changes. The Home route
// unmounts on navigation, but returning should not wait for six images to reload.
let cachedMorningTexture: CubeTexture | null = null;
let cachedPanoramaFrame: string | null = null;

export function Panorama({ night = false }: { night?: boolean }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef(night);
  const requestNightRef = useRef<(() => void) | null>(null);

  nightRef.current = night;

  useEffect(() => {
    if (night) requestNightRef.current?.();
  }, [night]);

  // The persistent panorama lives above the homepage route, so follow the shared
  // document theme attribute instead of relying on homepage-local React state.
  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      const isNight = root.dataset.buttonTheme === "dark";
      nightRef.current = isNight;
      if (isNight) requestNightRef.current?.();
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-button-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let disposed = false;
    let frame = 0;
    let idleHandle: number | null = null;
    let fallbackHandle: number | null = null;
    let cleanup = () => {};

    void import("three").then((THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: "low-power",
        });
      } catch {
        return;
      }

      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        window.innerWidth < 768 ? 1.25 : 1.75,
      );
      renderer.setPixelRatio(pixelRatio);
      scene.prepend(renderer.domElement);

      const loader = new THREE.CubeTextureLoader();
      const paths = (set: "morning" | "night") => {
        const extension = set === "morning" ? "webp" : "jpg";
        return [3, 1, 4, 5, 2, 0].map(
          (index) => `/media/panorama/${set}/panorama_${index}.${extension}`,
        );
      };

      let morningLoaded = cachedMorningTexture !== null;
      let evening: InstanceType<typeof THREE.CubeTexture> | null = null;
      let eveningLoaded = false;
      let eveningRequested = false;
      let hasRenderedMorning = false;
      let start = 0;
      let previous = 0;

      const uniforms = {
        morning: { value: cachedMorningTexture as InstanceType<typeof THREE.CubeTexture> | null },
        evening: { value: cachedMorningTexture as InstanceType<typeof THREE.CubeTexture> | null },
        blend: { value: 0 },
        yaw: { value: 0 },
        aspect: { value: 1 },
      };

      const cancelScheduledNightPreload = () => {
        const idleWindow = window as Window & {
          cancelIdleCallback?: (handle: number) => void;
        };
        if (idleHandle !== null) idleWindow.cancelIdleCallback?.(idleHandle);
        if (fallbackHandle !== null) window.clearTimeout(fallbackHandle);
        idleHandle = null;
        fallbackHandle = null;
      };

      const requestEvening = () => {
        cancelScheduledNightPreload();
        if (eveningRequested || eveningLoaded || disposed) return;
        eveningRequested = true;
        const nightTexture = loader.load(
          paths("night"),
          (texture) => {
            if (disposed) {
              texture.dispose();
              return;
            }
            evening = texture;
            uniforms.evening.value = texture;
            eveningLoaded = true;
          },
          undefined,
          () => {
            evening?.dispose();
            evening = null;
            eveningRequested = false;
          },
        );
        evening = nightTexture;
      };

      const scheduleNightPreload = () => {
        if (eveningRequested || eveningLoaded || disposed) return;
        const idleWindow = window as Window & {
          requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
        };
        const loadNightWhenIdle = () => {
          idleHandle = null;
          fallbackHandle = null;
          requestEvening();
        };
        if (idleWindow.requestIdleCallback) {
          idleHandle = idleWindow.requestIdleCallback(loadNightWhenIdle, { timeout: 1200 });
        } else {
          fallbackHandle = window.setTimeout(loadNightWhenIdle, 200);
        }
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        depthTest: false,
        depthWrite: false,
        vertexShader: `varying vec2 screenUV;
          void main() { screenUV = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: `
          uniform samplerCube morning;
          uniform samplerCube evening;
          uniform float blend;
          uniform float yaw;
          uniform float aspect;
          varying vec2 screenUV;
          void main() {
            vec2 xy = (screenUV * 2.0 - 1.0) * tan(radians(85.0) / 2.0);
            vec3 ray = normalize(vec3(xy.x * aspect, xy.y, -1.0));
            float pitch = radians(${PANORAMA_PITCH_DEGREES.toFixed(1)});
            ray.yz = mat2(cos(pitch), -sin(pitch), sin(pitch), cos(pitch)) * ray.yz;
            ray.xz = mat2(cos(yaw), sin(yaw), -sin(yaw), cos(yaw)) * ray.xz;
            ray.x = -ray.x;
            // Preserve the original 180-degree rotation of the upward-facing panorama_4 face.
            if (ray.y > 0.0 && abs(ray.y) > abs(ray.x) && abs(ray.y) > abs(ray.z)) {
              ray.xz = -ray.xz;
            }
            gl_FragColor = mix(textureCube(morning, ray), textureCube(evening, ray), blend);
            #include <colorspace_fragment>
          }`,
      });
      const geometry = new THREE.PlaneGeometry(2, 2);
      const world = new THREE.Scene();
      world.add(new THREE.Mesh(geometry, material));
      const camera = new THREE.Camera();
      const measure = () => {
        const width = Math.max(1, scene.clientWidth);
        const height = Math.max(1, scene.clientHeight);
        renderer.setSize(width, height, false);
        uniforms.aspect.value = width / height;
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(scene);
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const tick = (now: number) => {
        if (disposed || !morningLoaded) return;
        uniforms.yaw.value = reducedMotion.matches ? 0 : panoramaYaw((now - start) / 1000);
        uniforms.blend.value = advancePanoramaBlend(
          uniforms.blend.value,
          nightRef.current && eveningLoaded,
          (now - previous) / 1000,
        );
        previous = now;
        renderer.render(world, camera);
        if (!hasRenderedMorning) {
          hasRenderedMorning = true;
          scene.dataset["sceneReady"] = "true";
          scene.querySelector<HTMLImageElement>(".panorama-fallback")?.remove();
          scheduleNightPreload();
        }
        frame = requestAnimationFrame(tick);
      };

      let morning: InstanceType<typeof THREE.CubeTexture>;
      if (cachedMorningTexture) {
        // Reuse the already-decoded cubemap and paint on the first animation frame.
        morning = cachedMorningTexture;
        start = performance.now();
        previous = start;
        frame = requestAnimationFrame(tick);
      } else {
        morning = loader.load(
          paths("morning"),
          (texture) => {
            cachedMorningTexture = texture;
            if (disposed) return;
            uniforms.morning.value = texture;
            uniforms.evening.value = evening ?? texture;
            morningLoaded = true;
            start = performance.now();
            previous = start;
            frame = requestAnimationFrame(tick);
          },
          undefined,
          () => {
            scene.dataset["sceneReady"] = "error";
          },
        );
      }
      uniforms.morning.value = morning;
      uniforms.evening.value = evening ?? morning;

      requestNightRef.current = requestEvening;
      if (nightRef.current) requestEvening();

      cleanup = () => {
        // Preserve the last visible frame while the route-owned WebGL canvas is recreated.
        try {
          if (hasRenderedMorning && renderer.domElement.width > 0 && renderer.domElement.height > 0) {
            cachedPanoramaFrame = renderer.domElement.toDataURL("image/webp", 0.82);
          }
        } catch {
          // A CSS black cover remains available if the browser blocks canvas snapshots.
        }
        requestNightRef.current = null;
        cancelScheduledNightPreload();
        observer.disconnect();
        geometry.dispose();
        material.dispose();
        // The morning texture is shared across route mounts; do not dispose it here.
        evening?.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        delete scene.dataset["sceneReady"];
      };
      if (disposed) {
        cleanup();
        return;
      }
    }).catch(() => {
      // Keep the static CSS cover visible if the Three.js chunk cannot be loaded.
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanup();
    };
  }, []);

  return (
    <div ref={sceneRef} className="panorama" aria-hidden="true">
      <div className="panorama-top-blur" />
    </div>
  );
}

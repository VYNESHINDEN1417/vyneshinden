import { useEffect, useRef } from "react";
import { advancePanoramaBlend, panoramaYaw, PANORAMA_PITCH_DEGREES } from "@/lib/panorama-motion";

export function Panorama({ night = false }: { night?: boolean }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef(night);

  useEffect(() => { nightRef.current = night; }, [night]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    // Load Three.js only in the browser; keep the CSS loading cover if WebGL is unavailable.
    void import("three").then((THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: false,
          powerPreference: "low-power",
        });
      } catch {
        return;
      }

      // A lower pixel ratio reduces GPU work on phones without changing the layout size.
      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        window.innerWidth < 768 ? 1.25 : 1.75,
      );
      renderer.setPixelRatio(pixelRatio);
      scene.prepend(renderer.domElement);

      const loader = new THREE.CubeTextureLoader();
      // WebGL order: +X, -X, +Y, -Y, +Z, -Z.
      const paths = (set: string) => [3, 1, 4, 5, 2, 0].map(
        (index) => `/media/panorama/${set}/panorama_${index}.png`,
      );

      // Fetch only the morning environment at startup. The night set is ~half
      // of the panorama payload and is requested only when the visitor enables it.
      const morning = loader.load(paths("morning"));
      let evening: InstanceType<typeof THREE.CubeTexture> | null = null;
      let eveningLoaded = false;
      let eveningRequested = false;

      const uniforms = {
        morning: { value: morning },
        evening: { value: morning },
        blend: { value: 0 },
        yaw: { value: 0 },
        aspect: { value: 1 },
      };

      const requestEvening = () => {
        if (eveningRequested || eveningLoaded || disposed) return;
        eveningRequested = true;
        evening = loader.load(
          paths("night"),
          (texture) => {
            if (disposed) {
              texture.dispose();
              return;
            }
            uniforms.evening.value = texture;
            eveningLoaded = true;
          },
          undefined,
          () => {
            // Permit a later retry if the night assets fail to load temporarily.
            eveningRequested = false;
          },
        );
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
            // Minecraft faces are viewed from inside; cube sampling needs X mirrored.
            ray.x = -ray.x;
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
      const start = performance.now();
      let previous = start;
      const tick = (now: number) => {
        if (nightRef.current && !eveningRequested && !eveningLoaded) requestEvening();
        const showNight = nightRef.current && eveningLoaded;
        uniforms.yaw.value = reducedMotion.matches ? 0 : panoramaYaw((now - start) / 1000);
        uniforms.blend.value = advancePanoramaBlend(
          uniforms.blend.value,
          showNight,
          (now - previous) / 1000,
        );
        previous = now;
        renderer.render(world, camera);
        frame = requestAnimationFrame(tick);
      };
      cleanup = () => {
        observer.disconnect();
        geometry.dispose();
        material.dispose();
        morning.dispose();
        evening?.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
      if (disposed) {
        cleanup();
        return;
      }
      frame = requestAnimationFrame(tick);
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

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

    // Import and create WebGL only after mounting, never during server rendering.
    void import("three").then(async (THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      } catch {
        return; // The original animated background remains visible without WebGL.
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      scene.prepend(renderer.domElement);
      const loader = new THREE.CubeTextureLoader();
      // WebGL order: +X, -X, +Y, -Y, +Z, -Z.
      const paths = (set: string) => [3, 1, 4, 5, 2, 0].map(
        (index) => `/media/panorama/${set}/panorama_${index}.png`,
      );
      const morning = loader.load(paths("morning"));
      const evening = loader.load(paths("night"));
      const uniforms = {
        morning: { value: morning }, evening: { value: evening },
        blend: { value: nightRef.current ? 1 : 0 },
        yaw: { value: 0 }, aspect: { value: 1 },
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
        renderer.setSize(width, height);
        uniforms.aspect.value = width / height;
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(scene);
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const start = performance.now();
      let previous = start;
      const tick = (now: number) => {
        uniforms.yaw.value = reducedMotion.matches ? 0 : panoramaYaw((now - start) / 1000);
        uniforms.blend.value = advancePanoramaBlend(uniforms.blend.value, nightRef.current, (now - previous) / 1000);
        previous = now;
        renderer.render(world, camera);
        frame = requestAnimationFrame(tick);
      };
      cleanup = () => {
        observer.disconnect();
        geometry.dispose(); material.dispose(); morning.dispose(); evening.dispose();
        renderer.dispose(); renderer.domElement.remove();
      };
      if (disposed) { cleanup(); return; }
      frame = requestAnimationFrame(tick);
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

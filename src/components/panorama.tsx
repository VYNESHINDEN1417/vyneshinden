import { useEffect, useRef } from "react";

/** Minecraft title-screen cubemap: panorama_0..5 = front, right, back, left, up, down. */
const FACES = [
  "rotateY(0deg)",
  "rotateY(-90deg)",
  "rotateY(180deg)",
  "rotateY(90deg)",
  "rotateX(-90deg)",
  "rotateX(90deg)",
];
/** Vanilla values: 85° field of view, fixed 10° downward look, level horizontal spin only. */
const FOV_DEG = 85;
const PITCH_DEG = 10;
const SECONDS_PER_TURN = 90;

export function Panorama({ variant = "morning" }: { variant?: "morning" | "night" }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const cube = cubeRef.current;
    if (!scene || !cube) return;
    let depth = 0;
    const measure = () => {
      depth = scene.clientHeight / 2 / Math.tan((FOV_DEG * Math.PI) / 360);
      scene.style.perspective = `${depth}px`;
      scene.style.setProperty("--pano-size", `${depth * 2}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scene);
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const yaw = (((now - start) / 1000) * 360) / SECONDS_PER_TURN;
      cube.style.transform = `translateZ(${depth}px) rotateX(${PITCH_DEG}deg) rotateY(${-yaw}deg)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={sceneRef} className="panorama" aria-hidden="true">
      <div ref={cubeRef} className="panorama-cube">
        {FACES.map((rotation, index) => (
          <img
            key={index}
            className="panorama-face"
            src={`/media/panorama/${variant}/panorama_${index}.png`}
            alt=""
            draggable={false}
            style={{ transform: `${rotation} translateZ(calc(var(--pano-size) / -2)) scale(1.003)` }}
          />
        ))}
      </div>
      <div className="panorama-top-blur" />
    </div>
  );
}

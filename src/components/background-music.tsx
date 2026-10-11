import { useEffect, useRef } from "react";
import music from "@/assets/sweden.mp3.asset.json";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const start = () => {
      if (audio.paused) void audio.play().catch(() => {
        // Browsers may block autoplay until a visitor interacts with the site.
      });
    };
    start();
    document.addEventListener("pointerdown", start, true);
    document.addEventListener("keydown", start, true);
    return () => {
      document.removeEventListener("pointerdown", start, true);
      document.removeEventListener("keydown", start, true);
      audio.pause();
    };
  }, []);

  return <audio ref={audioRef} src={music.url} autoPlay loop preload="auto" aria-hidden="true" />;
}
import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { playClickSoundOnPointerDown } from "@/components/portfolio";

const MUSIC_PREFERENCE_KEY = "vyneshinden-music-enabled";

export function BackgroundMusic({ enabled = true }: { enabled?: boolean }) {
  const isHome = useRouterState({ select: (state) => state.location.pathname === "/" });
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicOn, setMusicOn] = useState(false);

  // Music is opt-in on first visit. Restore the visitor's own choice on later visits.
  useEffect(() => {
    try {
      setMusicOn(window.localStorage.getItem(MUSIC_PREFERENCE_KEY) === "true");
    } catch {
      setMusicOn(false);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!enabled || !musicOn) {
      audio?.pause();
      return;
    }

    // If a browser blocks playback on page load, begin after the visitor's next interaction.
    const start = () => {
      if (audio?.paused) void audio.play().catch(() => {
        // Playback may remain blocked until a direct interaction with the music control.
      });
    };
    document.addEventListener("pointerdown", start, true);
    document.addEventListener("keydown", start, true);
    return () => {
      document.removeEventListener("pointerdown", start, true);
      document.removeEventListener("keydown", start, true);
    };
  }, [enabled, musicOn]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  function toggleMusic() {
    const audio = audioRef.current;
    const next = !musicOn;
    setMusicOn(next);
    try {
      window.localStorage.setItem(MUSIC_PREFERENCE_KEY, String(next));
    } catch {
      // The toggle still works for this visit if storage is unavailable.
    }

    if (next) {
      // Calling play directly from this click gives the browser a user gesture.
      if (audio) void audio.play().catch(() => {
        // The next user interaction can retry playback.
      });
    } else {
      audio?.pause();
      if (audio) audio.currentTime = 0;
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/media/sweden.mp3"
        loop
        preload={enabled && musicOn ? "auto" : "none"}
        aria-hidden="true"
      />
      {enabled && isHome && (
        <Button
          variant="music"
          size="music"
          className="music-corner"
          type="button"
          aria-pressed={musicOn}
          aria-label={musicOn ? "Turn background music off" : "Turn background music on"}
          onPointerDown={playClickSoundOnPointerDown}
          onClick={toggleMusic}
        >
          <span>{musicOn ? "Music: ON" : "Music: OFF"}</span>
        </Button>
      )}
    </>
  );
}

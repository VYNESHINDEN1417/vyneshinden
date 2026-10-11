import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playClickSoundOnPointerDown } from "@/components/portfolio";
import music from "@/assets/sweden.mp3.asset.json";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  function openMusic() {
    setWelcomeOpen(true);
  }

  useEffect(() => {
    if (welcomeOpen) dialogRef.current?.showModal();
  }, [welcomeOpen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || welcomeOpen) return;
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
    };
  }, [welcomeOpen]);

  function enter() {
    const audio = audioRef.current;
    if (audio) void audio.play().catch(() => {});
    setWelcomeOpen(false);
  }

  return <>
    <audio ref={audioRef} src={music.url} loop preload="auto" aria-hidden="true" />
    <Button variant="music" size="music" className="music-corner" type="button" aria-haspopup="dialog" aria-expanded={welcomeOpen} onPointerDown={playClickSoundOnPointerDown} onClick={openMusic}><span>Music</span></Button>
    {welcomeOpen && <dialog ref={dialogRef} className="modal-card music-welcome" aria-label="Welcome to my portfolio" aria-describedby="music-welcome-message" onCancel={(event) => event.preventDefault()}>
      <p id="music-welcome-message">Welcome to my portfolio, a music will be played</p>
      <div className="music-welcome-actions">
        <Button variant="game" size="game" type="button" onPointerDown={playClickSoundOnPointerDown} onClick={enter}><span>play music</span></Button>
        <div className="music-disabled-option">
          <Button variant="game" size="game" type="button" className="music-disabled-button" disabled aria-disabled="true"><span>don't play music</span></Button>
          <X className="music-disabled-cross" aria-hidden="true" strokeWidth={4} />
        </div>
      </div>
    </dialog>}
  </>;
}
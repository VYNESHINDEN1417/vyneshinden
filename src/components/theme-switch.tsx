import { useState } from "react";
import { Button } from "@/components/ui/button";
import { playClickSound, playClickSoundOnPointerDown } from "@/components/portfolio";

export function ThemeSwitch() {
  const [night, setNight] = useState(true);
  return (
    <Button variant="ghost" role="switch" aria-checked={night} aria-label="Dark mode" title="Dark mode" className="theme-switch" onPointerDown={playClickSoundOnPointerDown} onClick={(event) => { if (event.detail === 0) playClickSound(); setNight((value) => !value); }}>
      <span className="theme-switch__container" aria-hidden="true">
        <span className="theme-switch__clouds" />
        <span className="theme-switch__stars-container">
          <svg viewBox="0 0 144 55" fill="currentColor"><path d="M4 32l2 3 2 1-2 2-2 3-1-3-3-2 3-1zM35 19l2 3 2 1-2 2-2 3-1-3-3-2 3-1zM58 21l2 3 2 1-2 2-2 3-1-3-3-2 3-1zM85 21l2 3 2 1-2 2-2 3-1-3-3-2 3-1zM137 0l2 3 2 1-2 2-2 3-1-3-3-2 3-1zM140 32l2 3 2 1-2 2-2 3-1-3-3-2 3-1zM103 46l2 3 2 1-2 2-2 3-1-3-3-2 3-1z" /></svg>
        </span>
        <span className="theme-switch__circle-container"><span className="theme-switch__sun-moon-container"><span className="theme-switch__moon"><span className="theme-switch__spot" /><span className="theme-switch__spot" /><span className="theme-switch__spot" /></span></span></span>
      </span>
    </Button>
  );
}
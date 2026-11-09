import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playClickSound, playClickSoundOnPointerDown } from "@/components/portfolio";

export function ThemeSwitch({ night, onToggle }: { night: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      role="switch"
      aria-checked={night}
      aria-label="Dark mode"
      title="Dark mode"
      className="theme-switch"
      onPointerDown={playClickSoundOnPointerDown}
      onClick={(event) => {
        if (event.detail === 0) playClickSound();
        onToggle();
      }}
    >
      <span className="theme-switch__slider" aria-hidden="true" />
      <Sun className="theme-switch__icon theme-switch__icon--off" aria-hidden="true" />
      <Moon className="theme-switch__icon theme-switch__icon--on" aria-hidden="true" />
    </Button>
  );
}

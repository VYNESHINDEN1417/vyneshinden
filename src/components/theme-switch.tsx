import { Button } from "@/components/ui/button";
import { playClickSound, playClickSoundOnPointerDown } from "@/components/portfolio";

export function ThemeSwitch({ night, onToggle }: { night: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      role="switch"
      aria-checked={night}
      aria-label="Dark mode"
      title={night ? "Switch to light mode" : "Switch to dark mode"}
      className="theme-switch"
      onPointerDown={playClickSoundOnPointerDown}
      onClick={(event) => {
        if (event.detail === 0) playClickSound();
        onToggle();
      }}
    >
      <span className="theme-switch__container" aria-hidden="true">
        <span className="theme-switch__thumb">
          <img className="theme-switch__lamp theme-switch__lamp--off" src="/media/redstone-lamp-off.webp" alt="" draggable={false} />
          <img className="theme-switch__lamp theme-switch__lamp--on" src="/media/redstone-lamp-on.webp" alt="" draggable={false} />
        </span>
      </span>
    </Button>
  );
}

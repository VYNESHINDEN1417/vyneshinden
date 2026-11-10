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
        <img
          className="theme-switch__lamp"
          src={night ? "/media/redstone-lamp-off.webp" : "/media/redstone-lamp-on.webp"}
          alt=""
          draggable={false}
        />
      </span>
    </Button>
  );
}

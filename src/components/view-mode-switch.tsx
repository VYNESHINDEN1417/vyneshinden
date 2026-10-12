import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playClickSoundOnPointerDown } from "@/components/portfolio";
import { applyViewMode, readViewMode, type ViewMode } from "@/lib/view-mode";

const OPTIONS: { value: ViewMode; label: string; hint: string }[] = [
  { value: "mobile", label: "Mobile", hint: "Phone layout on any device" },
  { value: "desktop", label: "Desktop", hint: "Computer layout on any device" },
  { value: "auto", label: "Automatic", hint: "Matches your screen width" },
];

export function ViewModeSwitch() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ViewMode>("auto");
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const current = readViewMode();
    setMode(current);
    const index = OPTIONS.findIndex((o) => o.value === current);
    requestAnimationFrame(() => optionRefs.current[index]?.focus());
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function choose(value: ViewMode) {
    applyViewMode(value);
    setMode(value);
    setOpen(false);
  }

  function onArrow(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    const index = optionRefs.current.findIndex((el) => el === document.activeElement);
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    optionRefs.current[(index + step + OPTIONS.length) % OPTIONS.length]?.focus();
  }

  return (
    <>
      <Button variant="game" size="game" type="button" aria-haspopup="dialog" aria-expanded={open} onPointerDown={playClickSoundOnPointerDown} onClick={() => setOpen(true)}>
        <span className="view-mode-label"><MonitorSmartphone aria-hidden="true" /> View mode</span>
      </Button>
      {open &&
        createPortal(
          <div className="modal-overlay" onClick={() => setOpen(false)}>
            <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="view-mode-title" onClick={(event) => event.stopPropagation()}>
              <h2 id="view-mode-title">View mode</h2>
              <div className="view-mode-options" role="radiogroup" aria-labelledby="view-mode-title" onKeyDown={onArrow}>
                {OPTIONS.map((option, index) => (
                  <Button
                    key={option.value}
                    ref={(el) => { optionRefs.current[index] = el; }}
                    variant="game"
                    size="game"
                    type="button"
                    role="radio"
                    aria-checked={mode === option.value}
                    className={mode === option.value ? "view-mode-option is-active" : "view-mode-option"}
                    onPointerDown={playClickSoundOnPointerDown}
                    onClick={() => choose(option.value)}
                  >
                    <span>{mode === option.value ? "▶ " : ""}{option.label}</span>
                  </Button>
                ))}
              </div>
              <p className="view-mode-hint">{OPTIONS.find((o) => o.value === mode)?.hint}</p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

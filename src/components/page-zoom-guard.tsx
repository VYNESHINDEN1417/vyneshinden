import { useEffect } from "react";

export function PageZoomGuard() {
  useEffect(() => {
    const inPicture = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest(".image-zoom-surface"));
    const wheel = (event: WheelEvent) => {
      if ((event.ctrlKey || event.metaKey) && !inPicture(event.target)) event.preventDefault();
    };
    const touch = (event: TouchEvent) => {
      if (event.touches.length > 1 && !inPicture(event.target)) event.preventDefault();
    };
    const gesture = (event: Event) => {
      if (!inPicture(event.target)) event.preventDefault();
    };
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ["+", "-", "=", "0"].includes(event.key)) event.preventDefault();
    };
    document.addEventListener("wheel", wheel, { passive: false });
    document.addEventListener("touchstart", touch, { passive: false });
    document.addEventListener("touchmove", touch, { passive: false });
    document.addEventListener("gesturestart", gesture, { passive: false });
    document.addEventListener("gesturechange", gesture, { passive: false });
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("wheel", wheel);
      document.removeEventListener("touchstart", touch);
      document.removeEventListener("touchmove", touch);
      document.removeEventListener("gesturestart", gesture);
      document.removeEventListener("gesturechange", gesture);
      document.removeEventListener("keydown", key);
    };
  }, []);
  return null;
}
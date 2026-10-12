export type ViewMode = "mobile" | "desktop" | "auto";

export const VIEW_MODE_KEY = "vyneshinden:view-mode";
export const VIEW_BREAKPOINT = 768;

// Runs in <head> before paint so the saved layout never flashes.
export const VIEW_MODE_BOOT_SCRIPT = `(function(){try{var m=localStorage.getItem("${VIEW_MODE_KEY}");if(m!=="mobile"&&m!=="desktop")m="auto";var d=document.documentElement;function a(){d.dataset.view=m==="auto"?(window.innerWidth<${VIEW_BREAKPOINT}?"mobile":"desktop"):m;}d.dataset.viewMode=m;a();window.__vyneApplyView=a;window.addEventListener("resize",function(){if(d.dataset.viewMode==="auto")a();});}catch(e){}})();`;

export function readViewMode(): ViewMode {
  try {
    const m = localStorage.getItem(VIEW_MODE_KEY);
    return m === "mobile" || m === "desktop" ? m : "auto";
  } catch {
    return "auto";
  }
}

export function applyViewMode(mode: ViewMode) {
  const root = document.documentElement;
  root.dataset.viewMode = mode;
  root.dataset.view = mode === "auto" ? (window.innerWidth < VIEW_BREAKPOINT ? "mobile" : "desktop") : mode;
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {
    // Storage may be blocked; the mode still applies for this visit.
  }
}

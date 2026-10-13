export type PortfolioTheme = "dark" | "light";
export const THEME_KEY = "vyneshinden:theme";
export const THEME_BOOT_SCRIPT = `(function(){var t="dark";try{if(localStorage.getItem("${THEME_KEY}")==="light")t="light";}catch(e){}document.documentElement.dataset.theme=t;})();`;

export function readTheme(): PortfolioTheme {
  return document.documentElement.dataset["theme"] === "light" ? "light" : "dark";
}

export function applyTheme(theme: PortfolioTheme) {
  document.documentElement.dataset["theme"] = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* Colors still apply if storage is unavailable. */ }
}
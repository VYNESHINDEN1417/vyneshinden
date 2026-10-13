import { useEffect, useRef, useState } from "react";
import splashes from "@/assets/splashes.json";

export function TitleSplash() {
  const [text, setText] = useState("");
  const label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let previous = "";
    try { previous = sessionStorage.getItem("vyneshinden:last-splash") ?? ""; } catch { /* Storage is optional. */ }
    const choices = splashes.filter((line) => line !== previous);
    const next = choices[Math.floor(Math.random() * choices.length)] ?? "Awesome!";
    setText(next);
    try { sessionStorage.setItem("vyneshinden:last-splash", next); } catch { /* Storage is optional. */ }
  }, []);
  useEffect(() => {
    const element = label.current;
    const parent = element?.parentElement;
    if (!element || !parent || !text) return;
    const fit = () => {
      element.style.fontSize = "14px";
      if (element.scrollWidth > parent.clientWidth) {
        element.style.fontSize = `${14 * parent.clientWidth / element.scrollWidth}px`;
      }
    };
    const observer = new ResizeObserver(fit);
    observer.observe(parent);
    void document.fonts.ready.then(fit);
    fit();
    return () => observer.disconnect();
  }, [text]);
  return <span className="title-splash"><span ref={label}>{text}</span></span>;
}
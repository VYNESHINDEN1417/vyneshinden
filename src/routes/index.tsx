import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/theme-switch";
import { ViewModeSwitch } from "@/components/view-mode-switch";
import { portfolioHead, markButtonClick, playClickSoundOnPointerDown } from "@/components/portfolio";

export const Route = createFileRoute("/")({
  head: () => portfolioHead("VYNESHINDEN — Portfolio", "Enter VYNESHINDEN's world. Discover the creator, explore their works, and find their social spaces."),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const timer = useRef<number | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  useEffect(() => {
    if (!messageOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMessageOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [messageOpen]);
  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);
  function enter(event: MouseEvent<HTMLAnchorElement>, to: "/about" | "/works" | "/social") {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (timer.current !== null) return;
    setPressed(to);
    markButtonClick(event);
    timer.current = window.setTimeout(() => {
      void navigate({ to });
    }, 150);
  }
  return (
    <main className="home-page">
      <div className="hero-scene">
        <img className="hero-image" src="/media/hero.gif" alt="An animated block-built forest lit by lanterns and fireflies" width={540} height={304} />
        <div className="hero-fade" />
        <h1 className="hero-title"><img src="/media/title.png" alt="VYNESHINDEN" width={1920} height={480} /></h1>
      </div>
      <div className="home-menu">
      <nav className="main-menu" aria-label="Portfolio">
        <Button variant="game" size="game" className={pressed === "/about" ? "is-pressed" : undefined} asChild><Link to="/about" onPointerDown={playClickSoundOnPointerDown} onClick={(event) => enter(event, "/about")}><span>About me</span></Link></Button>
        <Button variant="game" size="game" className={pressed === "/works" ? "is-pressed" : undefined} asChild><Link to="/works" onPointerDown={playClickSoundOnPointerDown} onClick={(event) => enter(event, "/works")}><span>My works</span></Link></Button>
        <Button variant="game" size="game" className={pressed === "/social" ? "is-pressed" : undefined} asChild><Link to="/social" onPointerDown={playClickSoundOnPointerDown} onClick={(event) => enter(event, "/social")}><span>Socials</span></Link></Button>
      </nav>
      <nav className="secondary-menu" aria-label="More">
        <ViewModeSwitch />
        <Button variant="game" size="game" type="button" onPointerDown={playClickSoundOnPointerDown} onClick={() => setMessageOpen(true)}><span>Message me</span></Button>
      </nav>
      </div>
      <ThemeSwitch />
      {messageOpen &&
        createPortal(
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Message me" onClick={() => setMessageOpen(false)}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
              <h2>Message me</h2>
              <p>Placeholder text. Your message form will live here — drop your details in and this popup will be wired up next.</p>
              <Button variant="game" size="game" type="button" onPointerDown={playClickSoundOnPointerDown} onClick={() => setMessageOpen(false)}><span>Close</span></Button>
            </div>
          </div>,
          document.body,
        )}
      <footer className="portfolio-footer"><p>VYNESHINDEN portfolio is a personal Minecraft building portfolio created to preserve my creations and document my presence in the Minecraft building community.</p></footer>
    </main>
  );
}

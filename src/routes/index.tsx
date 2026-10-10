import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { portfolioHead, markButtonClick, playClickSound } from "@/components/portfolio";
import hero from "@/assets/hero.gif.asset.json";
import title from "@/assets/title.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => portfolioHead("VYNESHINDEN — Portfolio", "Enter VYNESHINDEN's world. Discover the creator, explore their works, and find their social spaces."),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const timer = useRef<number | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);
  function enter(event: MouseEvent<HTMLAnchorElement>, to: "/about" | "/works" | "/social") {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (timer.current !== null) return;
    setPressed(to);
    playClickSound();
    markButtonClick(event);
    timer.current = window.setTimeout(() => {
      void navigate({ to });
    }, 150);
  }
  return (
    <main className="home-page">
      <div className="hero-scene">
        <img className="hero-image" src={hero.url} alt="An animated block-built forest lit by lanterns and fireflies" width={540} height={304} />
        <div className="hero-fade" />
        <h1 className="hero-title"><img src={title.url} alt="VYNESHINDEN" width={1920} height={480} /></h1>
      </div>
      <nav className="main-menu" aria-label="Portfolio">
        <Button variant="game" size="game" className={pressed === "/about" ? "is-pressed" : undefined} asChild><Link to="/about" onClick={(event) => enter(event, "/about")}><span>About me</span></Link></Button>
        <Button variant="game" size="game" className={pressed === "/works" ? "is-pressed" : undefined} asChild><Link to="/works" onClick={(event) => enter(event, "/works")}><span>My works</span></Link></Button>
        <Button variant="game" size="game" className={pressed === "/social" ? "is-pressed" : undefined} asChild><Link to="/social" onClick={(event) => enter(event, "/social")}><span>Social</span></Link></Button>
      </nav>
      <footer className="portfolio-footer">VYNESHINDEN</footer>
    </main>
  );
}

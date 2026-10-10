import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import title from "@/assets/title.png.asset.json";
import placeholderWorld from "@/assets/placeholder-world.jpg";
import clickSound from "@/assets/click.mp3.asset.json";

// Run the sequence in the persistent root, independently of route mounting.
const BUTTON_ANIMATION_MS = 150;
const LOADING_MS = 1300;

let clickAudio: HTMLAudioElement | null = null;

export function playClickSound() {
  try {
    if (!clickAudio) clickAudio = new Audio(clickSound.url);
    clickAudio.currentTime = 0;
    void clickAudio.play().catch(() => {});
  } catch {
    // Sound is a nice-to-have; ignore playback failures.
  }
}

export function markButtonClick(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  playClickSound();
  window.dispatchEvent(new CustomEvent("portfolio:enter", {
    detail: new URL(event.currentTarget.href).pathname,
  }));
}

export function LoadingScreen({ pathname }: { pathname: string }) {
  const [visible, setVisible] = useState(false);
  const [covered, setCovered] = useState(true);
  const timers = useRef<number[]>([]);
  const previousPath = useRef(pathname);
  const pendingPath = useRef<string | null>(null);
  const clearTimers = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }, []);
  const start = useCallback((waitForPress = false) => {
    clearTimers();
    setCovered(!waitForPress);
    if (waitForPress) {
      timers.current.push(window.setTimeout(() => setCovered(true), BUTTON_ANIMATION_MS));
    }
    setVisible(false);
    timers.current.push(window.setTimeout(() => {
      setVisible(true);
      timers.current.push(window.setTimeout(() => {
        setCovered(false);
        setVisible(false);
      }, LOADING_MS));
    }, BUTTON_ANIMATION_MS));
  }, [clearTimers]);
  useEffect(() => {
    const enter = (event: Event) => {
      pendingPath.current = (event as CustomEvent<string>).detail;
      start(true);
    };
    window.addEventListener("portfolio:enter", enter);
    start();
    return () => {
      window.removeEventListener("portfolio:enter", enter);
      clearTimers();
    };
  }, [start, clearTimers]);
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    if (pendingPath.current === pathname) {
      pendingPath.current = null;
      return; // The click already started the timer; never restart it on arrival.
    }
    pendingPath.current = null;
    if (pathname === "/") {
      clearTimers();
      setCovered(false);
      setVisible(false);
    } else {
      start();
    }
  }, [pathname, start, clearTimers]);
  if (!covered) return null;
  return (
    <div className="loading-cover" aria-busy="true">
      {visible && (
    <div className="loading-screen" role="status" aria-label="Loading level, building terrain">
      <div className="loading-center">
        <p>Loading level</p>
        <p>Building terrain</p>
        <div className="loading-track" aria-hidden="true"><div className="loading-fill" /></div>
      </div>
    </div>
      )}
    </div>
  );
}

export function PortfolioPage({ section }: { section: "About me" | "My works" | "Social" }) {
  return (
    <main className="detail-page">
      <header className="detail-header">
        <Button variant="ghost" asChild><Link to="/" onClick={playClickSound}><ArrowLeft /> Back</Link></Button>
        <Link to="/" onClick={playClickSound} aria-label="VYNESHINDEN home"><img className="detail-logo" src={title.url} alt="VYNESHINDEN" /></Link>
        <span className="header-spacer" aria-hidden="true" />
      </header>
      <div className="detail-content">
        <p className="section-label">VYNESHINDEN / PORTFOLIO</p>
        <h1>{section}</h1>
        <img className="placeholder-image" src={placeholderWorld} alt="Placeholder world scene" />
        <div className="placeholder-copy"><span className="section-label">COMING SOON</span><h2>Placeholder title</h2><p>Placeholder description. {section === "About me" ? "A little about me, my story, and what I love creating." : section === "My works" ? "A space for my projects, creations, and favorite builds." : "A space for my social links and the places you can find me."}</p></div>
      </div>
    </main>
  );
}

export function portfolioHead(title: string, description: string) {
  return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}
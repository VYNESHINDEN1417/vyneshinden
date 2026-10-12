import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShipImage } from "@/components/image-preview";
import clickSound from "@/assets/button-trim.wav";

// Run the sequence in the persistent root, independently of route mounting.
const BUTTON_ANIMATION_MS = 150;
const LOADING_MS = 1300;

let clickAudio: HTMLAudioElement | null = null;

function getClickAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!clickAudio) {
    clickAudio = new Audio(clickSound);
    // Warm the file up so the first press never waits on a download.
    clickAudio.preload = "auto";
    clickAudio.load();
  }
  return clickAudio;
}

export function playClickSound() {
  try {
    const audio = getClickAudio();
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    // Sound is a nice-to-have; ignore playback failures.
  }
}

export function playClickSoundOnPointerDown(event: ReactPointerEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  playClickSound();
}

export function markButtonClick(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
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
        <Button variant="ghost" asChild><Link to="/" onPointerDown={playClickSoundOnPointerDown}><ArrowLeft /> Back</Link></Button>
        <Link to="/" onPointerDown={playClickSoundOnPointerDown} aria-label="VYNESHINDEN home"><img className="detail-logo" src="/media/title.png" alt="VYNESHINDEN" /></Link>
        <span className="header-spacer" aria-hidden="true" />
      </header>
      <div className="detail-content">
        <p className="section-label">VYNESHINDEN / PORTFOLIO</p>
        <h1>{section}</h1>
        {section === "About me" ? <>
          <section className="about-intro">
            <div className="placeholder-copy"><span className="section-label">COMING SOON</span><h2>Placeholder title</h2><p>Placeholder description. A little about me, my story, and what I love creating.</p></div>
            <img className="about-portrait" src="/media/portrait.jpg" alt="Timothy Joseph Lomibao" width={768} height={768} />
          </section>
          <hr className="about-divider" />
          <div className="about-paragraphs">
            <p>This is placeholder text for a future introduction about my creative journey. Here, I will share the experiences, interests, and inspirations that shape the things I make. From early ideas to finished projects, this space will offer a closer look at my perspective, the lessons I am learning, and the possibilities I hope to explore through my work over time.</p>
            <p>This is placeholder text for more details about my interests and future goals. Here, I will describe the projects I enjoy, the skills I want to develop, and the people who inspire me. This section will grow alongside my portfolio, bringing together personal reflections, creative experiments, and meaningful milestones that help tell the story behind each new thing I create.</p>
          </div>
        </> : <>
          <ShipImage />
          <div className="placeholder-copy"><span className="section-label">COMING SOON</span><h2>Placeholder title</h2><p>Placeholder description. A space for my projects, creations, and favorite builds.</p></div>
        </>}
      </div>
    </main>
  );
}

export function portfolioHead(title: string, description: string) {
  return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}
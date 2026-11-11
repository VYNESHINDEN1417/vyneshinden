import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectGallery } from "@/components/image-preview";
import { ThemeSwitch } from "@/components/theme-switch";
import { Panorama } from "@/components/panorama";
import { PROJECTS, type PortfolioProject } from "@/lib/projects";
import clickSound from "@/assets/button-trim.wav";

// Run the sequence in the persistent root, independently of route mounting.
const BUTTON_ANIMATION_MS = 150;
const LOADING_MS = 1300;
const RETURN_LOADING_MS = 1200;

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

  // A pointer-down is not necessarily a click: touch scrolling and swiping
  // can begin on top of a button. Only play after a short, stationary tap.
  const target = event.currentTarget;
  const pointerId = event.pointerId;
  const startX = event.clientX;
  const startY = event.clientY;
  const onPointerUp = (upEvent: PointerEvent) => {
    if (upEvent.pointerId !== pointerId) return;
    cleanup();
    const distance = Math.hypot(upEvent.clientX - startX, upEvent.clientY - startY);
    const releasedInside = upEvent.target instanceof Node && target.contains(upEvent.target);
    if (distance <= 10 && releasedInside) playClickSound();
  };
  const cleanup = () => {
    window.removeEventListener("pointerup", onPointerUp, true);
    window.removeEventListener("pointercancel", cleanup, true);
  };
  window.addEventListener("pointerup", onPointerUp, true);
  window.addEventListener("pointercancel", cleanup, true);
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

export function PortfolioPage({ section, project }: { section: "About me" | "My works" | "Social"; project?: PortfolioProject }) {
  const isProjectList = section === "My works" && !project;
  const [night, setNight] = useState(false);

  useEffect(() => {
    if (!isProjectList) return;
    const savedNight = window.localStorage.getItem("vyneshinden-button-theme") === "dark";
    setNight(savedNight);
    document.documentElement.dataset.buttonTheme = savedNight ? "dark" : "light";
  }, [isProjectList]);

  function toggleNight() {
    const nextNight = !night;
    setNight(nextNight);
    document.documentElement.dataset.buttonTheme = nextNight ? "dark" : "light";
    window.localStorage.setItem("vyneshinden-button-theme", nextNight ? "dark" : "light");
  }

  return (
    <main className={isProjectList ? "detail-page detail-page--panorama" : "detail-page"}>
      {isProjectList && <div className="project-list-panorama" aria-hidden="true"><Panorama night={night} /><div className="project-list-panorama-overlay" /></div>}
      <header className="detail-header">
        <Button variant="ghost" asChild><Link to={project ? "/works" : "/"} onPointerDown={playClickSoundOnPointerDown}><ArrowLeft /> Back</Link></Button>
        <Link to="/" onPointerDown={playClickSoundOnPointerDown} aria-label="VYNESHINDEN home"><img className="detail-logo" src="/media/title.png" alt="VYNESHINDEN" /></Link>
        <span className="header-spacer" aria-hidden="true" />
      </header>
      <div className={`detail-content${isProjectList ? " detail-content--project-list" : ""}`}>
        {!isProjectList && <p className="section-label">VYNESHINDEN / PORTFOLIO</p>}
        <h1>{section}</h1>
        {section === "About me" ? <>
          <section className="about-intro">
            <div className="placeholder-copy"><span className="section-label">COMING SOON</span><h2>Hi, Im Timothy Lomibao</h2><p>KAREN FAYE BALAJADIA owner of VYNESHINDEN</p><p>Placeholder description. A little about me, my story, and what I love creating.</p></div>
            <img className="about-portrait" src="/media/portrait.jpg" alt="Timothy Joseph Lomibao" width={768} height={768} />
          </section>
          <hr className="about-divider" />
          <div className="about-paragraphs" style={{ textAlign: "justify" }}>
            <p>My Minecraft journey started with the simple joy of building whatever came to mind. Over time, that little hobby turned into something much bigger. I became fascinated with recreating real-world ships in Minecraft Bedrock, especially military vessels with their own history, shape, and details. I built everything block by block, learning through trial and error, tutorials, and plenty of patience. One of my biggest milestones was building the USS Wisconsin (BB-64) in January 2022, a project that pushed me to take my builds more seriously.</p>
            <p>I have always built on Bedrock, using a phone as my main tool rather than a powerful PC setup. That never stopped me from experimenting, improving my techniques, and taking on bigger projects. From battleships and cruisers to other scenes and ideas, every build has taught me something new. VYNESHINDEN is where I keep that journey alive: a place to share the things I have made, the progress behind them, and whatever I decide to build next. I am still learning, still experimenting, and definitely not done building.</p>
          </div>
        </> : project ? <>
          {project.images.length > 0 ? <ProjectGallery key={project.id} project={project} /> : <><h2 className="work-title">{project.title}</h2><p className="work-description">No project added yet.</p></>}
          {project.id === "1" && <p className="work-description" style={{ textAlign: "justify" }}>USS Dwight D. Eisenhower (CVN-69) is a Minecraft recreation of one of the United States Navy’s Nimitz-class aircraft carriers. This project brings the ship’s imposing profile and unmistakable carrier layout into a block-built form, preserving its identity as a modern naval flagship while presenting the build through a collection of in-game views.</p>}
          {project.id === "8" && <p className="work-description">USS Wisconsin (BB-64) is an Iowa-class battleship built for the United States Navy (USN) in the 1940s, i built this ship on January 2022. A Big Minecraft military channel on YouTube made a tutorial for this built, he's name is <span className="work-creator">CraftyFoxe/MC Military Force</span>, here is the <a className="work-video-link" href="https://youtu.be/jkjA2PICDks" target="_blank" rel="noopener noreferrer" onPointerDown={playClickSoundOnPointerDown}>VIDEO LINK</a></p>}
          {project.id === "2" && <p className="work-description" style={{ textAlign: "justify" }}>IJN Atago is a Minecraft recreation of an Imperial Japanese Navy Takao-class heavy cruiser. Known for its powerful armament, distinctive pagoda-style superstructure, and commanding silhouette, Atago represents the striking design language of Japan’s pre-war surface fleet. This project brings those defining features into a block-built form, presented through a collection of in-game views.</p>}
          {project.id === "3" && <p className="work-description" style={{ textAlign: "justify" }}>Admiral Nakhimov, originally commissioned as Kalinin, is a Kirov-class nuclear-powered guided-missile cruiser of the Soviet and Russian Navy. Its immense hull, layered superstructure, and formidable missile systems make it one of the most imposing surface combatants ever built. This Minecraft recreation translates that unmistakable profile into a block-built naval vessel.</p>}
          {project.id === "4" && <p className="work-description" style={{ textAlign: "justify" }}>Varyag, formerly known as Chervona Ukraina, is a Slava-class guided-missile cruiser built for the Soviet Navy. Recognized by its long hull, distinctive twin missile launchers, and towering bridge structure, the ship carries a bold Cold War-era silhouette. This project recreates those defining details in Minecraft, bringing the cruiser to life through a series of in-game views.</p>}
          {project.id === "5" && <p className="work-description" style={{ textAlign: "justify" }}>USS Savannah (CL-42) was a Brooklyn-class light cruiser that served with the United States Navy during the Second World War. Built around a powerful main battery and a recognizable multi-level profile, Savannah reflects the balance of speed, protection, and firepower found in American light cruiser design. This Minecraft build recreates the historic warship in a block-built form.</p>}
          {project.id === "6" && <p className="work-description" style={{ textAlign: "justify" }}>Battle of Hallelujah Mountains is a Minecraft-built scene centered on a dramatic clash among the towering formations of the Hallelujah Mountains. The project focuses on the scale and atmosphere of the setting, turning its rugged terrain into a backdrop for a large battle sequence. It brings together landscape and action in a world built block by block.</p>}
          {project.id === "7" && <p className="work-description" style={{ textAlign: "justify" }}>USS Michael Monsoor (DDG-1001) is a Zumwalt-class guided-missile destroyer of the United States Navy. Its angular stealth design, integrated superstructure, and unusually broad hull give it one of the most distinctive silhouettes in modern naval engineering. This Minecraft recreation captures the destroyer’s futuristic appearance in a block-built form, showcased through a collection of in-game views.</p>}
        </> : <>
          <nav className="projects-menu" aria-label="Projects" tabIndex={0}>
            {PROJECTS.map((item) => <Button key={item.id} variant="game" size="game" className="project-button" asChild><Link to="/works/$projectId" params={{ projectId: item.id }} onPointerDown={playClickSoundOnPointerDown}><span>
              {item.images[0] ? <img className="project-thumb" src={item.images[0].src} alt="" loading="lazy" /> : <span className="project-thumb" aria-hidden="true" />}
              <span className="project-name">{item.images.length ? item.title : `Project ${item.id}`}</span>
              <span className="project-date">MM/DD/YYYY</span>
            </span></Link></Button>)}
          </nav>
        </>}
      </div>
      {isProjectList && <ThemeSwitch night={night} onToggle={toggleNight} />}
    </main>
  );
}

export function portfolioHead(title: string, description: string) {
  return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}

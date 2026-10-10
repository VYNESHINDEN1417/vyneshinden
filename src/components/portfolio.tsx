import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import title from "@/assets/title.png.asset.json";
import placeholder from "@/assets/placeholder-world.jpg";

export function LoadingScreen() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);
  if (!loading) return null;
  return (
    <div className="loading-screen" role="status" aria-label="Loading level, building terrain">
      <div className="loading-center">
        <p>Loading level</p>
        <p>Building terrain</p>
        <div className="loading-track" aria-hidden="true"><div className="loading-fill" /></div>
      </div>
    </div>
  );
}

export function PortfolioPage({ section }: { section: "About me" | "My works" | "Social" }) {
  return (
    <main className="detail-page">
      <header className="detail-header">
        <Button variant="ghost" asChild><Link to="/"><ArrowLeft /> Back</Link></Button>
        <Link to="/" aria-label="VYNESHINDEN home"><img className="detail-logo" src={title.url} alt="VYNESHINDEN" /></Link>
        <span className="header-spacer" aria-hidden="true" />
      </header>
      <div className="detail-content">
        <p className="section-label">VYNESHINDEN / PORTFOLIO</p>
        <h1>{section}</h1>
        <img className="placeholder-image" src={placeholder} alt="Placeholder artwork: a block-built cabin beside a river at sunset" width={1280} height={720} />
        <div className="placeholder-copy"><span className="section-label">COMING SOON</span><h2>Placeholder title</h2><p>Placeholder description. {section === "About me" ? "A little about me, my story, and what I love creating." : section === "My works" ? "A space for my projects, creations, and favorite builds." : "A space for my social links and the places you can find me."}</p></div>
      </div>
    </main>
  );
}

export function portfolioHead(title: string, description: string) {
  return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}
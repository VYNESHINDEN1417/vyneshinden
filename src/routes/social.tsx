import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playClickSoundOnPointerDown, portfolioHead } from "@/components/portfolio";

export const Route = createFileRoute("/social")({
  head: () => portfolioHead("Socials — VYNESHINDEN", "Find VYNESHINDEN's social spaces and stay connected."),
  component: SocialPage,
});

const SOCIAL_LINKS = [
  { label: "TikTok", href: "https://www.tiktok.com/@vyneshinden1417?_r=1&_t=ZS-9AR87RHTmyu" },
  { label: "Facebook", href: "https://www.facebook.com/share/1EwozsuorN/" },
  { label: "Instagram", href: "https://www.instagram.com/timothykkkryn?vrfl=MTF2eHR1NWJ6Zm02eQ==" },
  { label: "X (Twitter)", href: "https://x.com/Vyneshinden1417" },
];

function SocialPage() {
  return (
    <main className="detail-page">
      <header className="detail-header">
        <Button variant="ghost" asChild><Link to="/" onPointerDown={playClickSoundOnPointerDown}><ArrowLeft /> Back</Link></Button>
        <Link to="/" onPointerDown={playClickSoundOnPointerDown} aria-label="VYNESHINDEN home"><img className="detail-logo" src="/media/title.png" alt="VYNESHINDEN" /></Link>
        <span className="header-spacer" aria-hidden="true" />
      </header>
      <div className="detail-content">
        <p className="section-label">VYNESHINDEN / PORTFOLIO</p>
        <h1>Socials</h1>
        <nav className="social-menu" aria-label="Social links">
          {SOCIAL_LINKS.map((link) => (
            <Button key={link.href} variant="game" size="game" asChild>
              <a href={link.href} target="_blank" rel="noopener noreferrer" onPointerDown={playClickSoundOnPointerDown}>
                <span>{link.label}</span>
              </a>
            </Button>
          ))}
        </nav>
      </div>
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { portfolioHead, markButtonClick } from "@/components/portfolio";
import hero from "@/assets/hero.gif.asset.json";
import title from "@/assets/title.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => portfolioHead("VYNESHINDEN — Portfolio", "Enter VYNESHINDEN's world. Discover the creator, explore their works, and find their social spaces."),
  component: Index,
});

function Index() {
  return (
    <main className="home-page">
      <div className="hero-scene">
        <img className="hero-image" src={hero.url} alt="An animated block-built forest lit by lanterns and fireflies" width={540} height={304} />
        <div className="hero-fade" />
        <h1 className="hero-title"><img src={title.url} alt="VYNESHINDEN" width={1920} height={480} /></h1>
      </div>
      <nav className="main-menu" aria-label="Portfolio">
        <Button variant="game" size="game" asChild><Link to="/about" onClick={markButtonClick}><span>About me</span></Link></Button>
        <Button variant="game" size="game" asChild><Link to="/works" onClick={markButtonClick}><span>My works</span></Link></Button>
        <Button variant="game" size="game" asChild><Link to="/social" onClick={markButtonClick}><span>Social</span></Link></Button>
      </nav>
      <footer className="portfolio-footer">VYNESHINDEN</footer>
    </main>
  );
}

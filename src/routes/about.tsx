import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage, portfolioHead } from "@/components/portfolio";
export const Route = createFileRoute("/about")({ head: () => portfolioHead("About me — VYNESHINDEN", "Meet the creator behind VYNESHINDEN. A story waiting to be shared."), component: AboutPage });
function AboutPage() { return <PortfolioPage section="About me" />; }
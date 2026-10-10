import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage, portfolioHead } from "@/components/portfolio";
export const Route = createFileRoute("/social")({ head: () => portfolioHead("Social — VYNESHINDEN", "Find VYNESHINDEN's social spaces and stay connected."), component: SocialPage });
function SocialPage() { return <PortfolioPage section="Social" />; }
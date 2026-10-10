import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage, portfolioHead } from "@/components/portfolio";
export const Route = createFileRoute("/works")({ head: () => portfolioHead("My works — VYNESHINDEN", "Explore VYNESHINDEN's projects, creations, and favorite builds."), component: WorksPage });
function WorksPage() { return <PortfolioPage section="My works" />; }
import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage, portfolioHead } from "@/components/portfolio";

export const Route = createFileRoute("/works/")({
  head: () => portfolioHead("Projects — VYNESHINDEN", "Browse VYNESHINDEN's Minecraft building projects, including USS Wisconsin and IJN ATAGO."),
  component: () => <PortfolioPage section="My works" />,
});
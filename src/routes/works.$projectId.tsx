import { createFileRoute, notFound } from "@tanstack/react-router";
import { PortfolioPage, portfolioHead } from "@/components/portfolio";
import { PROJECTS } from "@/lib/projects";

export const Route = createFileRoute("/works/$projectId")({
  loader: ({ params }) => {
    const project = PROJECTS.find((item) => item.id === params.projectId);
    if (!project) throw notFound();
    return project;
  },
  head: ({ loaderData }) => portfolioHead(`${loaderData?.title ?? "Project"} — VYNESHINDEN`, `Explore ${loaderData?.title ?? "a Minecraft project"} in VYNESHINDEN's building portfolio.`),
  component: ProjectPage,
});

function ProjectPage() {
  const project = Route.useLoaderData();
  return <PortfolioPage section="My works" project={project} />;
}
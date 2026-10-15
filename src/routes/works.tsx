import { createFileRoute, Outlet } from "@tanstack/react-router";
import { portfolioHead } from "@/components/portfolio";
export const Route = createFileRoute("/works")({ head: () => portfolioHead("My works — VYNESHINDEN", "USS Wisconsin 1.5:1 and other Minecraft builds by VYNESHINDEN."), component: WorksPage });
function WorksPage() { return <Outlet />; }
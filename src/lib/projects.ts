export type ProjectImage = { src: string; alt: string };
export type PortfolioProject = { id: string; title: string; images: ProjectImage[] };

export const PROJECTS: PortfolioProject[] = Array.from({ length: 10 }, (_, index) => {
  const number = index + 1;
  if (number === 1) return {
    id: "1", title: "1. USS WISCONSIN 1.5:1",
    images: [{ src: "/media/Ship1.jpg", alt: "USS Wisconsin block-built battleship, with overhead, side, bow, and stern views" }],
  };
  if (number === 2) return {
    id: "2", title: "2. IJN ATAGO",
    images: Array.from({ length: 7 }, (_, image) => ({
      src: `/media/ATAGO${image + 1}.jpg`, alt: `ATAGO Minecraft ship — view ${image + 1}`,
    })),
  };
  return { id: String(number), title: `Project ${number}`, images: [] };
});
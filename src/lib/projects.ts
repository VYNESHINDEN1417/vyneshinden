export type ProjectImage = { src: string; alt: string; thumbnail?: string };
export type PortfolioProject = { id: string; title: string; images: ProjectImage[] };

const entries = [
  { name: "USS DWIGHT D. EISENHOWER", count: 11 },
  { name: "IJN ATAGO", count: 7 },
  { name: "RF ADMIRAL NAKHIMOV(KALININ)", count: 6 },
  { name: "VARYAG(CHERVONA UKRAINA)", count: 7 },
  { name: "USS SAVANNAH", count: 20 },
  { name: "BATTLE OF HALLELUJAH MOUNTAINS", count: 14 },
  { name: "USS MICHAEL MONSOOR", count: 9 },
  { name: "USS WISCONSIN 1.5:1", count: 18 },
  { name: "DRAGONSHIP", count: 0 },
  { name: "VALKYRIE", count: 0 },
  { name: "SAMPSON", count: 0 },
  { name: "SCORPION", count: 0 },
];

export const PROJECTS: PortfolioProject[] = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1;
  const entry = entries[index];
  if (!entry) return { id: String(number), title: `Project ${number}`, images: [] };

  // Use files that actually exist in /public/media. The old thumbnails folder
  // was never committed, which caused broken-image icons across the project list.
  // These compact existing images keep list previews lighter than the full gallery.
  const thumbnail = number === 2
    ? "/media/ATAGO2.jpg"
    : number === 8
      ? "/media/projects/8/2.webp"
      : `/media/projects/${number}/1.webp`;

  const images: ProjectImage[] = [
    ...(number === 8
      ? [{
          src: "/media/Ship1.jpg",
          alt: "USS Wisconsin block-built battleship, with overhead, side, bow, and stern views",
          thumbnail,
        }]
      : []),
    ...Array.from({ length: entry.count }, (_, image) => ({
      src: number === 2
        ? `/media/ATAGO${image + 1}.jpg`
        : `/media/projects/${number}/${image + (number === 8 ? 2 : 1)}.webp`,
      alt: `${entry.name} — view ${image + (number === 8 ? 2 : 1)}`,
      ...(image === 0 && number !== 8 ? { thumbnail } : {}),
    })),
  ];

  return { id: String(number), title: `${number}.${entry.name}`, images };
});

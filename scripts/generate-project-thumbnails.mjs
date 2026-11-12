import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outputDir = path.join(root, "public/media/thumbnails");
const thumbnails = [
  { project: 1, source: "public/media/projects/1/1.webp" },
  { project: 2, source: "public/media/ATAGO1.jpg" },
  { project: 3, source: "public/media/projects/3/1.webp" },
  { project: 4, source: "public/media/projects/4/1.webp" },
  { project: 5, source: "public/media/projects/5/1.webp" },
  { project: 6, source: "public/media/projects/6/1.webp" },
  { project: 7, source: "public/media/projects/7/1.webp" },
  { project: 8, source: "public/media/Ship1.jpg" },
];

await mkdir(outputDir, { recursive: true });

let originalTotal = 0;
let thumbnailTotal = 0;

for (const item of thumbnails) {
  const sourcePath = path.join(root, item.source);
  const outputPath = path.join(outputDir, `project-${item.project}.webp`);
  const sourceInfo = await stat(sourcePath);

  await sharp(sourcePath)
    .rotate()
    .resize(320, 220, {
      fit: "cover",
      position: "centre",
      withoutEnlargement: true,
    })
    .webp({ quality: 72, effort: 4 })
    .toFile(outputPath);

  const outputInfo = await stat(outputPath);
  originalTotal += sourceInfo.size;
  thumbnailTotal += outputInfo.size;
  console.log(
    `Project ${item.project}: ${(sourceInfo.size / 1024).toFixed(1)} KB → ${(outputInfo.size / 1024).toFixed(1)} KB`,
  );
}

const saved = originalTotal - thumbnailTotal;
const percentage = originalTotal ? (saved / originalTotal) * 100 : 0;
console.log(
  `Generated ${thumbnails.length} project thumbnails. Total: ${(originalTotal / 1024).toFixed(1)} KB → ${(thumbnailTotal / 1024).toFixed(1)} KB (${percentage.toFixed(1)}% smaller).`,
);

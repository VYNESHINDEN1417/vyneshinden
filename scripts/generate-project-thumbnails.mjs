import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const projectsDir = path.join(root, "public/media/projects");
const outputDir = path.join(root, "public/media/thumbnails");

// A few legacy projects keep their cover image outside the numbered project
// folders. New projects should use public/media/projects/<id>/1.webp (or any
// supported image filename); the first image is picked automatically.
const coverOverrides = new Map([
  ["2", "public/media/ATAGO1.jpg"],
  ["8", "public/media/Ship1.jpg"],
]);
const imageExtensions = new Set([".avif", ".jpeg", ".jpg", ".png", ".webp"]);

await mkdir(outputDir, { recursive: true });

const folders = await readdir(projectsDir, { withFileTypes: true });
const projectIds = new Set(
  folders.filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name)).map((entry) => entry.name),
);
for (const id of coverOverrides.keys()) projectIds.add(id);

let originalTotal = 0;
let thumbnailTotal = 0;
let generated = 0;

for (const id of [...projectIds].sort((a, b) => Number(a) - Number(b))) {
  let source = coverOverrides.get(id);

  if (!source) {
    const folder = path.join(projectsDir, id);
    const files = await readdir(folder);
    const firstImage = files
      .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (!firstImage) {
      console.warn(`Project ${id}: no supported image found; skipping thumbnail.`);
      continue;
    }
    source = path.relative(root, path.join(folder, firstImage));
  }

  const sourcePath = path.join(root, source);
  const outputPath = path.join(outputDir, `project-${id}.webp`);

  try {
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
    generated += 1;
    console.log(
      `Project ${id}: ${(sourceInfo.size / 1024).toFixed(1)} KB → ${(outputInfo.size / 1024).toFixed(1)} KB`,
    );
  } catch (error) {
    throw new Error(`Could not generate thumbnail for project ${id} from ${source}: ${error.message}`);
  }
}

const saved = originalTotal - thumbnailTotal;
const percentage = originalTotal ? (saved / originalTotal) * 100 : 0;
console.log(
  `Generated ${generated} project thumbnails. Total: ${(originalTotal / 1024).toFixed(1)} KB → ${(thumbnailTotal / 1024).toFixed(1)} KB (${percentage.toFixed(1)}% smaller).`,
);

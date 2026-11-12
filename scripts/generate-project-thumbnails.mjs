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
const thumbnailWidths = [320, 640, 960];
const quality = 72;

await mkdir(outputDir, { recursive: true });

const folders = await readdir(projectsDir, { withFileTypes: true });
const projectIds = new Set(
  folders.filter((entry) => entry.isDirectory() && /^\\d+$/.test(entry.name)).map((entry) => entry.name),
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

  try {
    const sourceInfo = await stat(sourcePath);
    let largestVariantSize = 0;

    for (const width of thumbnailWidths) {
      const outputPath = path.join(outputDir, `project-${id}-${width}.webp`);
      await sharp(sourcePath)
        .rotate()
        .resize(width, Math.round(width * 220 / 320), {
          fit: "cover",
          position: "centre",
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 4 })
        .toFile(outputPath);

      const outputInfo = await stat(outputPath);
      thumbnailTotal += outputInfo.size;
      largestVariantSize = Math.max(largestVariantSize, outputInfo.size);
    }

    originalTotal += sourceInfo.size;
    generated += 1;
    console.log(
      `Project ${id}: original ${(sourceInfo.size / 1024).toFixed(1)} KB; largest responsive variant ${(largestVariantSize / 1024).toFixed(1)} KB`,
    );
  } catch (error) {
    throw new Error(`Could not generate thumbnails for project ${id} from ${source}: ${error.message}`);
  }
}

const saved = originalTotal - thumbnailTotal;
const percentage = originalTotal ? (saved / originalTotal) * 100 : 0;
console.log(
  `Generated ${generated} projects × ${thumbnailWidths.length} responsive sizes. Combined variants: ${(originalTotal / 1024).toFixed(1)} KB source total vs ${(thumbnailTotal / 1024).toFixed(1)} KB across all variants (${percentage.toFixed(1)}% aggregate difference; each visitor downloads only one size).`,
);

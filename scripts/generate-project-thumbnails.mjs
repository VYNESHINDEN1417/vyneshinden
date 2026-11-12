import { readdir, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const projectsDir = path.join(root, "public/media/projects");
const outputDir = path.join(root, "public/media/thumbnails");

// Legacy covers live outside their numbered project folders.
const coverOverrides = new Map([
  ["2", "public/media/ATAGO1.jpg"],
  ["8", "public/media/Ship1.jpg"],
]);
const imageExtensions = new Set([".avif", ".jpeg", ".jpg", ".png", ".webp"]);
const thumbnailWidths = [320, 640, 960];
const targetBytesRatio = 0.10; // Aim for at least 90% fewer bytes than the source.
const qualitySteps = [72, 68, 64, 60, 56, 52, 48];

await mkdir(outputDir, { recursive: true });

const folders = await readdir(projectsDir, { withFileTypes: true });
const projectIds = new Set(
  folders.filter((entry) => entry.isDirectory() && /^\\d+$/.test(entry.name)).map((entry) => entry.name),
);
for (const id of coverOverrides.keys()) projectIds.add(id);

let generated = 0;
let variantsMeetingTarget = 0;
let totalVariants = 0;

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
    const targetBytes = Math.floor(sourceInfo.size * targetBytesRatio);
    const results = [];

    for (const width of thumbnailWidths) {
      const outputPath = path.join(outputDir, `project-${id}-${width}.webp`);
      let bestBuffer = null;
      let chosenQuality = qualitySteps[0];

      // Lower quality gradually, stopping as soon as the 90%-smaller byte
      // target is met. Never push quality below the defined visual floor.
      for (const quality of qualitySteps) {
        const buffer = await sharp(sourcePath)
          .rotate()
          .resize(width, Math.round(width * 220 / 320), {
            fit: "cover",
            position: "centre",
            withoutEnlargement: true,
          })
          .webp({ quality, effort: 5 })
          .toBuffer();

        bestBuffer = buffer;
        chosenQuality = quality;
        if (buffer.length <= targetBytes) break;
      }

      // If the source is already highly compressed or unusually small, retain
      // the best result at quality 48 instead of crushing image clarity.
      await writeFile(outputPath, bestBuffer);
      const reduction = sourceInfo.size ? (1 - bestBuffer.length / sourceInfo.size) * 100 : 0;
      const metTarget = bestBuffer.length <= targetBytes;
      totalVariants += 1;
      if (metTarget) variantsMeetingTarget += 1;
      results.push(`${width}px ${(reduction).toFixed(1)}% reduction, q${chosenQuality}${metTarget ? "" : " (best quality-preserving effort; target not feasible)"}`);
    }

    generated += 1;
    console.log(`Project ${id}: ${results.join(" | ")}`);
  } catch (error) {
    throw new Error(`Could not generate thumbnails for project ${id} from ${source}: ${error.message}`);
  }
}

console.log(
  `Generated responsive thumbnails for ${generated} projects. ${variantsMeetingTarget}/${totalVariants} variants met the 90% byte-reduction target. Every visitor downloads only the single size selected by the browser; original gallery images remain untouched.`,
);

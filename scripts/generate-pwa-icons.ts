/**
 * Regenera los PNG de PWA desde public/pwa/icon.svg
 * Uso: npx tsx scripts/generate-pwa-icons.ts
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";

const root = join(process.cwd(), "public", "pwa");
const svg = readFileSync(join(root, "icon.svg"));

async function main() {
  await sharp(svg).resize(192, 192).png().toFile(join(root, "icon-192.png"));
  await sharp(svg).resize(512, 512).png().toFile(join(root, "icon-512.png"));
  console.log("PWA icons generated: icon-192.png, icon-512.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

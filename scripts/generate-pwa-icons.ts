/**
 * Regenera iconos de marca (PWA, favicon, apple-touch).
 * Uso: npx tsx scripts/generate-pwa-icons.ts
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const pwaDir = join(process.cwd(), "public", "pwa");
const appDir = join(process.cwd(), "app");
const publicDir = join(process.cwd(), "public");
const svg = readFileSync(join(pwaDir, "icon.svg"));

async function main() {
  const favicon32 = await sharp(svg).resize(32, 32).png().toBuffer();
  const apple180 = await sharp(svg).resize(180, 180).png().toBuffer();

  await sharp(svg).resize(192, 192).png().toFile(join(pwaDir, "icon-192.png"));
  await sharp(svg).resize(512, 512).png().toFile(join(pwaDir, "icon-512.png"));

  writeFileSync(join(appDir, "favicon.ico"), favicon32);
  writeFileSync(join(publicDir, "favicon.ico"), favicon32);
  writeFileSync(join(appDir, "icon.png"), favicon32);
  writeFileSync(join(appDir, "apple-icon.png"), apple180);

  console.log(
    "Icons generated: pwa/icon-*.png, app/favicon.ico, app/icon.png, app/apple-icon.png, public/favicon.ico"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

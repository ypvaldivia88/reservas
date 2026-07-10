/**
 * Download optional local copies of curated placeholder images.
 * Runtime uses Unsplash CDN URLs in MongoDB — not these files.
 *
 * Usage: npx tsx scripts/download-placeholders.ts [--force]
 */
import "./load-env";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { listPlaceholderDownloadTargets } from "../lib/placeholder-config";

const root = process.cwd();

async function isValidJpeg(filePath: string): Promise<boolean> {
  try {
    const buf = await readFile(filePath);
    return buf.length > 1000 && buf[0] === 0xff && buf[1] === 0xd8;
  } catch {
    return false;
  }
}

async function download(
  url: string,
  outputPath: string,
  purpose: string,
  force = false
): Promise<void> {
  if (!force && (await isValidJpeg(outputPath))) {
    console.log(`skip  ${outputPath}`);
    return;
  }

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${purpose} → ${outputPath}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 1000) {
    throw new Error(`Invalid image payload for ${purpose}`);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);
  console.log(`saved ${outputPath} — ${purpose} (${buffer.length} bytes)`);
}

async function main() {
  const force = process.argv.includes("--force");
  const targets = listPlaceholderDownloadTargets();

  console.log(
    force
      ? `Force re-downloading ${targets.length} images...`
      : `Downloading missing images (${targets.length} slots)...`
  );

  for (const item of targets) {
    await download(
      item.url,
      path.join(root, item.outputPath),
      item.purpose,
      force
    );
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

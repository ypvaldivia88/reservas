/**
 * Download optional local copies of curated placeholder images.
 * Runtime does NOT use these files — tenants get Unsplash CDN URLs in MongoDB.
 *
 * Usage: node scripts/download-placeholders.mjs [--force]
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const targets = [
  {
    template: "manicure",
    file: "hero",
    purpose: "Salon interior / manicure atmosphere",
    url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1400&q=85&auto=format&fit=crop",
  },
  {
    template: "manicure",
    file: "gel",
    purpose: "Gel manicure",
    url: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "manicure",
    file: "rubber",
    purpose: "Builder gel",
    url: "https://images.unsplash.com/photo-1519014815656-a63f1269d4e8?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "manicure",
    file: "dipping",
    purpose: "Dip powder",
    url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "manicure",
    file: "pedicure",
    purpose: "Pedicure",
    url: "https://images.unsplash.com/photo-1519415517518-0b308632220f?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "peluqueria",
    file: "hero",
    purpose: "Hair salon",
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=85&auto=format&fit=crop",
  },
  {
    template: "peluqueria",
    file: "corte",
    purpose: "Haircut",
    url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "peluqueria",
    file: "color",
    purpose: "Hair color",
    url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a7e0?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "peluqueria",
    file: "peinado",
    purpose: "Styling",
    url: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "peluqueria",
    file: "tratamiento",
    purpose: "Treatment",
    url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "barberia",
    file: "hero",
    purpose: "Barbershop",
    url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1400&q=85&auto=format&fit=crop",
  },
  {
    template: "barberia",
    file: "clasico",
    purpose: "Classic cut",
    url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "barberia",
    file: "fade",
    purpose: "Skin fade",
    url: "https://images.unsplash.com/photo-1605497788043-5f32c05005a3?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "barberia",
    file: "barba",
    purpose: "Beard trim",
    url: "https://images.unsplash.com/photo-1621605813561-0955f4a9c781?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "barberia",
    file: "combo",
    purpose: "Cut + beard",
    url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "tatuajes",
    file: "hero",
    purpose: "Tattoo studio",
    url: "https://images.unsplash.com/photo-1590246814883-57c511a30dcb?w=1400&q=85&auto=format&fit=crop",
  },
  {
    template: "tatuajes",
    file: "pequeno",
    purpose: "Small tattoo",
    url: "https://images.unsplash.com/photo-1611501275019-8b3f915508e3?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "tatuajes",
    file: "mediano",
    purpose: "Medium tattoo",
    url: "https://images.unsplash.com/photo-1565058530932-860b69e3d267?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "tatuajes",
    file: "grande",
    purpose: "Large tattoo",
    url: "https://images.unsplash.com/photo-1598372297313-7331c00d0e52?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "tatuajes",
    file: "consulta",
    purpose: "Design consult",
    url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc9?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "generic",
    file: "hero",
    purpose: "Small business",
    url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1400&q=85&auto=format&fit=crop",
  },
  {
    template: "generic",
    file: "basico",
    purpose: "Standard service",
    url: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900&q=85&auto=format&fit=crop",
  },
  {
    template: "generic",
    file: "premium",
    purpose: "Premium service",
    url: "https://images.unsplash.com/photo-1521737711862-ea3e0517275f?w=900&q=85&auto=format&fit=crop",
  },
];

async function isValidJpeg(filePath) {
  try {
    const buf = await readFile(filePath);
    return buf.length > 1000 && buf[0] === 0xff && buf[1] === 0xd8;
  } catch {
    return false;
  }
}

async function download(url, outputPath, purpose, force = false) {
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
  console.log(
    force
      ? "Force re-downloading all placeholder images..."
      : "Downloading missing placeholder images..."
  );

  for (const item of targets) {
    const outputPath = path.join(
      root,
      "public",
      "placeholders",
      item.template,
      `${item.file}.jpg`
    );
    await download(item.url, outputPath, item.purpose, force);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

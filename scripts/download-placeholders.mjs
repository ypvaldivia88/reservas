/**
 * Download bundled template placeholder images into public/placeholders/.
 * Usage: node scripts/download-placeholders.mjs
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const ASSETS = {
  manicure: {
    hero: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1400&q=85&auto=format&fit=crop",
    services: {
      gel: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=900&q=85&auto=format&fit=crop",
      rubber: "https://images.unsplash.com/photo-1519014815656-a63f1269d4e8?w=900&q=85&auto=format&fit=crop",
      dipping: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=85&auto=format&fit=crop",
      pedicure: "https://images.unsplash.com/photo-1519415517518-0b308632220f?w=900&q=85&auto=format&fit=crop",
    },
  },
  peluqueria: {
    hero: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=85&auto=format&fit=crop",
    services: {
      corte: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=900&q=85&auto=format&fit=crop",
      color: "https://images.unsplash.com/photo-1522337360788-8b13dee7a7e0?w=900&q=85&auto=format&fit=crop",
      peinado: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=900&q=85&auto=format&fit=crop",
      tratamiento: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=900&q=85&auto=format&fit=crop",
    },
  },
  barberia: {
    hero: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1400&q=85&auto=format&fit=crop",
    services: {
      clasico: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=900&q=85&auto=format&fit=crop",
      fade: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=900&q=85&auto=format&fit=crop",
      barba: "https://images.unsplash.com/photo-1621605813561-0955f4a9c781?w=900&q=85&auto=format&fit=crop",
      combo: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=900&q=85&auto=format&fit=crop",
    },
  },
  tatuajes: {
    hero: "https://images.unsplash.com/photo-1590246814883-57c511a30dcb?w=1400&q=85&auto=format&fit=crop",
    services: {
      pequeno: "https://images.unsplash.com/photo-1611501275019-8b3f915508e3?w=900&q=85&auto=format&fit=crop",
      mediano: "https://images.unsplash.com/photo-1565058530932-860b69e3d267?w=900&q=85&auto=format&fit=crop",
      grande: "https://images.unsplash.com/photo-1598372297313-7331c00d0e52?w=900&q=85&auto=format&fit=crop",
      consulta: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdcc9?w=900&q=85&auto=format&fit=crop",
    },
  },
  generic: {
    hero: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1400&q=85&auto=format&fit=crop",
    services: {
      basico: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&q=85&auto=format&fit=crop",
      premium: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900&q=85&auto=format&fit=crop",
    },
  },
};

const SERVICE_FILES = {
  manicure: ["gel", "rubber", "dipping", "pedicure"],
  peluqueria: ["corte", "color", "peinado", "tratamiento"],
  barberia: ["clasico", "fade", "barba", "combo"],
  tatuajes: ["pequeno", "mediano", "grande", "consulta"],
  generic: ["basico", "premium"],
};

async function isValidJpeg(filePath) {
  try {
    const buf = await readFile(filePath);
    return buf.length > 1000 && buf[0] === 0xff && buf[1] === 0xd8;
  } catch {
    return false;
  }
}

async function download(url, outputPath, force = false) {
  if (!force && (await isValidJpeg(outputPath))) {
    console.log(`skip  ${outputPath}`);
    return;
  }

  let res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    const seed = path.basename(outputPath, ".jpg");
    const fallback = `https://picsum.photos/seed/${seed}/900/900`;
    console.warn(`retry ${outputPath} via picsum (${res.status})`);
    res = await fetch(fallback, { redirect: "follow" });
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${outputPath}`);
  }

  const contentType = res.headers.get("content-type") || "";
  const buffer = Buffer.from(await res.arrayBuffer());

  if (!contentType.includes("image") && buffer.length < 1000) {
    throw new Error(`Invalid image payload for ${url}`);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);
  console.log(`saved ${outputPath} (${buffer.length} bytes)`);
}

async function main() {
  const force = process.argv.includes("--force");

  for (const [template, config] of Object.entries(ASSETS)) {
    const heroPath = path.join(root, "public", "placeholders", template, "hero.jpg");
    await download(config.hero, heroPath, force);

    for (const file of SERVICE_FILES[template]) {
      const servicePath = path.join(
        root,
        "public",
        "placeholders",
        template,
        `${file}.jpg`
      );
      await download(config.services[file], servicePath, force);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

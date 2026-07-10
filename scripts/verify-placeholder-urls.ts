/**
 * Verify all curated placeholder Unsplash URLs return HTTP 200.
 * Usage: npx tsx scripts/verify-placeholder-urls.ts
 */
import { listPlaceholderDownloadTargets } from "../lib/placeholder-config";

async function main() {
  const targets = listPlaceholderDownloadTargets();
  let failed = 0;

  for (const item of targets) {
    const res = await fetch(item.url, { redirect: "follow" });
    const ok = res.status === 200;
    console.log(
      ok ? "OK " : "BAD",
      `${item.template}/${item.file}`.padEnd(22),
      item.purpose
    );
    if (!ok) {
      failed += 1;
      console.log("     ", res.status, item.url);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} broken URL(s). Run with UNSPLASH_ACCESS_KEY or update curated IDs.`);
    process.exit(1);
  }

  console.log(`\nAll ${targets.length} curated URLs OK.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

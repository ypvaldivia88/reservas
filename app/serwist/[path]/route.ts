import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
    esbuildOptions: {
      target: "es2022",
    },
    additionalPrecacheEntries: [
      { url: "/~offline", revision },
      { url: "/admin", revision },
      { url: "/admin/calendario", revision },
      { url: "/admin/calendario?view=month", revision },
      { url: "/pwa/icon-192.png", revision },
      { url: "/pwa/icon-512.png", revision },
    ],
  });

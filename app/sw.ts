/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { PAGES_CACHE_NAME } from "@serwist/turbopack/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const DAY = 24 * 60 * 60;

function expire(maxEntries: number, maxAgeSeconds: number) {
  return [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({
      maxEntries,
      maxAgeSeconds,
      maxAgeFrom: "last-used",
    }),
  ];
}

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin");
}

const CALENDAR_API_PATHS = [
  "/api/reservas",
  "/api/servicios",
  "/api/categorias",
  "/api/clientes",
  "/api/salons/current",
];

function isCalendarApi(pathname: string) {
  return CALENDAR_API_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

/**
 * Caché de Next.js para dev y prod. No usamos defaultCache en dev porque
 * Serwist lo sustituye por NetworkOnly y rompe el modo offline.
 */
const nextAppCache: RuntimeCaching[] = [
  {
    matcher: /\/_next\/static.+\.js$/i,
    handler: new CacheFirst({
      cacheName: "next-static-js-assets",
      plugins: expire(96, DAY),
    }),
  },
  {
    matcher: /\.(?:css|less)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-style-assets",
      plugins: expire(48, DAY),
    }),
  },
  {
    matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-image-assets",
      plugins: expire(64, DAY * 7),
    }),
  },
  {
    matcher: /\/api\/auth\/.*/i,
    handler: new NetworkFirst({
      cacheName: "api-auth",
      networkTimeoutSeconds: 8,
    }),
  },
  {
    matcher: ({ sameOrigin, url: { pathname } }) =>
      sameOrigin && isCalendarApi(pathname),
    method: "GET",
    handler: new StaleWhileRevalidate({
      cacheName: "reservas-calendar-api",
      plugins: expire(64, DAY),
    }),
  },
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      sameOrigin &&
      isAdminPath(pathname) &&
      request.headers.get("RSC") === "1" &&
      request.headers.get("Next-Router-Prefetch") === "1",
    handler: new StaleWhileRevalidate({
      cacheName: `${PAGES_CACHE_NAME.rscPrefetch}-admin`,
      plugins: expire(48, DAY * 7),
    }),
  },
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      sameOrigin &&
      isAdminPath(pathname) &&
      request.headers.get("RSC") === "1",
    handler: new StaleWhileRevalidate({
      cacheName: `${PAGES_CACHE_NAME.rsc}-admin`,
      plugins: expire(48, DAY * 7),
    }),
  },
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      sameOrigin &&
      isAdminPath(pathname) &&
      (request.mode === "navigate" ||
        request.destination === "document" ||
        request.headers.get("Accept")?.includes("text/html")),
    handler: new StaleWhileRevalidate({
      cacheName: `${PAGES_CACHE_NAME.html}-admin`,
      plugins: expire(32, DAY * 7),
    }),
  },
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      sameOrigin &&
      !pathname.startsWith("/api/") &&
      request.headers.get("RSC") === "1" &&
      request.headers.get("Next-Router-Prefetch") === "1",
    handler: new StaleWhileRevalidate({
      cacheName: PAGES_CACHE_NAME.rscPrefetch,
      plugins: expire(32, DAY),
    }),
  },
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      sameOrigin &&
      !pathname.startsWith("/api/") &&
      request.headers.get("RSC") === "1",
    handler: new StaleWhileRevalidate({
      cacheName: PAGES_CACHE_NAME.rsc,
      plugins: expire(32, DAY),
    }),
  },
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      sameOrigin &&
      !pathname.startsWith("/api/") &&
      (request.mode === "navigate" || request.destination === "document"),
    handler: new StaleWhileRevalidate({
      cacheName: PAGES_CACHE_NAME.html,
      plugins: expire(32, DAY),
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: nextAppCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          const { pathname } = new URL(request.url);
          if (isAdminPath(pathname)) return false;
          return (
            request.mode === "navigate" || request.destination === "document"
          );
        },
      },
    ],
  },
});

serwist.addEventListeners();

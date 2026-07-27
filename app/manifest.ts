import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ReservaSalón — Panel del salón",
    short_name: "ReservaSalón",
    description:
      "Gestiona turnos, clientes y tu sitio web aunque no tengas conexión.",
    start_url: "/admin/calendario?view=month",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#faf9f7",
    theme_color: "#1a9e8f",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Calendario de turnos",
        short_name: "Turnos",
        url: "/admin/calendario?view=month",
        icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Agenda pendiente",
        short_name: "Agenda",
        url: "/admin/calendario?view=agenda&estado=pendiente",
        icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}

import type { Metadata } from "next";
import { IBM_Plex_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AdminInitializer from "@/components/AdminInitializer";
import AppHeader from "@/components/AppHeader";

const displayFont = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ReservaSalón — Reservas online para tu salón",
  description:
    "Crea la página web de tu salón, gestiona citas en línea y comparte un enlace único con tus clientes. 14 días de prueba gratis.",
  keywords: [
    "reservas",
    "salon",
    "belleza",
    "manicure",
    "agenda",
    "citas",
    "saas",
  ],
  authors: [{ name: "ReservaSalón" }],
  creator: "ReservaSalón",
  publisher: "ReservaSalón",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://reservas-taupe.vercel.app"
  ),
  openGraph: {
    title: "ReservaSalón — Reservas online para tu salón",
    description:
      "Digitaliza tu salón con reservas en línea, página web propia y panel de administración.",
    type: "website",
    locale: "es_ES",
    siteName: "ReservaSalón",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var theme = savedTheme
                    ? savedTheme
                    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-background text-foreground`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Saltar al contenido
        </a>
        <ThemeProvider>
          <AdminInitializer />
          <AppHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

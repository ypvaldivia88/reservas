import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AdminInitializer from "@/components/AdminInitializer";
import AppHeader from "@/components/AppHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReservaSalón - Plataforma de reservas para salones de belleza",
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
  openGraph: {
    title: "ReservaSalón - Plataforma de reservas para salones",
    description:
      "Digitaliza tu salón con reservas en línea, página web propia y panel de administración.",
    type: "website",
    locale: "es_ES",
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
                  // Priority: manually set theme (localStorage) > system preference
                  var savedTheme = localStorage.getItem('theme');
                  var theme;
                  if (savedTheme) {
                    // Use manually set theme if available
                    theme = savedTheme;
                  } else {
                    // Otherwise, use system preference
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`}
      >
        <ThemeProvider>
          <AdminInitializer />
          <AppHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

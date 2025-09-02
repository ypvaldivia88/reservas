import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nail Studio - Salón de Manicure Profesional",
  description:
    "El mejor salón de manicure y cuidado de uñas. Diseños únicos, productos premium y profesionales expertas. Reserva tu cita hoy.",
  keywords: [
    "manicure",
    "uñas",
    "nail art",
    "salon",
    "belleza",
    "cuidado",
    "diseños",
  ],
  authors: [{ name: "Nail Studio" }],
  creator: "Nail Studio",
  publisher: "Nail Studio",
  openGraph: {
    title: "Nail Studio - Salón de Manicure Profesional",
    description:
      "El mejor salón de manicure y cuidado de uñas. Diseños únicos, productos premium y profesionales expertas.",
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
                  var savedTheme = localStorage.getItem('theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var theme = savedTheme || systemTheme;
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

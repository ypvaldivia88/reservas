import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

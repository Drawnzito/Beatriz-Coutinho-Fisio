import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";

const fonteTitulo = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  variable: "--fonte-titulo-base",
  display: "swap",
});

const fonteCorpo = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--fonte-corpo-base",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beatriz Coutinho Fisioterapia",
  description: "Acompanhamento de exercícios e sessões",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#1f5c57",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${fonteTitulo.variable} ${fonteCorpo.variable}`}>
      <body>{children}</body>
    </html>
  );
}

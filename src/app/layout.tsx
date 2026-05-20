import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BingoProvider } from "@/context/BingoContext";
import { Navbar } from "@/components/layout/Navbar";
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
  title: "PUCESE Bingo | Partidas y cartillas profesionales",
  description:
    "Sistema profesional de bingo: sorteo en vivo, generación masiva de cartillas, PDF e impresión, validación por serial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased">
        <BingoProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
        </BingoProvider>
      </body>
    </html>
  );
}

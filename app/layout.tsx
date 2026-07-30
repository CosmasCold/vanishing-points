import type { Metadata } from "next";
import { Inter, Cinzel, Space_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap", weight: ["400","500","600","700"] });
const spaceMono = Space_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", weight: ["400","700"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://vanishingpoints.space"),
  title: "Vanishing Points | An Atlas of the Forgotten",
  description: "An interactive map of abandoned and haunted places worldwide.",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "Vanishing Points", description: "An Atlas of the Forgotten", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} ${spaceMono.variable}`}>
      <body className="antialiased min-h-screen bg-[#1a1612] text-[#ddd0bc]">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
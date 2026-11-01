import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Font untuk Heading (Judul)
const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: "--font-outfit",
  display: "swap",
});

// Font untuk Body text (Paragraf, Tabel, dll)
const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mahad Reminder",
  description: "Dashboard operasional Mahad Reminder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      {/* Daftarkan kedua variable font di sini */}
      <body className={`${spaceGrotesk.variable} ${outfit.variable} min-h-screen bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}
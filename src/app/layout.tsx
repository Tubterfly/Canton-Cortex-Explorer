// src/app/layout.tsx
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
  title: "Canton Cyber City | Neural Scanner",
  description: "Canton DevNet Blockchain Topology & Contract Analysis HUD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black`}
    >
      {/* Siyah arkaplan ve tam ekran yüksekliği garantileniyor */}
      <body className="min-h-full h-full flex flex-col bg-black text-white selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
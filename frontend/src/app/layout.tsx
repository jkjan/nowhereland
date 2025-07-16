import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/widgets/header";

export const metadata: Metadata = {
  title: "Nowhere Land",
  description: "Personal blog by Kyojun Jin - thoughts, development, and everything in between",
  keywords: ["blog", "development", "personal", "thoughts", "Korean", "developer"],
  authors: [{ name: "Kyojun Jin" }],
  openGraph: {
    title: "Nowhere Land",
    description: "Personal blog by Kyojun Jin",
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

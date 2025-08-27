import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/widgets/header";
import { Toaster } from "@/shared/ui/sonner";
import { NextIntlClientProvider } from "next-intl";

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
      <body className="antialiased h-screen overflow-hidden">
        <NextIntlClientProvider>
          <Header />
          <main
            className="max-w-7xl mx-auto"
            style={{
              padding: `var(--spacing-margin)`
            }}
          >
            <div
              className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12"
              style={{
                gap: `var(--spacing-gutter)`
              }}
            >
              {children}
            </div>
          </main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

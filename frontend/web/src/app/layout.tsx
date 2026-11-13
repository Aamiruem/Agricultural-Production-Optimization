import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { THEME_INIT_SCRIPT } from "@/context/theme-context";

import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// SEO: default metadata inherited by every page (pages override title/description).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AgriOptima — Crop & Fertilizer Recommendations",
    template: "%s | AgriOptima",
  },
  description:
    "Recommend the best crop for your soil and climate, plan fertilizer doses, and organise your fields. Built for Indian farming conditions.",
  keywords: ["crop recommendation", "fertilizer calculator", "NPK", "Indian agriculture", "kharif", "rabi"],
  openGraph: {
    type: "website",
    siteName: "AgriOptima",
    title: "AgriOptima — Crop & Fertilizer Recommendations",
    description: "Data-driven crop and fertilizer recommendations for Indian farms.",
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7faf5" },
    { media: "(prefers-color-scheme: dark)", color: "#111511" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Providers>
            <SiteHeader />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
            <SiteFooter />
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

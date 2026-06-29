import type { Metadata } from "next";
import Script from "next/script";
import { Gilda_Display, Manrope } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "../contexts/ThemeProvider";
import { ModerationProvider } from "@/features/moderation/components/ModerationProvider";

const gilda = Gilda_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gilda",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});


function ensureProtocol(url: string): string {
  if (!url) return "http://localhost:3000";
  return url.startsWith("http") ? url : `https://${url}`;
}

const siteUrl = ensureProtocol(process.env.NEXT_PUBLIC_SITE_URL ?? "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Sonder",
  description:
    "Anonymous thoughts, memories, photos, and songs pinned to places.",
  openGraph: {
    title: "Sonder",
    description:
      "Anonymous thoughts, memories, photos, and songs pinned to places.",
    siteName: "Sonder",
    type: "website",
    url: siteUrl,
    images: [
      {
        url: "/brand/sonder-logo.png",
        alt: "Sonder logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sonder",
    description:
      "Anonymous thoughts, memories, photos, and songs pinned to places.",
    images: [
      {
        url: "/brand/sonder-wordmark.png",
        alt: "Sonder wordmark",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${gilda.variable} ${manrope.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://tiles.openfreemap.org" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""} />
        <link rel="dns-prefetch" href="https://photon.komoot.io" />
      </head>
      <body className={manrope.variable}>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="89640016-d715-488a-ad0b-5ca6ff2184dc"
          strategy="afterInteractive"
        />
        <ThemeProvider>
          <ModerationProvider>{children}</ModerationProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: "font-serif text-base tracking-tight",
              style: { fontFamily: "var(--font-gilda), serif", borderRadius: "1rem", padding: "14px 20px" },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Gilda_Display, Manrope } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
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

export const metadata: Metadata = {
  title: "Sonder",
  description:
    "Anonymous thoughts, memories, photos, and songs pinned to places.",
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
      <body className={manrope.variable}>
        <ThemeProvider>
          <ModerationProvider>{children}</ModerationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

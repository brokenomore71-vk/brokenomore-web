import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand } from "./fonts";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  category: "finance",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // Each page sets its own canonical address (alternates.canonical), so it isn't set here
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark bg-[#121212] ${brand.variable}`}>
      <body className="bg-[#121212] min-h-screen text-white antialiased m-0 p-0 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

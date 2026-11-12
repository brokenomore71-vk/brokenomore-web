import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand } from "./fonts";

export const metadata: Metadata = {
  title: "BrokeNoMore",
  description: "BrokeNoMore - Your all-in-one financial tracking app. Save, split, invest and plan, all in one place.",
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

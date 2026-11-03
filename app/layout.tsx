import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrokeNoMore",
  description: "BrokeNoMore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#121212]">
      <body className="bg-[#121212] min-h-screen text-white antialiased m-0 p-0 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

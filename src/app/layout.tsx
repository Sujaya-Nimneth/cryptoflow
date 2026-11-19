import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CryptoFlow Analytics",
    template: "%s · CryptoFlow Analytics",
  },
  description:
    "Real-time cryptocurrency analytics dashboard with live price tracking, portfolio management, candlestick charts, and market alerts.",
  applicationName: "CryptoFlow Analytics",
  openGraph: {
    title: "CryptoFlow Analytics",
    description:
      "Real-time cryptocurrency analytics dashboard with live price tracking, portfolio management, candlestick charts, and market alerts.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-900 text-slate-100">{children}</body>
    </html>
  );
}

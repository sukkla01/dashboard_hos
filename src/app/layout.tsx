import type { Metadata } from "next";
import { Sarabun } from "next/font/google";

import { ThemeProvider } from "@/components/admin/ThemeProvider";
import { ThemeScript } from "@/components/admin/ThemeScript";

import "./globals.css";

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "HosXP Admin",
  description: "ระบบจัดการโรงพยาบาล HosXP Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

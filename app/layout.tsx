import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "./providers";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SplitKaroBhai - Split expenses with friends",
  description: "Split expenses with friends, roommates, and travel groups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-gray-100/30 antialiased font-sans">
        <Providers>
          <Navbar />
          <main className="pb-20 md:pb-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}


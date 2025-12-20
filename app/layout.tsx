import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Expense Splitter",
  description: "Split expenses with friends, roommates, and travel groups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}


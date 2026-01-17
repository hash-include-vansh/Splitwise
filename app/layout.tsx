import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "./providers";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { PushNotificationPrompt } from "@/components/notifications/PushNotificationPrompt";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering - never cache this layout
// This ensures cookies are read fresh on every request
export const dynamic = 'force-dynamic'

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SplitKaroBhai - Split expenses with friends",
  description: "Split expenses with friends, roommates, and travel groups",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SplitKaroBhai",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get user on server side to pass to client components
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-gray-100/30 antialiased font-sans">
        <Providers>
          <Navbar initialUser={user} />
          <main className="pb-20 md:pb-8">{children}</main>
          <InstallPrompt />
          <ServiceWorkerRegister />
          {user && <PushNotificationPrompt />}
        </Providers>
      </body>
    </html>
  );
}


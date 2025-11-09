import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AIModelProvider } from "@/contexts/AIModelContext";
import { AgentModelProvider } from "@/contexts/AgentModelContext";
import { ProviderProvider } from "@/contexts/ProviderContext";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ManifestLink from "@/components/ManifestLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ServiceNow Helper",
  description: "Get instant help with ServiceNow implementations, documentation, and scripts",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/maskable_icon_x192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      { rel: "mask-icon", url: "/maskable_icon_x192.png" }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ServiceNow Helper"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f6f6f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#f6f6f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ServiceNow Helper" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ProviderProvider>
              <SettingsProvider>
                <AIModelProvider>
                  <AgentModelProvider>
                    <ManifestLink />
                    {children}
                    <PWAInstallPrompt />
                  </AgentModelProvider>
                </AIModelProvider>
              </SettingsProvider>
            </ProviderProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

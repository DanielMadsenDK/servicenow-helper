import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AIModelProvider } from "@/contexts/AIModelContext";

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
        <link rel="icon" type="image/png" sizes="32x32" href="/maskable_icon_x48.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/maskable_icon_x48.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/maskable_icon_x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/maskable_icon_x192.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/maskable_icon_x128.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/maskable_icon_x128.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/maskable_icon_x128.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/maskable_icon_x96.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/maskable_icon_x72.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/maskable_icon_x72.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/maskable_icon_x72.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <AIModelProvider>
                {children}
              </AIModelProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

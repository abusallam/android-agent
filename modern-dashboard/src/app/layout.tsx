import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { LiveKitProvider } from "@/components/streaming/LiveKitProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Android Agent AI - Enterprise Security Platform",
  description: "Modern Android device management and monitoring platform with AI-powered intelligence",
  icons: {
    icon: [
      { url: "/logo-16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/logo-32.png",
    apple: [
      { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider defaultTheme="dark" storageKey="android-agent-theme">
          <AuthProvider>
            <LiveKitProvider>
              {children}
            </LiveKitProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

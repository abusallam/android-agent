import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Android Agent AI - Enterprise Security Platform",
  description: "Modern Android device management and monitoring platform with AI-powered intelligence",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.documentElement.classList.add('dark');
                document.body.style.backgroundColor = 'hsl(222.2 84% 4.9%)';
                document.body.style.color = 'hsl(210 40% 98%)';
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased dark bg-slate-950 text-white`}>
        <ThemeProvider defaultTheme="dark" storageKey="android-agent-theme">
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DoqSeal | AI-Powered Document Intelligence",
    template: "%s | DoqSeal"
  },
  description: "Experience the next generation of document intelligence with DoqSeal. Securely manage, analyze, and integrate AI into your workflow.",
  keywords: ["AI", "Document Intelligence", "API Management", "Workflow Automation"],
};

import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { FingerprintInitializer } from "@/components/providers/FingerprintInitializer";
import { SessionManager } from "@/components/providers/SessionManager";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <FingerprintInitializer />
          <SessionManager />
          <Toaster position="top-center" richColors />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coffee Shop POS - Complete POS Solution",
  description:
    "A comprehensive Point of Sale system for coffee shops and restaurants. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: [
    "POS",
    "Point of Sale System",
    "Coffee POS",
    "Restaurant POS",
    "Food POS",
    "Next.js POS",
    "POS Web Application",
    "Inventory Management System",
    "Billing Software",
    "Sales Management",
    "Business Management Software",
    "GST Compliant POS",
    "India POS System",
    "TypeScript POS",
    "Tailwind CSS",
    "shadcn/ui",
  ],
  authors: [{ name: "POS Development Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Coffee Shop POS",
  },
  openGraph: {
    title: "Coffee Shop POS - Complete POS Solution",
    description:
      "Comprehensive POS system for coffee shops and restaurants with GST compliance.",
    url: "https://your-pos-app.com",
    siteName: "Coffee Shop POS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffee Shop POS",
    description:
      "Modern POS system for coffee shops with GST compliance and advanced features.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POS Code Scaffold - Retail, Coffee & Garment POS Web Applications",
  description:
    "A Building POS web applications including Retail POS, Coffee POS, Garment POS, and other business management systems. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: [
    "POS",
    "Point of Sale System",
    "Retail POS",
    "Coffee POS",
    "Restaurant POS",
    "Garment POS",
    "Clothing Store POS",
    "Next.js POS",
    "POS Web Application",
    "Inventory Management System",
    "Billing Software",
    "Sales Management",
    "Business Management Software",
    "React POS",
    "TypeScript POS",
    "Tailwind CSS",
    "shadcn/ui",
  ],
  authors: [{ name: "POS Development Team" }],
  icons: {
    icon: "https://your-pos-app.com/demo.svg",
  },
  openGraph: {
    title: "POS Code Scaffold for Retail, Coffee & Garment Businesses",
    description:
      "Build modern Retail POS, Coffee POS, Garment POS, and inventory-driven business web applications using Next.js.",
    url: "https://your-pos-app.com",
    siteName: "POS Scaffold",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "POS Web Application Scaffold",
    description:
      "Modern scaffold for Retail POS, Coffee POS, Garment POS, and business management web applications.",
  },
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
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}

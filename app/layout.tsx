import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Toaster } from "sileo";
import { Navbar } from "@/app/components/layout/navbar";

export const metadata: Metadata = {
  title: "PRI Dashboard",
  description:
    "Monitor and optimize infrastructure provisioning reliability across all zones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        "h-full",
        "antialiased",
        geistMono.variable,
        "font-sans",
        spaceGrotesk.variable,
      )}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Toaster position="bottom-right" />
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="mt-10">
          <div className="max-w-7xl mx-auto px-4 lg:px-0 border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
            Made as part of the PRI HPE CPP Project
          </div>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Montserrat, Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Toaster position="bottom-right" />
        <Navbar />
        {children}
      </body>
    </html>
  );
}

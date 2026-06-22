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
import { CommandPalette } from "@/app/components/layout/command-palette";
import { EnterGate } from "@/app/components/layout/enter-gate";
import { SharedConfigGate } from "@/app/components/dashboard/shared-config-modal";

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
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistMono.variable,
        "font-sans",
        spaceGrotesk.variable,
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':true;document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}try{if(localStorage.getItem('rely-entered')==='1'){document.documentElement.classList.add('entered');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Toaster position="bottom-right" />
        <Navbar />
        <CommandPalette />
        <SharedConfigGate />
        <main className="flex-1">{children}</main>
        <EnterGate />
        <footer className="mt-10">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <hr className="border-t border-border/40" />
          </div>
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 text-center text-sm text-muted-foreground">
            Made as part of the PRI HPE CPP Project
          </div>
        </footer>
      </body>
    </html>
  );
}

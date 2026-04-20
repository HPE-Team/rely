"use client";

import { useState } from "react";
import Image from "next/image";
import { Settings } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { WeightConfig } from "@/app/components/dashboard/weight-config";
import { OnlineActivityIndicator } from "@/app/components/layout/online-activity-indicator";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-border/40 bg-background/100 bg-background sticky top-0 z-40 w-full py-4 px-4 lg:px-0 flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          className="text-sm font-medium text-foreground flex flex-row justify-center items-center gap-2"
          href="/"
        >
          <Image src="/logo.svg" alt="Logo" width={32} height={32} />
          <h1 className="text-2xl font-bold tracking-tight">
            Rel<span className="text-[#8ec5ff]">y</span>
          </h1>
        </Link>
      </div>

      <div className="flex items-center">
        <OnlineActivityIndicator />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="p-2 hover:bg-secondary/50 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
              <Settings className="w-5 h-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-xl max-h-[85vh] overflow-y-auto outline-none px-4 py-4 sm:px-8 sm:py-6">
            <DialogTitle className="sr-only">
              Configure Metric Weights
            </DialogTitle>
            <WeightConfig
                onClose={() => setOpen(false)}
                onWeightsUpdate={() => window.dispatchEvent(new Event('pri-config-changed'))}
              />
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
}

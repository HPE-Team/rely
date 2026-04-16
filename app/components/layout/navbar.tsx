'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/app/components/ui/dialog';
import { WeightConfig } from '@/app/components/dashboard/weight-config';

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full py-4 flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Image src="/logo.svg" alt="Logo" width={32} height={32} />
        <h1 className="text-xl font-bold tracking-tight">
          Provisioning Reliability Index
        </h1>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="p-2 hover:bg-secondary/50 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </button>
        </DialogTrigger>
        <DialogContent className="outline-none px-6 py-4 sm:px-12 sm:py-6">
          <DialogTitle className="sr-only">Configure Metric Weights</DialogTitle>
          <WeightConfig onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </nav>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Settings,
  BookOpen,
  ChevronDown,
  Calculator,
  Sparkles,
  Table2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { WeightConfig } from "@/app/components/dashboard/weight-config";
import { OnlineActivityIndicator } from "@/app/components/layout/online-activity-indicator";
import { ThemeToggle } from "@/app/components/layout/theme-toggle";

const DOCS_LINKS = [
  {
    href: "/docs/how-we-calculate",
    label: "How We Calculate PRI",
    icon: Calculator,
    description: "The PRI formula and scoring system",
  },
  {
    href: "/docs/how-we-generate",
    label: "How We Generate Data",
    icon: Sparkles,
    description: "Simulation pipeline and failure stages",
  },
  {
    href: "/data",
    label: "Data Browser",
    icon: Table2,
    description: "Browse, edit, and view schema",
  },
];

// Re-renders on pathname change — owns dropdown state + active highlighting
function DocsDropdown() {
  const [docsOpen, setDocsOpen] = useState(false);
  const pathname = usePathname();
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        !desktopRef.current?.contains(e.target as Node) &&
        !mobileRef.current?.contains(e.target as Node)
      ) {
        setDocsOpen(false);
      }
    }
    if (docsOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [docsOpen]);

  useEffect(() => {
    setDocsOpen(false);
  }, [pathname]);

  const isDocsActive = pathname.startsWith("/docs/") || pathname.startsWith("/data");

  return (
    <>
      {/* Desktop */}
      <div ref={desktopRef} className="relative hidden sm:block">
        <button
          onClick={() => setDocsOpen(!docsOpen)}
          className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            docsOpen || isDocsActive
              ? "text-foreground bg-secondary/50"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Docs
          <ChevronDown className={`w-3 h-3 transition-transform ${docsOpen ? "rotate-180" : ""}`} />
        </button>

        <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl border border-border/40 bg-surface-2 shadow-2xl shadow-black/40 overflow-hidden z-50 transition-all duration-200 ease-out origin-top-right ${
          docsOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}>
          <div className="p-1.5">
            {DOCS_LINKS.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active ? "bg-brand/10 text-brand" : "text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{link.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div ref={mobileRef} className="relative sm:hidden">
        <button
          onClick={() => setDocsOpen(!docsOpen)}
          aria-label="Documentation"
          className="p-2 hover:bg-secondary/50 rounded-full transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <BookOpen className="w-5 h-5" />
        </button>

        <div className={`absolute right-0 top-full mt-2 w-64 rounded-xl border border-border/40 bg-surface-2 shadow-2xl shadow-black/40 overflow-hidden z-50 transition-all duration-200 ease-out origin-top-right ${
          docsOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}>
          <div className="p-1.5">
            {DOCS_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-foreground hover:bg-secondary/50"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isWide = pathname.startsWith("/data");
  const maxWidth = isWide ? "90rem" : "80rem";

  return (
    <div className="bg-background sticky top-0 z-40 w-full">
      <nav
        className="mx-auto px-4 lg:px-8 py-4 flex items-center justify-between w-full"
        style={{ maxWidth, transition: "max-width 350ms ease" }}
      >
        <div className="flex items-center gap-3">
          <Link
            className="text-sm font-medium text-foreground flex flex-row justify-center items-center gap-2"
            href="/"
          >
            <Image src="/logo.svg" alt="Logo" width={32} height={32} />
            <h1 className="text-2xl font-bold tracking-tight">
              Rel<span className="text-brand">y</span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <DocsDropdown />
          <button
            aria-label="Search"
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="p-2 hover:bg-secondary/50 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <Search className="w-5 h-5" />
          </button>
          <OnlineActivityIndicator />
          <ThemeToggle />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="p-2 hover:bg-secondary/50 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-xl lg:max-w-3xl max-h-[85vh] lg:max-h-[90vh] overflow-hidden outline-none flex flex-col p-0 gap-0">
              <DialogTitle className="sr-only">
                Configure Metric Weights
              </DialogTitle>
              <WeightConfig
                onClose={() => setOpen(false)}
                onWeightsUpdate={() =>
                  window.dispatchEvent(new Event("pri-config-changed"))
                }
              />
            </DialogContent>
          </Dialog>
        </div>
      </nav>
      <div
        className="mx-auto px-4 lg:px-8 w-full"
        style={{ maxWidth, transition: "max-width 350ms ease" }}
      >
        <hr className="border-t border-border/40" />
      </div>
    </div>
  );
}

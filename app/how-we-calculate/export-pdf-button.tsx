"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Copy,
  FileDown,
  FileText,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { sileo } from "sileo";

export function ExportPdfButton({
  markdown,
  filename,
}: {
  markdown: string;
  filename: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setIsCopied(true);
      sileo.success({ title: "Markdown copied to clipboard", fill: "#171717" });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      sileo.error({ title: "Failed to copy markdown", fill: "#171717" });
    }
    setIsOpen(false);
  };

  const downloadMarkdown = () => {
    try {
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      sileo.success({ title: "Markdown file downloaded", fill: "#171717" });
    } catch {
      sileo.error({ title: "Failed to download markdown", fill: "#171717" });
    }
    setIsOpen(false);
  };

  const exportPdf = async () => {
    setIsExporting(true);
    setIsOpen(false);
    try {
      // Fix links in markdown for PDF context
      let processedMarkdown = markdown;
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      
      const linkMap: Record<string, string> = {
        "./PRI.md": "/how-we-calculate",
        "PRI.md": "/how-we-calculate",
        "./GENERATOR.md": "/how-we-generate",
        "GENERATOR.md": "/how-we-generate",
        "./SCHEMA.md": "/data",
        "SCHEMA.md": "/data",
      };

      for (const [md, route] of Object.entries(linkMap)) {
        const escapedMd = md.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\]\\(${escapedMd}\\)`, "g");
        processedMarkdown = processedMarkdown.replace(re, `](${baseUrl}${route})`);
      }

      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: processedMarkdown, filename }),
        cache: "no-store",
      });

      if (!res.ok) {
        const msg = await res
          .json()
          .then((j) => (typeof j?.error === "string" ? j.error : null))
          .catch(() => null);
        throw new Error(msg || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (e: unknown) {
      sileo.error({
        title: "PDF export failed",
        fill: "#171717",
        description: e instanceof Error ? e.message : "Unexpected error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`h-9 w-9 p-0 rounded-full cursor-pointer transition shadow-sm border ${
          isOpen 
            ? "bg-background/80 border-border/60 opacity-100" 
            : "bg-background/30 border-border/30 backdrop-blur-sm opacity-60 hover:opacity-100 hover:bg-background/60 hover:border-border/60"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Document actions"
        title="Actions"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MoreVertical className="w-4 h-4" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border/40 bg-[#111] shadow-2xl shadow-black/40 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={copyMarkdown}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/50 transition-colors cursor-pointer text-left"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
              <span>Copy Markdown</span>
            </button>
            
            <button
              onClick={downloadMarkdown}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/50 transition-colors cursor-pointer text-left"
            >
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span>Download MD file</span>
            </button>

            <div className="h-px bg-border/40 my-1 mx-2" />

            <button
              onClick={exportPdf}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <FileDown className="w-4 h-4 text-muted-foreground" />
              )}
              <span>Export as PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

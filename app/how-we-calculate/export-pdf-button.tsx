"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { sileo } from "sileo";

export function ExportPdfButton({
  markdown,
  filename,
}: {
  markdown: string;
  filename: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-9 w-9 p-0 rounded-full cursor-pointer disabled:cursor-not-allowed bg-background/30 border border-border/30 backdrop-blur-sm opacity-60 hover:opacity-100 hover:bg-background/60 hover:border-border/60 focus-visible:opacity-100 focus-visible:bg-background/60 focus-visible:border-border/60 transition"
      disabled={isExporting}
      onClick={async () => {
        setIsExporting(true);
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
            // Replace both the target and potentially the text if it looks like a filename
            // This is a simple regex replacement for the link targets
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
      }}
      aria-label="Download as PDF"
      title="Download PDF"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
    </Button>
  );
}

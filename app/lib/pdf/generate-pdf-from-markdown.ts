// Keep this file Node-only. It's used by API routes.

import { spawn } from "node:child_process";
import path from "node:path";

type MdToPdfOptions = {
  document_title?: string;
};

export type PdfResult =
  | {
      success: true;
      buffer: Buffer;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Generate a PDF Buffer from a Markdown string using md-to-pdf.
 *
 * We run md-to-pdf via its CLI in a separate Node process to avoid Next's
 * server/bundler path rewriting (e.g. "[project]/node_modules/..."), which can
 * break md-to-pdf's internal module resolution.
 */
export async function generatePdfFromMarkdown(
  markdown: string,
  options?: MdToPdfOptions,
): Promise<PdfResult> {
  try {
    if (!markdown || typeof markdown !== "string") {
      return { success: false, error: "Markdown content is required" };
    }

    const cli = path.join(
      process.cwd(),
      "node_modules",
      "md-to-pdf",
      "dist",
      "cli.js",
    );

    const pdfOptions = {
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "16mm",
        bottom: "20mm",
        left: "16mm",
      },
    };

    // md-to-pdf's built-in markdown.css uses ~9pt body text, which reads small for docs.
    // Override just the base size (headings/code remain relative).
    const css = "body { font-size: 11pt; }";

    const args = [
      cli,
      "--document-title",
      options?.document_title ?? "",
      "--highlight-style",
      "github",
      "--css",
      css,
      "--pdf-options",
      JSON.stringify(pdfOptions),
    ];

    const child = spawn(process.execPath, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    child.stdin.write(markdown);
    child.stdin.end();

    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    child.stdout.on("data", (d: Buffer) => chunks.push(d));
    child.stderr.on("data", (d: Buffer) => errChunks.push(d));

    const code: number = await new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("close", (c) => resolve(c ?? 1));
    });

    const stderr = Buffer.concat(errChunks).toString("utf8").trim();

    if (code !== 0) {
      return {
        success: false,
        error: stderr || `md-to-pdf failed with exit code ${code}`,
      };
    }

    const out = Buffer.concat(chunks);
    if (out.length === 0) {
      return {
        success: false,
        error: stderr || "Failed to generate PDF content",
      };
    }

    return { success: true, buffer: out };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to generate PDF",
    };
  }
}

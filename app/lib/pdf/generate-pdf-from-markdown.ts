// Keep this file Node-only. It's used by API routes.

import { mdToPdf } from "md-to-pdf";
import type { PDFOptions } from "puppeteer";
import chromium from "@sparticuz/chromium";

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
 */
export async function generatePdfFromMarkdown(
  markdown: string,
  options?: MdToPdfOptions,
): Promise<PdfResult> {
  try {
    if (!markdown || typeof markdown !== "string") {
      return { success: false, error: "Markdown content is required" };
    }

    const pdfOptions: PDFOptions = {
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

    const cfg = {
      document_title: options?.document_title ?? "",
      css,
      pdf_options: pdfOptions,
    };

    // On Vercel/serverless, Puppeteer can't download Chrome. Use Sparticuz Chromium.
    const isServerless =
      process.env.VERCEL === "1" ||
      process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

    const launch_options = isServerless
      ? {
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: true,
        }
      : undefined;

    const pdf = await mdToPdf(
      { content: markdown },
      {
        basedir: process.cwd(),
        dest: "",
        page_media_type: "print",
        document_title: cfg.document_title,
        highlight_style: "github",
        css: cfg.css,
        pdf_options: cfg.pdf_options,
        ...(launch_options ? { launch_options } : null),
      },
    );

    if (!pdf || !pdf.content) {
      return { success: false, error: "Failed to generate PDF" };
    }

    return { success: true, buffer: Buffer.from(pdf.content) };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to generate PDF",
    };
  }
}

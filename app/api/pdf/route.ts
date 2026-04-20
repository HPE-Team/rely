import { NextResponse } from "next/server";
import { generatePdfFromMarkdown } from "@/app/lib/pdf/generate-pdf-from-markdown";

export const dynamic = "force-dynamic";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9-_\.]/g, "_");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { markdown?: unknown; filename?: unknown }
      | null;

    const markdown = body?.markdown;
    const filename = body?.filename;
    if (typeof markdown !== "string" || markdown.length === 0) {
      return NextResponse.json(
        { error: "Missing markdown in request body" },
        { status: 400 },
      );
    }

    const safeName = sanitizeFilename(
      typeof filename === "string" && filename ? filename : "study-material",
    );

    const result = await generatePdfFromMarkdown(markdown, {
      document_title: safeName,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("generatePdf error", e);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

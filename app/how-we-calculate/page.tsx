import fs from "node:fs/promises";
import path from "node:path";
import { createHighlighter } from "shiki";
import { MarkdownContent } from "./markdown-content";
import { TableOfContents, type TocItem } from "./toc";
import { ExportPdfButton } from "./export-pdf-button";

const SHIKI_LANGS = [
  "ts",
  "tsx",
  "js",
  "json",
  "bash",
  "sh",
  "sql",
  "python",
  "text",
] as const;
type ShikiLang = (typeof SHIKI_LANGS)[number];

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark-default"],
      langs: [...SHIKI_LANGS],
    });
  }
  return highlighterPromise;
}

async function buildHighlightedMap(
  source: string,
): Promise<Record<string, string>> {
  const highlighter = await getHighlighter();
  const map: Record<string, string> = {};
  const re = /```([\w-]*)\n([\s\S]*?)```/g;
  for (const m of source.matchAll(re)) {
    const rawLang = (m[1] || "text").toLowerCase();
    const lang: ShikiLang = (SHIKI_LANGS as readonly string[]).includes(rawLang)
      ? (rawLang as ShikiLang)
      : "text";
    const code = m[2];
    if (map[code]) continue;
    map[code] = highlighter.codeToHtml(code, {
      lang,
      theme: "github-dark-default",
    });
  }
  return map;
}

export const metadata = {
  title: "How we calculate PRI @ Rely",
  description: "End-to-end explanation of the Provisioning Reliability Index.",
};

async function loadDoc(): Promise<string> {
  const file = path.join(process.cwd(), "docs", "PRI.md");
  return fs.readFile(file, "utf8");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function extractToc(source: string): TocItem[] {
  const items: TocItem[] = [];
  let inCodeBlock = false;
  for (const line of source.split("\n")) {
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const depth = match[1].length as 2 | 3;
    const text = match[2].replace(/`/g, "");
    items.push({ id: slugify(text), text, depth });
  }
  return items;
}

export default async function HowWeCalculatePage() {
  const source = await loadDoc();
  const toc = extractToc(source);
  const highlighted = await buildHighlightedMap(source);

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] font-mono text-brand mb-3">
            PRI CALCULATION
          </p>
          <h1 className="text-5xl font-bold tracking-tight mb-3">
            How we calculate PRI @ Rel<span className="text-brand">y</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Deep dive into the Provisioning Reliability Index, the weights
            system and the computation on the same.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-10">
          <article className="relative group rounded-xl border border-border/40 bg-surface-2/60 shadow-sm px-6 sm:px-10 py-8 sm:py-10 min-w-0">
            <MarkdownContent source={source} highlighted={highlighted} />

            {/* Overlay control: keep it out of the markdown flow so "first:" heading styles still apply */}
            <div className="print:hidden pointer-events-none absolute top-4 right-4 z-10">
              <div className="pointer-events-auto">
                <ExportPdfButton markdown={source} filename="how-we-calculate-pri" />
              </div>
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents items={toc} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

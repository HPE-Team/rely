"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

function stripShikiWrapper(html: string): string {
  const match = /<code[^>]*>([\s\S]*?)<\/code>/.exec(html);
  return match ? match[1] : html;
}

function CodeBlock({ raw, html }: { raw: string; html: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="relative group my-5">
      <pre className="rounded-lg border border-border/40 bg-[#0d0d0d] p-4 pr-12 overflow-x-auto text-sm leading-6 text-foreground">
        <code
          className="font-mono text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute top-2 right-2 p-1.5 rounded-md border border-border/40 bg-background/60 text-muted-foreground hover:text-foreground hover:bg-background/90 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

function PlainCodeBlock({ raw, className }: { raw: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="relative group my-5">
      <pre className="rounded-lg border border-border/40 bg-[#0d0d0d] p-4 pr-12 overflow-x-auto text-sm leading-6 text-foreground">
        <code className={`font-mono text-sm ${className ?? ""}`}>{raw}</code>
      </pre>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute top-2 right-2 p-1.5 rounded-md border border-border/40 bg-background/60 text-muted-foreground hover:text-foreground hover:bg-background/90 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

function slugify(children: React.ReactNode): string {
  const text = extractText(children);
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

function buildComponents(highlighted: Record<string, string>): Components {
  const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold tracking-tight mt-12 mb-4 pb-3 border-b border-border/40 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => {
    const id = slugify(children);
    return (
      <h2
        id={id}
        className="group relative scroll-mt-24 text-3xl font-bold tracking-tight text-foreground mt-16 mb-5 pt-10 border-t border-border/40 first:mt-0 first:pt-0 first:border-t-0"
      >
        <a
          href={`#${id}`}
          aria-label="Link to section"
          className="absolute -left-6 top-[2.625rem] opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-[#8ec5ff] transition-opacity no-underline"
        >
          #
        </a>
        {children}
      </h2>
    );
  },
  h3: ({ children }) => {
    const id = slugify(children);
    return (
      <h3
        id={id}
        className="group relative scroll-mt-24 text-xl font-semibold tracking-tight text-foreground mt-10 mb-3 pl-3 border-l-2 border-[#8ec5ff]/70"
      >
        <a
          href={`#${id}`}
          aria-label="Link to section"
          className="absolute -left-5 top-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-[#8ec5ff] transition-opacity no-underline text-base"
        >
          #
        </a>
        {children}
      </h3>
    );
  },
  p: ({ children }) => (
    <p className="text-[15px] leading-7 text-muted-foreground mb-4">
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[#8ec5ff] underline underline-offset-2 decoration-[#8ec5ff]/40 hover:decoration-[#8ec5ff] transition-colors"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-5 space-y-1.5 mb-4 text-[15px] leading-7 text-muted-foreground marker:text-muted-foreground/60">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-5 space-y-1.5 mb-4 text-[15px] leading-7 text-muted-foreground marker:text-muted-foreground/60">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
  hr: () => null,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#8ec5ff]/60 bg-[#8ec5ff]/5 pl-4 py-2 my-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const text = String(children ?? "");
    const isBlock = text.includes("\n") || /language-/.test(className ?? "");
    if (!isBlock) {
      return (
        <code className="font-mono text-[0.85em] bg-muted/60 border border-border/40 rounded px-1.5 py-0.5 text-foreground">
          {children}
        </code>
      );
    }
    const raw = text.endsWith("\n") ? text.slice(0, -1) : text;
    const highlight = highlighted[raw] ?? highlighted[text];
    if (highlight) {
      return <CodeBlock raw={raw} html={stripShikiWrapper(highlight)} />;
    }
    return <PlainCodeBlock raw={raw} className={className} />;
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border/40">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/40 border-b border-border/40">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="text-left font-semibold text-foreground px-4 py-2.5">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-muted-foreground align-top">{children}</td>
  ),
  };
  return components;
}

export function MarkdownContent({
  source,
  highlighted,
}: {
  source: string;
  highlighted: Record<string, string>;
}) {
  const components = buildComponents(highlighted);
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {source}
    </ReactMarkdown>
  );
}

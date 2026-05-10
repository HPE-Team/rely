import fs from "fs/promises";
import path from "path";
import { DataBrowser } from "./data-browser";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Data Browser @ Rely",
  description:
    "Browse, filter, and edit provisioning data live. View the database schema.",
};

async function loadSchema(): Promise<string> {
  const file = path.join(process.cwd(), "docs", "SCHEMA.md");
  return fs.readFile(file, "utf8");
}

export default async function DataPage() {
  const schemaSource = await loadSchema();

  return (
    <div className="bg-background">
      <div className="max-w-[90rem] mx-auto px-4 lg:px-8 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] font-mono text-[#8ec5ff] mb-3">
            DATABASE
          </p>
          <h1 className="text-5xl font-bold tracking-tight mb-3">
            Data Browser @ Rel
            <span className="text-[#8ec5ff]">y</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Browse, filter, and edit provisioning records live. View the database
            schema.
          </p>
        </div>

        <DataBrowser schemaSource={schemaSource} />
      </div>
    </div>
  );
}

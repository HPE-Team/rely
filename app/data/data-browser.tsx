"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Edit2,
  Trash2,
  Table2,
  FileText,
  Save,
  MoreVertical,
  FileDown,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { MarkdownContent } from "@/app/docs/how-we-calculate/markdown-content";
import { ExportPdfButton } from "@/app/docs/how-we-calculate/export-pdf-button";
import { sileo } from "sileo";
import { toastFill } from "@/app/lib/toast-style";
import { NODE_TYPES, STATUSES, ERROR_TYPES, POWER_STATES } from "@/app/lib/db/schema";

/* ---------- types ---------- */

interface ComputeServer {
  id: number;
  parent_server_id: number | null;
  node_type: "HOST" | "VM";
  status: "provisioned" | "failed";
  status_percent: string | null;
  provision_percent: string;
  status_message: string | null;
  error_type: string | null;
  error_message: string | null;
  provision_time: number;
  status_date: string;
  max_memory: number;
  max_cores: number;
  max_storage: number;
  power_state: string;
  zone_id: string;
}

interface Pagination {
  limit: number;
  offset: number;
  total: number;
}

type Tab = "table" | "schema";

/* ---------- column definitions ---------- */

const COLUMNS: {
  key: keyof ComputeServer;
  label: string;
  width: string;
  editable: boolean;
}[] = [
    { key: "id", label: "ID", width: "w-16", editable: false },
    { key: "parent_server_id", label: "Parent", width: "w-20", editable: true },
    { key: "node_type", label: "Type", width: "w-24", editable: true },
    { key: "status", label: "Status", width: "w-32", editable: true },
    { key: "error_type", label: "Error Type", width: "w-40", editable: true },
    { key: "error_message", label: "Error Msg", width: "w-48", editable: true },
    { key: "provision_percent", label: "Prov %", width: "w-24", editable: true },
    { key: "provision_time", label: "Prov Time", width: "w-28", editable: true },
    { key: "zone_id", label: "Zone", width: "w-28", editable: true },
    { key: "power_state", label: "Power", width: "w-24", editable: true },
    { key: "max_memory", label: "Memory", width: "w-24", editable: true },
    { key: "max_cores", label: "Cores", width: "w-20", editable: true },
    { key: "max_storage", label: "Storage", width: "w-24", editable: true },
    { key: "status_percent", label: "Health %", width: "w-24", editable: true },
    { key: "status_date", label: "Date", width: "w-48", editable: true },
  ];

const ZONES = ["zone-a", "zone-b", "zone-c", "zone-d", "zone-e", "zone-f"];
const PAGE_SIZES = [25, 50, 100];

/* ---------- helpers ---------- */

function formatCell(key: keyof ComputeServer, value: unknown): string {
  if (value == null) return "—";
  if (key === "provision_time") return `${Number(value).toFixed(1)}s`;
  if (key === "max_memory") return `${value} MB`;
  if (key === "max_storage") return `${value} GB`;
  if (key === "provision_percent" || key === "status_percent")
    return `${Number(value).toFixed(1)}%`;
  if (key === "status_date") {
    const d = new Date(String(value));
    return Number.isFinite(d.getTime())
      ? d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      : String(value);
  }
  return String(value);
}

function statusBadge(status: string) {
  const ok = status === "provisioned";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${ok
          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
          : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
        }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`}
      />
      {status}
    </span>
  );
}

function typeBadge(type: string) {
  const isHost = type === "HOST";
  return (
    <span
      className={`text-xs font-mono font-medium px-2.5 py-1 rounded ${isHost
          ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
          : "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20"
        }`}
    >
      {type}
    </span>
  );
}

function powerBadge(state: string) {
  const on = state === "on";
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded ${on
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-zinc-500/10 text-zinc-500"
        }`}
    >
      {state}
    </span>
  );
}

function errorBadge(type: string | null) {
  if (!type) return <span className="text-muted-foreground/40">—</span>;
  return (
    <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded ring-1 ring-orange-500/20">
      {type.replace("_FAILURE", "")}
    </span>
  );
}

function renderCell(key: keyof ComputeServer, value: unknown) {
  if (key === "status") return statusBadge(String(value));
  if (key === "node_type") return typeBadge(String(value));
  if (key === "power_state") return powerBadge(String(value));
  if (key === "error_type") return errorBadge(value as string | null);
  return (
    <span className="text-sm text-muted-foreground truncate block">
      {formatCell(key, value)}
    </span>
  );
}

/* ---------- component ---------- */

export function DataBrowser({ schemaSource }: { schemaSource: string }) {
  const [tab, setTab] = useState<Tab>("table");
  const [items, setItems] = useState<ComputeServer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    limit: 50,
    offset: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [zoneFilter, setZoneFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  // Editing state
  const [editTarget, setEditTarget] = useState<ComputeServer | null>(null);
  const [editValues, setEditValues] = useState<Partial<ComputeServer>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ComputeServer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Export / actions menu state
  const [isExporting, setIsExporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  /* ---------- csv export ---------- */

  async function exportCsv() {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (zoneFilter) params.set("zone_id", zoneFilter);
      if (typeFilter) params.set("node_type", typeFilter);

      const url = `/api/compute-servers/export${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const nameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = nameMatch?.[1] ?? "compute-servers.csv";

      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(href);

      sileo.success({ title: "CSV exported successfully", fill: toastFill() });
    } catch (err) {
      console.error("CSV export failed:", err);
      sileo.error({ title: "Export failed", fill: toastFill() });
    } finally {
      setIsExporting(false);
    }
  }

  /* ---------- data fetching ---------- */

  const fetchData = useCallback(
    async (limit: number, offset: number) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
        });
        if (zoneFilter) params.set("zone_id", zoneFilter);
        if (typeFilter) params.set("node_type", typeFilter);

        const res = await fetch(`/api/compute-servers?${params}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (json.success) {
          setItems(json.data.items);
          setPagination(json.data.pagination);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [zoneFilter, typeFilter],
  );

  useEffect(() => {
    fetchData(pagination.limit, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneFilter, typeFilter]);

  /* ---------- pagination ---------- */

  const totalPages = Math.max(
    1,
    Math.ceil(pagination.total / pagination.limit),
  );
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  function goPage(page: number) {
    const offset = (page - 1) * pagination.limit;
    fetchData(pagination.limit, offset);
  }

  function changePageSize(size: number) {
    setPagination((p) => ({ ...p, limit: size, offset: 0 }));
    fetchData(size, 0);
  }

  /* ---------- editing ---------- */

  function startEdit(row: ComputeServer) {
    setEditTarget(row);
    setEditValues(row);
  }

  async function saveEdit() {
    if (!editTarget) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/compute-servers/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setItems((prev) =>
          prev.map((item) => (item.id === editTarget.id ? json.data : item)),
        );
        sileo.success({ title: "Updated successfully", fill: toastFill() });
        setEditTarget(null);
      } else {
        sileo.error({
          title: "Update failed",
          description: json.error || "Unknown error",
          fill: toastFill(),
        });
      }
    } catch {
      sileo.error({ title: "Update failed", fill: toastFill() });
    } finally {
      setIsSaving(false);
    }
  }

  /* ---------- delete ---------- */

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/compute-servers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        setPagination((p) => ({ ...p, total: p.total - 1 }));
        sileo.success({
          title: `Server #${deleteTarget.id} deleted`,
          fill: toastFill(),
        });
      } else {
        sileo.error({
          title: "Delete failed",
          description: json.error,
          fill: toastFill(),
        });
      }
    } catch {
      sileo.error({ title: "Delete failed", fill: toastFill() });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  /* ---------- render ---------- */

  return (
    <>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-border/40">
        <button
          onClick={() => setTab("table")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${tab === "table"
              ? "border-brand text-brand"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <Table2 className="w-4 h-4" />
          Table
        </button>
        <button
          onClick={() => setTab("schema")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${tab === "schema"
              ? "border-brand text-brand"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <FileText className="w-4 h-4" />
          Schema
        </button>
      </div>

      {/* Schema tab */}
      {tab === "schema" && (
        <article className="relative group min-w-0 rounded-xl border border-border/50 bg-surface-2/60 shadow-sm px-6 sm:px-10 py-8 sm:py-10">
          <MarkdownContent source={schemaSource} highlighted={{}} />
          
          <div className="print:hidden pointer-events-none absolute top-4 right-4 z-10">
            <div className="pointer-events-auto">
              <ExportPdfButton
                markdown={schemaSource}
                filename="schema"
              />
            </div>
          </div>
        </article>
      )}

      {/* Table tab */}
      {tab === "table" && (
        <>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6 bg-surface-1 p-3 rounded-lg border border-border/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Zone</span>
              <div className="relative">
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="appearance-none h-9 rounded-md border border-border/40 bg-background pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40 cursor-pointer"
                >
                  <option value="">All Zones</option>
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Type</span>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none h-9 rounded-md border border-border/40 bg-background pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40 cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="HOST">HOST</option>
                  <option value="VM">VM</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Page Size</span>
                <div className="relative">
                  <select
                    value={pagination.limit}
                    onChange={(e) => changePageSize(Number(e.target.value))}
                    className="appearance-none h-9 rounded-md border border-border/40 bg-background pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40 cursor-pointer"
                  >
                    {PAGE_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="h-4 w-px bg-border/40" />

              <span className="text-xs font-mono text-muted-foreground">
                {pagination.total.toLocaleString()} records
              </span>

              <div className="h-4 w-px bg-border/40" />

              {/* Actions 3-dot menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Table actions"
                  title="Actions"
                  className={`h-8 w-8 p-0 rounded-full flex items-center justify-center transition-all cursor-pointer border ${menuOpen
                      ? "bg-background/80 border-border/60 opacity-100"
                      : "bg-background/30 border-border/30 opacity-50 hover:opacity-100 hover:bg-background/60 hover:border-border/60"
                    }`}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MoreVertical className="w-4 h-4" />
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border/40 bg-surface-2 shadow-2xl shadow-black/40 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-1.5">
                      <button
                        onClick={() => { setMenuOpen(false); exportCsv(); }}
                        disabled={isExporting}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        <FileDown className="w-4 h-4 text-muted-foreground" />
                        <span>Export to CSV</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border/50 bg-surface-2/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto scrollbar-custom">
              <table className="w-full text-sm border-collapse min-w-[100rem]">
                <thead>
                  <tr className="border-b border-border/40 bg-surface-1">
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className={`text-left font-semibold text-foreground/70 text-[11px] uppercase tracking-wider px-4 py-4 ${col.width}`}
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="w-24 px-4 py-4 text-right text-[11px] uppercase tracking-wider text-foreground/70">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {isLoading && (
                    <tr>
                      <td colSpan={COLUMNS.length + 1} className="text-center py-24">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin text-brand" />
                          <span className="text-xs text-muted-foreground font-medium">Fetching records...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!isLoading && items.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length + 1} className="text-center py-24">
                        <span className="text-sm text-muted-foreground">No records found matching your filters.</span>
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    items.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-surface-3 transition-colors group relative"
                      >
                        {COLUMNS.map((col) => (
                          <td key={col.key} className={`px-4 py-3.5 ${col.width}`}>
                            {renderCell(col.key, row[col.key])}
                          </td>
                        ))}
                        <td className="px-4 py-3.5 w-24 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEdit(row)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-brand hover:bg-brand/10 transition-all cursor-pointer"
                              title="Edit record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(row)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-surface-1">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-muted-foreground">
                  Showing <span className="text-foreground">{pagination.offset + 1}</span> to{" "}
                  <span className="text-foreground">
                    {Math.min(pagination.offset + pagination.limit, pagination.total)}
                  </span>{" "}
                  of <span className="text-foreground">{pagination.total}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => goPage(currentPage - 1)}
                  className="h-8 px-3 gap-1 hover:bg-secondary/50 cursor-pointer disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;

                    return (
                      <button
                        key={page}
                        onClick={() => goPage(page)}
                        className={`h-8 w-8 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${page === currentPage
                            ? "bg-brand text-background shadow-[0_0_15px_rgba(142,197,255,0.3)]"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => goPage(currentPage + 1)}
                  className="h-8 px-3 gap-1 hover:bg-secondary/50 cursor-pointer disabled:opacity-30"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-brand" />
              Edit Server #{editTarget?.id}
            </DialogTitle>
            <DialogDescription>
              Update the provisioning data for this {editTarget?.node_type.toLowerCase()} node.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {COLUMNS.filter(c => c.editable).map((col) => {
              const isEnum = col.key === "node_type" || col.key === "status" || col.key === "error_type" || col.key === "power_state";

              return (
                <div key={col.key} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {col.label}
                  </label>
                  {isEnum ? (
                    <div className="relative">
                      <select
                        value={String(editValues[col.key] ?? "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          const finalVal = val === "" && col.key === "error_type" ? null : val;
                          setEditValues(prev => ({ ...prev, [col.key]: finalVal }));
                        }}
                        className="appearance-none w-full h-10 rounded-md border border-border/40 bg-background pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40 transition-all cursor-pointer"
                      >
                        {col.key === "error_type" && <option value="">None</option>}
                        {col.key === "node_type" && NODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        {col.key === "status" && STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        {col.key === "error_type" && ERROR_TYPES.map(err => <option key={err} value={err}>{err}</option>)}
                        {col.key === "power_state" && POWER_STATES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={String(editValues[col.key] ?? "")}
                      onChange={(e) => setEditValues(prev => ({ ...prev, [col.key]: e.target.value }))}
                      className="w-full h-10 rounded-md border border-border/40 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40 transition-all"
                      placeholder={`Enter ${col.label.toLowerCase()}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={isSaving}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={isSaving}
              className="bg-brand text-background hover:bg-brand/90 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Server #{deleteTarget?.id}
            </DialogTitle>
            <DialogDescription>
              This will permanently delete this{" "}
              {deleteTarget?.node_type === "HOST" ? "host" : "VM"} record
              {deleteTarget?.node_type === "HOST"
                ? " and may orphan its child VMs"
                : ""}
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

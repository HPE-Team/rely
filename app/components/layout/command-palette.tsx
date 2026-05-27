"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Loader2, X, LayoutDashboard, Table2, Calculator, Sparkles, Server, Cpu, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { ZoneLogo } from "@/app/components/zone-logo";
import { formatZoneLabel } from "@/app/lib/utils";
import { getErrorTypeLabel } from "@/app/lib/constants/error-weights";
import type { ZoneColor } from "@/app/lib/calculations/pri";
import type { SearchServer } from "@/app/api/search/route";

// ── Static page entries ────────────────────────────────────────────────────────

const PAGES = [
  { kind: "page" as const, title: "Dashboard", description: "Fleet overview & zone status", href: "/", icon: LayoutDashboard, keywords: ["home", "overview", "fleet", "pri"] },
  { kind: "page" as const, title: "Data Browser", description: "Browse and edit provisioning records", href: "/data", icon: Table2, keywords: ["data", "database", "records", "table", "servers"] },
  { kind: "page" as const, title: "How We Calculate", description: "PRI formula and scoring system", href: "/docs/how-we-calculate", icon: Calculator, keywords: ["docs", "calculate", "pri", "formula", "scoring", "algorithm"] },
  { kind: "page" as const, title: "How We Generate", description: "Simulation pipeline and failure stages", href: "/docs/how-we-generate", icon: Sparkles, keywords: ["docs", "generate", "simulation", "data", "pipeline"] },
];

// ── Zone result type ───────────────────────────────────────────────────────────

type ZoneResult = {
  kind: "zone";
  zone_id: string;
  pri_score: number;
  color: ZoneColor;
  failed_count: number;
  hosts_count: number;
  vms_count: number;
};

type PageItem = typeof PAGES[number];
type ServerItem = SearchServer & { kind: "server" };
type ResultItem = PageItem | ZoneResult | ServerItem;

// ── Color maps ─────────────────────────────────────────────────────────────────

const PRI_BADGE: Record<ZoneColor, string> = {
  green: "text-green-700 dark:text-green-400 bg-green-500/10 border-green-500/20",
  amber: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  red:   "text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20",
};

// ── Section header ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 select-none">
      {children}
    </div>
  );
}

// ── Result rows ────────────────────────────────────────────────────────────────

function RowShell({ active, onClick, onMouseEnter, children }: {
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-active={active}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors
        ${active ? "bg-brand/10 border-l-2 border-l-brand" : "border-l-2 border-l-transparent hover:bg-secondary/50"}`}
    >
      {children}
    </div>
  );
}

function PageRow({ item, active, onClick, onMouseEnter }: { item: PageItem; active: boolean; onClick: () => void; onMouseEnter: () => void }) {
  const Icon = item.icon;
  return (
    <RowShell active={active} onClick={onClick} onMouseEnter={onMouseEnter}>
      <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-secondary/60 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-foreground">{item.title}</span>
        <span className="text-xs text-muted-foreground truncate">{item.description}</span>
      </span>
      <span className="ml-auto text-xs text-muted-foreground font-mono shrink-0">{item.href}</span>
    </RowShell>
  );
}

function ZoneRow({ zone, active, onClick, onMouseEnter, onHostsClick }: {
  zone: ZoneResult;
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onHostsClick: (e: React.MouseEvent) => void;
}) {
  return (
    <RowShell active={active} onClick={onClick} onMouseEnter={onMouseEnter}>
      <ZoneLogo zoneId={zone.zone_id} width={20} height={20} className="rounded object-contain shrink-0" />
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground">{formatZoneLabel(zone.zone_id)}</span>
        <span className="text-xs text-muted-foreground">
          {zone.hosts_count} ESX · {zone.vms_count} VM
          {zone.failed_count > 0 && (
            <span className="text-red-500 dark:text-red-400 ml-1">· {zone.failed_count} failed</span>
          )}
        </span>
      </span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border mr-1 shrink-0 ${PRI_BADGE[zone.color]}`}>
        {zone.pri_score.toFixed(1)}
      </span>
      <button
        onClick={onHostsClick}
        className="shrink-0 flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-brand transition-colors px-1.5 py-1 rounded hover:bg-brand/10"
      >
        Hosts <ArrowRight className="w-3 h-3" />
      </button>
    </RowShell>
  );
}

function ServerRow({ server, active, onClick, onMouseEnter }: {
  server: ServerItem;
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const isHost = server.node_type === "HOST";
  const failed = server.status === "failed";
  return (
    <RowShell active={active} onClick={onClick} onMouseEnter={onMouseEnter}>
      <span className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[10px] font-bold
        ${isHost ? "bg-blue-500/15 text-blue-400" : "bg-violet-500/15 text-violet-400"}`}>
        {isHost ? <Server className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground font-mono">#{server.id}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wide
            ${isHost ? "text-blue-400" : "text-violet-400"}`}>
            {server.node_type}
          </span>
          {server.error_type && (
            <span className="text-xs text-red-400 truncate max-w-[160px]">
              {getErrorTypeLabel(server.error_type as any)}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <ZoneLogo zoneId={server.zone_id} width={12} height={12} className="rounded object-contain opacity-80 shrink-0" />
          {formatZoneLabel(server.zone_id)}
          <span>·</span>
          <span>{server.provision_time.toFixed(1)}s</span>
        </span>
      </span>
      <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border
        ${failed
          ? "text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20"
          : "text-green-700 dark:text-green-400 bg-green-500/10 border-green-500/20"
        }`}>
        {failed ? "failed" : "ok"}
      </span>
    </RowShell>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [zones, setZones] = useState<ZoneResult[]>([]);
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  // Open on Ctrl/Cmd+K or custom event from navbar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    function onEvent() { setOpen(true); }
    document.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onEvent);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onEvent);
    };
  }, []);

  // Fetch zones on mount
  useEffect(() => {
    fetch("/api/zones", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setZones(data.data.map((z: any) => ({ kind: "zone" as const, ...z })));
        }
      })
      .catch(() => {});
  }, []);

  // Close on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  // Focus input on open; reset on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery("");
      setCursor(0);
      setServers([]);
    }
  }, [open]);

  // Debounced server search
  useEffect(() => {
    if (!query.trim()) {
      setServers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`)
        .then(r => r.json())
        .then(data => {
          setServers((data.servers ?? []).map((s: SearchServer) => ({ ...s, kind: "server" as const })));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Reset cursor when results change
  useEffect(() => { setCursor(0); }, [query]);

  // Filtered pages + zones
  const isNumericQuery = /^#?\d+$/.test(query.trim());

  const filteredPages = useMemo(() => {
    if (!query) return PAGES;
    const q = query.toLowerCase();
    return PAGES.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.keywords.some(k => k.includes(q))
    );
  }, [query]);

  const filteredZones = useMemo(() => {
    if (isNumericQuery) return [];
    if (!query) return zones;
    const tokens = query.toLowerCase().split(/\s+/);
    return zones.filter(z => {
      const name = formatZoneLabel(z.zone_id).toLowerCase();
      return tokens.some(t => name.includes(t) || z.zone_id.includes(t));
    });
  }, [query, zones, isNumericQuery]);

  // Flat cursor list
  const allItems = useMemo<ResultItem[]>(() => [
    ...filteredPages,
    ...filteredZones,
    ...servers,
  ], [filteredPages, filteredZones, servers]);

  // Scroll active item into view
  useEffect(() => {
    document.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const navigate = useCallback((item: ResultItem) => {
    setOpen(false);
    if (item.kind === "page") {
      router.push(item.href);
    } else if (item.kind === "zone") {
      router.push(`/zone/${item.zone_id}`);
    } else {
      if (item.node_type === "HOST") {
        router.push(`/zone/${item.zone_id}/hosts/${item.id}`);
      } else if (item.parent_server_id) {
        router.push(`/zone/${item.zone_id}/hosts/${item.parent_server_id}`);
      } else {
        router.push(`/zone/${item.zone_id}/hosts`);
      }
    }
  }, [router]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[cursor]) navigate(allItems[cursor]);
    }
  }

  const pageOffset = 0;
  const zoneOffset = filteredPages.length;
  const serverOffset = filteredPages.length + filteredZones.length;

  const isEmpty = !loading && query && filteredPages.length === 0 && filteredZones.length === 0 && servers.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">Search</DialogTitle>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search servers, zones, pages…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />}
          {!loading && query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          {!query && (
            <kbd className="text-[10px] font-mono text-muted-foreground bg-muted/50 border border-border/40 rounded px-1.5 py-0.5 shrink-0">
              Esc
            </kbd>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[26rem] overflow-y-auto overscroll-contain">

          {filteredPages.length > 0 && (
            <>
              <SectionLabel>Pages</SectionLabel>
              {filteredPages.map((item, i) => (
                <PageRow
                  key={item.href}
                  item={item}
                  active={cursor === pageOffset + i}
                  onClick={() => navigate(item)}
                  onMouseEnter={() => setCursor(pageOffset + i)}
                />
              ))}
            </>
          )}

          {filteredZones.length > 0 && (
            <>
              <SectionLabel>Zones</SectionLabel>
              {filteredZones.map((zone, i) => (
                <ZoneRow
                  key={zone.zone_id}
                  zone={zone}
                  active={cursor === zoneOffset + i}
                  onClick={() => navigate(zone)}
                  onMouseEnter={() => setCursor(zoneOffset + i)}
                  onHostsClick={e => {
                    e.stopPropagation();
                    setOpen(false);
                    router.push(`/zone/${zone.zone_id}/hosts`);
                  }}
                />
              ))}
            </>
          )}

          {(servers.length > 0 || (loading && query)) && (
            <>
              <SectionLabel>Servers</SectionLabel>
              {loading && servers.length === 0 ? (
                <div className="px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Searching…
                </div>
              ) : servers.map((s, i) => (
                <ServerRow
                  key={s.id}
                  server={s}
                  active={cursor === serverOffset + i}
                  onClick={() => navigate(s)}
                  onMouseEnter={() => setCursor(serverOffset + i)}
                />
              ))}
            </>
          )}

          {isEmpty && (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No results for <span className="font-medium text-foreground">"{query}"</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1.5">
                Try zone names, server IDs, "failed", "hardware", "aws failed"
              </p>
            </div>
          )}

          {!query && zones.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground/60">
              Loading zones…
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border/40 text-[10px] text-muted-foreground/70 select-none">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
          <span className="ml-auto">Try: <span className="font-mono">azure failed</span> · <span className="font-mono">hardware</span> · <span className="font-mono">#42</span></span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

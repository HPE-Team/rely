import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats MB value as human-readable string: "512MB" or "8GB" */
export function formatMemory(mb: number): string {
  return mb >= 1024 ? `${Math.round(mb / 1024)}GB` : `${mb}MB`;
}

const ZONE_CONFIG: Record<string, { name: string; logo: string; logoLight?: string }> = {
  "zone-a": { name: "Azure",        logo: "/zones/azure.png"        },
  "zone-b": { name: "AWS",          logo: "/zones/aws.png",          logoLight: "/zones/aws-light.png" },
  "zone-c": { name: "GCP",          logo: "/zones/gcp.png"          },
  "zone-d": { name: "DigitalOcean", logo: "/zones/digitalocean.png" },
  "zone-e": { name: "Cloudflare",   logo: "/zones/cloudflare.png"   },
  "zone-f": { name: "Oracle",       logo: "/zones/oracle.ico"       },
};

export function formatZoneLabel(zoneId: string): string {
  const normalized = zoneId.trim().toLowerCase();
  if (ZONE_CONFIG[normalized]) return ZONE_CONFIG[normalized].name;

  // Fallback for any other zone-X format
  if (!normalized.startsWith("zone-")) return zoneId;
  const suffix = normalized.slice("zone-".length);
  if (!suffix) return "Zone";
  const readable = suffix
    .split("-")
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return readable ? `Zone ${readable}` : "Zone";
}

/** Returns the public path to the zone's logo, or null for unknown zones. */
export function getZoneLogo(zoneId: string): string | null {
  return ZONE_CONFIG[zoneId.trim().toLowerCase()]?.logo ?? null;
}

/** Returns the light-mode logo path, falling back to the default logo. */
export function getZoneLogoLight(zoneId: string): string | null {
  const cfg = ZONE_CONFIG[zoneId.trim().toLowerCase()];
  if (!cfg) return null;
  return cfg.logoLight ?? cfg.logo;
}

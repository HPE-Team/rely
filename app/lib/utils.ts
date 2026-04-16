import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatZoneLabel(zoneId: string): string {
  const normalized = zoneId.trim().toLowerCase()
  if (!normalized.startsWith("zone-")) {
    return zoneId
  }

  const suffix = normalized.slice("zone-".length)
  if (!suffix) {
    return "Zone"
  }

  const readableSuffix = suffix
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

  return readableSuffix ? `Zone ${readableSuffix}` : "Zone"
}

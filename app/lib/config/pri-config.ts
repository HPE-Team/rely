import { type PRIConfig, DEFAULT_PRI_CONFIG } from '../calculations/pri';

const STORAGE_KEY = 'pri_config';
const LEGACY_KEY = 'pri_error_weights';

export function serializePRIConfig(cfg: Partial<PRIConfig>): string {
  return encodeURIComponent(JSON.stringify(cfg));
}

export function parsePRIConfig(qs: string | null): Partial<PRIConfig> {
  if (!qs) return {};
  try {
    return JSON.parse(decodeURIComponent(qs)) as Partial<PRIConfig>;
  } catch {
    return {};
  }
}

/** Client-only: reads saved config from localStorage, migrating legacy keys. */
export function readLocalConfig(): Partial<PRIConfig> {
  if (typeof window === 'undefined') return {};

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Record<string, unknown>;
      // Migrate: drop the old iqrMultiplier key (replaced by outlierResourceImpact)
      if ('iqrMultiplier' in parsed) {
        delete parsed['iqrMultiplier'];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed as Partial<PRIConfig>;
    } catch {
      return {};
    }
  }

  // Migrate from old error-weights-only key
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      const errorWeights = JSON.parse(legacy);
      const migrated: Partial<PRIConfig> = { errorWeights };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_KEY);
      return migrated;
    } catch {
      return {};
    }
  }

  return {};
}

/** Client-only: saves config to localStorage. */
export function saveLocalConfig(cfg: Partial<PRIConfig>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event('pri-config-changed'));
}

/** Client-only: clears saved config. */
export function clearLocalConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_KEY);
  window.dispatchEvent(new Event('pri-config-changed'));
}

/** Returns `?config=<encoded>` or `''` if config matches defaults. */
export function configQueryString(cfg: Partial<PRIConfig>): string {
  if (!cfg || Object.keys(cfg).length === 0) return '';
  return `?config=${serializePRIConfig(cfg)}`;
}

/** Returns URL with config appended. */
export function withConfig(url: string, cfg: Partial<PRIConfig>): string {
  const qs = configQueryString(cfg);
  return qs ? `${url}${qs}` : url;
}

export { DEFAULT_PRI_CONFIG };

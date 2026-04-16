# Copilot Instructions for PRI Dashboard

This document provides guidance for GitHub Copilot (and other AI assistants) working on the Provisioning Reliability Index (PRI) Dashboard repository.

## Quick Reference

**Build & Deploy Commands:**
```bash
npm run dev         # Start dev server (http://localhost:3000)
npm run build       # Production build
npm run start       # Run production build
npm run lint        # Run ESLint
```

**Database:** Configure `.env.local` with MySQL connection details (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME). Mock data fallback is automatic when DB unavailable.

**TypeScript Path:** `@/*` maps to repository root for clean imports.

## Project Architecture

This is a **Next.js 16 (App Router) dashboard** that calculates and visualizes provisioning reliability metrics for HPE infrastructure.

### High-Level Overview

```
Frontend (React Components)
    ↓
Next.js Server Routes (/api/zones/*)
    ↓
PRI Calculation Engine (lib/calculations/)
    ↓
Drizzle ORM + MySQL Database
```

### Data Flow

1. **Frontend**: React pages (`app/page.tsx`, `app/zone/[id]/page.tsx`) fetch data from API routes using client-side `fetch()` with `cache: 'no-store'` for dynamic updates.

2. **API Routes**: `/api/zones/*` routes (in `app/api/zones/`) provide zone metrics and error data. Routes implement **mock data fallback** when DB unavailable, enabling development without live database.

3. **Calculation Engine**: `lib/calculations/pri.ts` and `lib/calculations/errors.ts` implement the PRI scoring formula and error classification logic.

4. **Database**: Drizzle ORM (`lib/db/schema.ts`) abstracts MySQL tables: `zones`, `compute_server2`, `zone_metrics`.

### Key Concepts

**PRI Score (0-100, higher = better):**
- Formula: `(SuccessRate × 0.4) + (PerformanceScore × 0.3) + (StabilityScore × 0.2) - (ErrorPenalty × 0.1)`
- **Success Rate**: Percentage of servers provisioned successfully
- **Performance Score**: Based on average provision time (ideal = 60s)
- **Stability Score**: Based on variation in provision times (coefficient of variation)
- **Error Penalty**: Weighted sum of error types per error classification

**Node Types:**
- **HOST** (ESX): Physical infrastructure nodes (no parent_server_id)
- **VM**: Virtual machines with `parent_server_id` pointing to parent HOST

**Error Phases:**
- **Pre-Provision**: Planning phase errors (RESOURCE_FAILURE, IP_FAILURE) — occur before provisioning starts
- **Post-Provision**: Execution phase errors (HARDWARE_FAILURE, STORAGE_FAILURE, POWER_FAILURE, NETWORK_FAILURE, HOST_FAILURE) — occur during/after provisioning

## Code Organization

### `/app/lib/`

**`calculations/pri.ts`**
- Core PRI scoring logic: `calculatePRIScore()`, `calculatePerformanceScore()`, `calculateStabilityScore()`, `calculateErrorPenalty()`
- Exports `PRICalculationMetrics` interface
- Used by all API routes; must stay in sync with `error-weights.ts`

**`calculations/errors.ts`**
- Error categorization: `separateErrorsByPhase()`, `getCategorizedErrors()`
- Host failure impact analysis: `assessHostFailureImpact()`
- Processes raw server data into error statistics

**`constants/error-weights.ts`**
- Single source of truth: `ERROR_CLASSIFICATIONS` (type, phase, severity, defaultWeight) and `DEFAULT_ERROR_WEIGHTS`
- Error types must match MySQL enum: HARDWARE_FAILURE, RESOURCE_FAILURE, STORAGE_FAILURE, NETWORK_FAILURE, IP_FAILURE, POWER_FAILURE, HOST_FAILURE
- Weights are multipliers (0.5-1.0 range); adjustable via frontend UI, stored in localStorage

**`db/schema.ts`**
- Drizzle ORM schema for three tables: `zones`, `compute_server2`, `zone_metrics`
- `compute_server2_relations`: Defines parent/children hierarchy for HOST-VM relationships and zone reference
- datetime columns use `sql\`CURRENT_TIMESTAMP\`` (not `.defaultNow()`)

**`db/connection.ts`**
- Singleton database initialization with error handling
- Auto-fallback to mock data if connection fails (no manual intervention needed)

**`utils.ts`**
- `cn()` helper for merging className strings (used in UI components)

### `/app/api/zones/`

**`route.ts`** (GET /api/zones)
- Returns array of zones with: zone_id, pri_score, success_rate, total_servers, hosts_count, vms_count, failed_count
- Response: `{ success: boolean, data: ZoneData[] }`
- Mock: 4 sample zones (zone-a through zone-d) with realistic metrics

**`[id]/route.ts`** (GET /api/zones/[id])
- Returns zone detail: overall metrics, host/VM comparison, error breakdown, host failure impact
- Response: `{ success: boolean, data: ZoneDetail }`

**`[id]/errors/route.ts`** (GET /api/zones/[id]/errors)
- Optional `?phase=pre-provision|post-provision` query param for filtering
- Returns error type breakdown, phase split, node type distribution, host failure impact
- Response: `{ success: boolean, data: ErrorBreakdown }`

**`[id]/timeline/route.ts`** (GET /api/zones/[id]/timeline)
- Returns historical metrics array: timestamp, pri_score, success_rate, stability_score
- Used for PRI trend chart on zone detail page

### `/app/components/ui/`

Recharts-based chart wrapper and shadcn/ui-inspired base components (manually created, not from CLI):
- `chart.tsx`: ChartContainer, ChartStyle, ChartTooltip, ChartLegend
- `card.tsx`, `button.tsx`, `badge.tsx`, `slider.tsx`, `skeleton.tsx`

### `/app/components/dashboard/`

Feature components (re-use these, don't duplicate):
- `pri-chart.tsx`: Line chart showing PRI, success rate, stability trends
- `error-distribution.tsx`: Pie chart of error type breakdown
- `error-timeline.tsx`: Bar chart with pre/post-provision toggle
- `zone-overview.tsx`: Zone card with clickable navigation to `/zone/[id]`
- `weight-config.tsx`: Modal for error weight customization (saves to localStorage: `pri_error_weights`)

### `/app/`

**`page.tsx`** (Dashboard Homepage)
- Client component (`'use client'`) with mounted state check to prevent hydration issues
- Fetches `/api/zones` on mount; displays zone grid with ZoneOverviewCard components
- Error UI with retry button; loading skeleton loaders
- Weight config modal toggle

**`zone/[id]/page.tsx`** (Zone Detail Page)
- Client component; fetches `/api/zones/[id]` and `/api/zones/[id]/timeline`
- Displays: 4 metric cards (PRI, success rate, provision time, stability)
- Host vs VM comparison; error summary and phase breakdown
- Host failure impact alert (if failedHosts > 0)

**`layout.tsx`** (Root Layout)
- Global styles, fonts, metadata

## Key Conventions

### Client-Side Fetching
- Always add `'use client'` at top of pages that fetch data
- Use `fetch()` with `cache: 'no-store'` to ensure client-side execution (prevents hydration mismatches in Next.js 16)
- Add `mounted` state check in `useEffect` to prevent rendering before hydration completes
- Include comprehensive console logging with `[ComponentName]` prefix for debugging

### Error Handling
- API routes return `{ success: boolean, data?: T, error?: string }`
- Frontend gracefully handles failures with retry buttons and error messages
- Mock data fallback is automatic; no need for manual fallback logic in routes

### Database Null Handling
- Type-check `db` before use: `if (!db) { return mockData; }`
- This pattern is already established in existing routes but may be needed when adding new routes

### UI Components
- Use existing components from `/app/components/ui/` and `/app/components/dashboard/`
- Tailwind with CSS variables for theming; dark mode support via `dark:` classes
- Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` etc.

### Styling
- Tailwind CSS v4 (configured in `tailwind.config.ts`)
- `clsx` for conditional classes; `tailwind-merge` for class merging (use `cn()` helper from `lib/utils.ts`)
- No inline styles; use utility classes

### TypeScript
- Strict mode enabled; all code must pass `tsc` type checking
- Use `Promise<T>` for async route parameters: `params: Promise<{ id: string }>`
- Interfaces prefixed with `I` not required; use natural names (e.g., `ZoneDetail` not `IZoneDetail`)

### localStorage Integration
- Error weights stored under key `pri_error_weights` as JSON string
- Accessed via `weight-config.tsx`; not yet integrated into live PRI recalculation
- Updates should use `useEffect` to prevent hydration issues

## Testing & Validation

**Build Check:**
```bash
npm run build
```
Must complete without TypeScript errors. Check for: null assertions on `db`, import path issues, missing route parameters.

**Lint Check:**
```bash
npm run lint
```
Eslint config: `eslint.config.mjs` (default Next.js ESLint setup)

**Manual Testing:**
1. Start dev server: `npm run dev`
2. Open browser console (F12) for `[ComponentName]` logs confirming API calls
3. Check Network tab to verify `/api/zones` requests fire
4. Test zone card navigation: click zone → verify `/zone/[id]` loads and displays charts
5. Test weight config: open modal → adjust slider → reload page → verify weights persist

## Common Issues & Solutions

**API calls not appearing in Network tab:**
- Verify page has `'use client'` directive
- Check for mounted state check in useEffect
- Confirm `cache: 'no-store'` in fetch options
- Look for hydration mismatch warnings in console

**db is possibly null errors:**
- Add type guard: `if (!db) { /* handle */ }`
- This is required even with fallback, as TypeScript doesn't track the fallback logic

**datetime.defaultNow() not found:**
- Always use: `default(sql\`CURRENT_TIMESTAMP\`)` for Drizzle MySQL datetime columns
- Never use `.defaultNow()` — it doesn't exist in this version

**Type mismatches in Recharts formatters:**
- Recharts formatter expects `(value: any) => string`; cast values as needed: `(value as number).toString()`

**Missing route parameters in Next.js 16:**
- Route params are async: `{ params }: { params: Promise<{ id: string }> }`
- Must await before accessing: `const { id } = await params`

## Database Connection

**Development Setup:**
1. Create `.env.local` in repository root:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=provisioning_db
   ```
2. Ensure MySQL is running with `provisioning_db` and tables created per schema

**Without Database:**
- Mock data automatically returns 4 sample zones
- All API routes work; data is realistic for UI testing
- Connection attempt is logged; check server logs for "Failed to initialize database" messages

## Recent Work & Known Issues

- Frontend API calls fixed (page.tsx & zone/[id]/page.tsx rewritten with proper `'use client'` and mounted state)
- All API routes working with mock data fallback
- Build passes without TypeScript errors
- Charts render correctly with sample data
- Weight configuration modal functional; localStorage persistence working

## References

- Next.js 16 App Router: See `node_modules/next/dist/docs/` (breaking changes from earlier versions)
- Drizzle ORM: MySQL adapter with relations support
- Recharts: Chart components; uses data array with specific shape per chart type
- Tailwind CSS v4: Utility-first CSS
- shadcn/ui pattern: Component-based UI library approach (components manually created)

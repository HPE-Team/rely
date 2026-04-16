# PRI Dashboard Guide

A quick reference for understanding the PRI (Provisioning Reliability Index) calculation system, API routes, and key architectural decisions.

---

## PRI Score Formula

**Overall Score (0-100, higher = better):**
```
PRI = (Success Rate × 0.4) + (Performance × 0.3) + (Stability × 0.2) - (Error Penalty × 0.1)
```

### Components

#### 1. Success Rate (40% weight)
```
Success Rate = (Successful Servers / Total Servers) × 100
```
- **Example:** 47 successful out of 50 = 94%
- **Impact:** 94 × 0.4 = 37.6 points

#### 2. Performance Score (30% weight)
```
Performance = 100 - (Avg Provision Time / 60 seconds) × 100
```
- **Example:** If avg time = 45s → Score = 100 - (45/60)×100 = 25
- **Impact:** 25 × 0.3 = 7.5 points
- Clamped to 0-100 range

#### 3. Stability Score (20% weight)
```
Stability = 100 - Coefficient of Variation (CV)

CV = (Standard Deviation / Mean) × 100
```
- **Low variance = high stability** (consistent provisioning times)
- **Example:** CV = 10% → Stability = 90
- **Impact:** 90 × 0.2 = 18 points

#### 4. Error Penalty (10% weight - negative)
```
Penalty = (Weighted Error Count / Total Servers) × 100
```
- **Error Weights:**
  - HARDWARE_FAILURE: 1.0 (critical)
  - POWER_FAILURE: 0.95 (critical)
  - HOST_FAILURE: 1.0 (critical - impacts VMs)
  - STORAGE_FAILURE: 0.9 (critical)
  - NETWORK_FAILURE: 0.7 (high)
  - IP_FAILURE: 0.6 (high)
  - RESOURCE_FAILURE: 0.5 (medium)
- **Example:** 2 hardware failures + 1 IP failure in 50 servers = (2×1.0 + 1×0.6)/50×100 = 5.2
- **Impact:** 5.2 × -0.1 = -0.52 points (reduces score)

---

## Error Classification

### Two Error Phases

#### Pre-Provision (Planning Phase)
Errors detected during planning, BEFORE provisioning starts.
- **RESOURCE_FAILURE** (weight: 0.5): Not enough CPU/memory/storage
- **IP_FAILURE** (weight: 0.6): IP allocation fails

**Detection:** `provision_percent < 100 AND status = 'provisioned'`

#### Post-Provision (Execution Phase)
Errors that occur DURING or AFTER provisioning.
- **HARDWARE_FAILURE** (weight: 1.0): Hardware component fails
- **STORAGE_FAILURE** (weight: 0.9): Storage binding fails
- **POWER_FAILURE** (weight: 0.95): VM won't power on
- **NETWORK_FAILURE** (weight: 0.7): NIC/network binding fails
- **HOST_FAILURE** (weight: 1.0): ESX host unavailable → cascades to all VMs

**Detection:** `status = 'failed'`

### Node Types

| Type | Parent | Impact |
|------|--------|--------|
| **HOST** | None | Physical ESX node (no parent_server_id) |
| **VM** | HOST id | Virtual machine (has parent_server_id) |

**Cascading Failures:** If a HOST fails, all its VMs are affected.

---

## Database Schema

### Three Core Tables

**zones**
- `zone_id` (PRIMARY KEY): Zone identifier (e.g., "zone-a")

**compute_server2**
- `id` (PRIMARY KEY): Auto-increment server ID
- `zone_id` (FOREIGN KEY): Which zone
- `node_type`: 'HOST' or 'VM'
- `parent_server_id`: NULL for HOST, host's ID for VM
- `status`: 'provisioned' or 'failed' (final outcome)
- `provision_percent`: 0-100 (triggers phase detection)
- `provision_time`: Seconds to provision (float)
- `error_type`: NULL or one of 7 error types
- `error_message`: Detailed error text

**zone_metrics** (historical tracking)
- `zone_id`: Which zone
- `calculated_at`: Timestamp
- `pri_score`, `success_rate`, `avg_provision_time`, `stability_score`, etc.

---

## API Routes

### 1. `GET /api/zones`
Returns list of all zones with their PRI scores.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "zone_id": "zone-a",
      "pri_score": 92.5,
      "success_rate": 94.2,
      "total_servers": 50,
      "hosts_count": 10,
      "vms_count": 40,
      "failed_count": 3
    }
  ]
}
```

### 2. `GET /api/zones/[id]`
Returns detailed metrics for a specific zone with HOST vs VM comparison.

**Response includes:**
- **overall**: PRI score for entire zone
- **hosts**: PRI score for HOSTs only
- **vms**: PRI score for VMs only
- **errors**: Error breakdown by type, phase, node type, and host failure impact

**Why 3 levels?** Hosts are often 100% reliable while VMs have issues. Helps isolate problems.

### 3. `GET /api/zones/[id]/errors?phase=[pre-provision|post-provision]`
Returns detailed error information with optional phase filtering.

**Query param:** `phase` - Filter by 'pre-provision' or 'post-provision' (optional)

**Response includes:**
- Error counts by type
- Individual server details (ID, status, error message, parent)
- Error distribution by node type (HOSTs vs VMs)

---

## Key Design Decisions

### 1. Three-Level Aggregation
Calculate PRI score separately for:
- **Zone (all servers)**: Overall health
- **HOSTs only**: Infrastructure health
- **VMs only**: Workload health

**Why?** Isolates where problems happen. If zone PRI=92 but hosts=96 and VMs=90, the problem is in VMs, not infrastructure.

### 2. Phase Detection from provision_percent
```
if (provision_percent < 100 AND status='provisioned') → pre-provision error
else → post-provision error
```

**Why?** Pre-provision errors block provisioning from starting (won't reach 100%). Post-provision errors occur after provisioning began.

### 3. Configurable Error Weights
Error weights stored as constants but can be customized:
- Default weights in `app/lib/constants/error-weights.ts`
- Users can override via Weight Configuration modal (stored in localStorage)
- API routes use `customWeights` parameter in calculations

**Why?** Different organizations have different risk tolerances. A network failure might be critical for some, recoverable for others.

### 4. Mock Data Fallback
Every API route returns sensible mock data if database is unavailable.

**Why?** Enables frontend development and UI testing without a live database. Production still works if DB goes down.

### 5. Real-Time Calculation
PRI scores calculated fresh on every request (not cached in DB).

**Why?** Dashboard needs current state. `zone_metrics` table is for historical trending (future feature).

### 6. Host Failure Impact Analysis
Automatically detects when a HOST fails and counts affected VMs.

**Why?** One host failure cascades to all its VMs. This gives operators impact visibility.

---

## Data Flow

```
Frontend (React)
  ↓ fetch('/api/zones/[id]', { cache: 'no-store' })
  ↓
API Route (/api/zones/[id]/route.ts)
  ↓ Query database for servers in zone
  ↓
Calculation Engine (lib/calculations/)
  ├→ aggregatePRIMetrics()    [Overall, Hosts, VMs]
  ├→ analyzeErrorDistribution() [Errors by type, phase, node]
  ├→ separateErrorsByPhase()   [Pre vs. Post]
  └→ analyzeHostFailureImpact() [Cascading VM failures]
  ↓
Response (JSON)
  ↓
Frontend Render (Charts, Cards, Tables)
```

---

## Important Files

| File | Purpose |
|------|---------|
| `app/lib/calculations/pri.ts` | PRI score calculation functions |
| `app/lib/calculations/errors.ts` | Error analysis and phase detection |
| `app/lib/constants/error-weights.ts` | Error types, weights, phases, labels |
| `app/lib/db/schema.ts` | Drizzle ORM database schema |
| `app/api/zones/route.ts` | All zones endpoint |
| `app/api/zones/[id]/route.ts` | Zone detail endpoint |
| `app/api/zones/[id]/errors/route.ts` | Zone errors endpoint |

---

## Common Formulas Quick Reference

| Metric | Formula |
|--------|---------|
| Success Rate | (Successful / Total) × 100 |
| Performance | 100 - (AvgTime / 60) × 100 |
| Stability (CV) | 100 - ((StdDev / Mean) × 100) |
| Error Penalty | (ΣErrorCount × Weight) / Total × 100 |
| PRI Score | (SR×0.4) + (P×0.3) + (S×0.2) - (EP×0.1) |

---

## Setup & Environment

### Required `.env.local`
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=provisioning_db
```

### Without Database
App works with mock data. No setup needed for development.

### Build & Run
```bash
npm run dev        # Start dev server (port 3000)
npm run build      # Production build
npm run lint       # Check code
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| API returns mock data | Database not connected | Set `.env.local` with DB credentials |
| PRI scores seem wrong | Custom weights in localStorage | Check Weight Configuration modal |
| VMs show failures but HOSTs don't | Host failure impact | Check if a HOST has `error_type='HOST_FAILURE'` |
| Phase detection wrong | provision_percent not set | Ensure servers have valid `provision_percent` (0-100) |

---

## Next Steps

- **Add time-series trends**: Use `zone_metrics` table to store historical data
- **Custom weight persistence**: Save custom weights to database instead of localStorage
- **Alert system**: Trigger notifications when PRI drops below threshold
- **Automated remediation**: Auto-scale or restart failed servers

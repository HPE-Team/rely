## 1. What PRI is

A single score in **[0, 100]** that ranks something based on provisioning reliability. This can be anything, a *fleet*, a *Zone* or an *ESX* / *VM* pool. 

Let's think of it like this. Basically we start with a set score of 100 and we deduct points if it fails to meet certain pre determined criteria in a pre determined manner.

PRI answers one question: **is this pool meeting expectations?**

It looks at four main indicators:

1. **Success rate** : did provisions that were started finish or not.
2. **Stability** : did they finish with comparable (consistent) timings.
3. **Error severity** : when they failed, how bad was the failure? Was it something crucial or just some small error
4. **Outliers** : did a few provisions take much longer than other provisions.

Do note that the PRI doesnt try to classify *why* something failed, that job is for the *color* (`green | amber | red`).
We use a combination of a **PRI value** and a **color** to rate a pool.

---

## 2. Inputs

The PRI calculator reads one row per server:

```ts
type ComputeServer = {
  id: number;
  parent_server_id: number | null;   // VMs point at their ESX host, null for ESXs
  node_type: "HOST" | "VM";
  status: "provisioned" | "failed";
  provision_time: number;            // seconds
  error_type: ErrorType | null;      // only set on failure, currently its part of the seed script but can be replaced by a middleware if needed accordingly.
};
```

Error types (enum) as of now:

```ts
type ErrorType =
  | "HARDWARE_FAILURE"
  | "POWER_FAILURE"
  | "STORAGE_FAILURE"
  | "HOST_FAILURE"
  | "NETWORK_FAILURE"
  | "IP_FAILURE"
  | "RESOURCE_FAILURE";
```

Nothing else is used as of now.

---

## 3. Cascade deduplication

A dead ESX host takes its VMs with it. Without care, one host outage appears as `1 + N` failures and double-punishes the pool. Thus we need to blame this on the ESX and not the VMs.
Dont worry, we do handle ESX failures as a much bigger problem inside of the color classification later on.

**Hence,** before computing any metric, drop every VM that satisfies all three:

- `node_type === "VM"`
- `error_type === "HOST_FAILURE"`
- `parent_server_id` points at a host that also has `status === "failed"`

The remaining rows are called `effectiveServers`. The dropped count is surfaced separately as `cascadedFailures` so the UI can still display it, it just doesn't subtract from PRI.

---

## 4. The formula

```ts
rawPRI = 100
       − (100 − successRate)      × 0.80   // successLoss
       − (100 − stabilityScore)   × 0.20   // stabilityLoss
       − errorPenalty             × 0.10   // errorLoss
       − outlierPenalty           × 0.05   // outlierLoss

// clamp to [0, 100]

PRI = clamp(rawPRI − fleetDeviationLoss, 0, 100)
```

The four component weights (`0.80 + 0.20 + 0.10 + 0.05`) describe the pool on its own. The fleet deviation term (§5.5) is a **post-hoc deduction** applied after clamping. It is separate and does not change the weight ratios — a perfect pool still lands exactly on 100 (it has no deviation to penalize).

Why each weight:

| Term | Weight | Rationale |
|---|---|---|
| Success rate | **0.80** | Primary failure signal. A failed provision is the first thing to take action on to fix. |
| Stability | **0.20** | Variance matters, but a consistent 100%-success pool with varying provision times shouldnt tank the score by itself. Still something to look at :) |
| Error severity | **0.10** | Amplifies failures that indicate worse underlying state depending on criticality of error (pre set in code rn). |
| Outliers | **0.05** | Cut points for long-tail provisions. Real signal, rare. E.g. a deployment taking 5 mins when the median is 2 mins. |
| Fleet deviation | **configurable** | Post-hoc. See §5.5. |

Weights are a **configurable choice**, not a derived number. They're exposed so they can be tuned easily on the dashboard depending on the priority.

---

## 5. Each term in detail

### 5.1 successRate

```ts
successRate = (successful / totalServers) × 100

loss = (100 − successRate) × 0.80
```

`totalServers` here is **post-cascade-dedup**. A failed ESX with 40 cascaded VMs contributes 1 to the denominator, not 41.

### 5.2 stabilityScore

Based on the **coefficient of variation** (CV) of `provision_time` across the pool:

```ts
prov_mean  = mean(provision_times)
prov_stddev  = stddev(provision_times)

CV = (prov_mean / prov_stddev) × 100

stabilityScore = clamp(100 − CV, 0, 100) // to keep it between 0 to 100

loss = (100 − stabilityScore) × 0.20
```

### 5.3 errorPenalty

Each error type carries a weight representing how severe it is. Currently its part of the codebase while the weights are configurable. 

```ts
weightedCount = sum(count[type] × weight[type])
errorPenalty  = min(100, (weightedCount / totalServers) × 100)

loss = errorPenalty × 0.10
```

Default weights (tunable live via the settings panel):

| Error type | Weight | Severity |
|---|---|---|
| `HARDWARE_FAILURE` | 1.0 | critical |
| `POWER_FAILURE` | 1.0 | critical |
| `STORAGE_FAILURE` | 0.9 | critical |
| `HOST_FAILURE` | 0.9 | critical |
| `NETWORK_FAILURE` | 0.7 | high |
| `IP_FAILURE` | 0.5 | medium |
| `RESOURCE_FAILURE` | 0.3 | low |

### 5.4 outlierPenalty - dynamic IQR upper fence

We perform [Tukey's Rule](https://en.wikipedia.org/wiki/Tukey's_range_test) on the provision-time distribution, but with a **per-VM multiplier** that reflects how resource-heavy each VM is. Larger VMs naturally take longer to provision; giving them a wider fence avoids false-positives.

**Step 1 — compute the fleet resource medians** (over all servers with valid resource data):

```ts
med_mem  = median(max_memory  values in pool)
med_cpu  = median(max_cores   values in pool)
med_stor = median(max_storage values in pool)
```

**Step 2 — compute per-VM k_i**:

```ts
ratio_mem  = vm.max_memory  > 0 ? vm.max_memory  / med_mem  − 1 : 0
ratio_cpu  = vm.max_cores   > 0 ? vm.max_cores   / med_cpu  − 1 : 0
ratio_stor = vm.max_storage > 0 ? vm.max_storage / med_stor − 1 : 0

k_i = clamp(
  1.5
  + α_mem  × ratio_mem
  + α_cpu  × ratio_cpu
  + α_stor × ratio_stor,
  0.5,   // floor  — never too lenient for very small VMs
  4.0    // ceiling — very large VMs still have a finite limit
)
```

`α_mem`, `α_cpu`, `α_stor` are the **Outlier Resource Impact** sliders in Settings (defaults: 0.3, 0.3, 0.2). A VM with twice the median memory and `α_mem = 0.3` gets `k_i = 1.5 + 0.3 × 1 = 1.8`.

If a VM has no resource data, all ratios are 0 and `k_i = 1.5` (the classic Tukey default).

**Step 3 — compute each VM's personal fence**:

```ts
Q1, Q3 = 25th and 75th percentiles of provision_times in pool
IQR    = Q3 − Q1
fence_i = Q3 + k_i × IQR
```

**Step 4 — score**:

```ts
outlierCount   = count of VMs where provision_time > fence_i
outlierRatio   = outlierCount / totalServers
outlierPenalty = outlierRatio × 100

loss = outlierPenalty × 0.05
```

This is the **only** provision-time tail signal. There is no absolute "ideal provision time" — the pool's own distribution is the reference. A slow-but-consistent fleet loses nothing here; a fast fleet with a few stragglers does.

### 5.5 fleetDeviationLoss - fleet-relative penalty

The four terms above measure a zone *in isolation*. Fleet deviation adds a **relative penalty**: a zone that falls below the fleet-wide PRI baseline gets extra points deducted, proportional to how far it lags.

```ts
// Compute fleet PRI first (no deviation applied — avoids circular dependency)
fleetPRI = aggregatePRI(allServersAcrossAllZones)

// Then for each zone
fleetDeviationLoss = max(0, fleetPRI − rawZonePRI) × fleetDeviationImpact
```

Key properties:

- **One-sided.** Zones *above* the fleet baseline receive zero deduction. Only laggards are penalized.
- **Post-hoc.** Applied after the four-term PRI is clamped to [0, 100]. It is not part of the 100% weight pool; the normal weights still sum to 1.
- **Configurable.** `fleetDeviationImpact` (default `0.05`) is a separate slider in Settings (range 0–0.2). Set it to 0 to disable entirely.
- **Fleet-aware.** The fleet PRI is recomputed from scratch across all zones every request — it is never an average of zone PRIs, and it ignores the deviation penalty itself when acting as the baseline.

**Example:**
- Fleet PRI = 88, Zone PRI (raw) = 74, `fleetDeviationImpact` = 0.05
- `fleetDeviationLoss = (88 − 74) × 0.05 = 0.70`
- Final zone PRI = max(0, 74 − 0.70) ≈ 73.3

The loss is intentionally small by default — it nudges the ranking without masking the absolute score. Raise `fleetDeviationImpact` if you want zone-vs-fleet comparisons to carry more weight.

---

## 6. Stability vs outliers - why both

They look similar but measure different things:

- **Stability / CV** - *global spread*. How tightly clustered is the whole distribution.
- **Outlier penalty** - *tail mass*. How many individual provisions are pathologically slow relative to their peers.

| Scenario | Stability | Outliers |
|---|---|---|
| All provisions 60–120s, evenly spread | low (wide CV) | zero (no extreme tail) |
| All provisions ≈60s, 3 servers at 600s | high (tight core) | non-zero (tail breaches fence) |
| All provisions identical | 100 | zero |

Both signals are real. Small weights stop either from dominating.

---

## 7. Color (orthogonal to PRI)

Alongside PRI, every pool gets a **color**: `green | amber | red`. It encodes operational risk a single number hides.

Inputs:

- `priScore` from §4
- `criticalRatio` = (errors with severity `critical`) / totalErrors
- `esxFailShare` = failedHosts / **totalServers in this scope** (pool-relative, not error-relative)

```text
red:
  priScore      <  t.pri.amber
  OR criticalRatio ≥ t.criticalRatio.red
  OR esxFailShare  ≥ t.esxFailShare.red

green:
  priScore      ≥ t.pri.green
  AND criticalRatio < t.criticalRatio.amber
  AND esxFailShare  < t.esxFailShare.amber

otherwise → amber
```

Default thresholds:

| Threshold | Green | Amber | Red |
|---|---|---|---|
| `pri` | ≥ 85 | - | < 70 |
| `criticalRatio` | < 0.30 | 0.30 | ≥ 0.60 |
| `esxFailShare` | < 0.05 | 0.05 | ≥ 0.10 |

All of these are tunable live through the settings panel.

**Why two zones with PRI 82 can color differently:**

- Zone X: 82 PRI, 5% critical errors, 1% ESX fail share → **amber** (below green gate on PRI, but severity is fine).
- Zone Y: 82 PRI, 65% of errors are critical → **red** (severity override).

---

## 8. Loss attribution (what the breakdown modal shows)

Clicking a PRI card opens a breakdown built from the same numbers:

```ts
{
  base:                100,
  successLoss:         (100 − successRate)    × 0.80,
  stabilityLoss:       (100 − stabilityScore) × 0.20,
  errorLoss:           errorPenalty           × 0.10,
  outlierLoss:         outlierPenalty         × 0.05,
  fleetDeviationLoss:  max(0, fleetPRI − rawPRI) × fleetDeviationImpact,
  total:               clamp(100 − sum(losses), 0, 100),
  contributions:       [sorted by loss, largest first],
}
```

`fleetDeviationLoss` only appears in contributions when it is greater than zero. It is shown in blue in the breakdown modal to distinguish it from the within-pool losses.

Each scope (overall / hosts / VMs) carries its own breakdown so you can tell *which pool* the loss is coming from.

---

## 9. Scope differences

The same formula runs on different input sets:

| Scope | Input | Note |
|---|---|---|
| Zone overall | all servers in the zone | Cascade dedup applies. |
| Zone hosts | only `HOST` rows | No cascade relation (hosts have no parent). |
| Zone VMs | only `VM` rows | Cascade dedup runs, but with no hosts in the pool `failedHostIds` is empty, cascaded VM failures *are* counted in this scope. Treat overall as authoritative; per-type PRIs are diagnostic. |
| Fleet | every server across every zone | Recalculated from scratch, not just an average of averages. |

---

## 10. Configuration

One config blob drives everything:

```ts
type PRIConfig = {
  errorWeights: Record<ErrorType, number>;

  // Dynamic per-VM Tukey fence (replaces the old single iqrMultiplier)
  outlierResourceImpact: {
    memory:  number;   // α_mem  — default 0.3
    cores:   number;   // α_cpu  — default 0.3
    storage: number;   // α_stor — default 0.2
  };

  // Fleet deviation post-hoc penalty
  fleetDeviationImpact: number;                    // default 0.05, range [0, 0.2]

  colorThresholds: {
    pri:           { green: number; amber: number };
    criticalRatio: { amber: number; red: number };
    esxFailShare:  { amber: number; red: number };
  };
};
```

`outlierResourceImpact` replaces the old single `iqrMultiplier`. Old saved configs with `iqrMultiplier` are silently migrated on load — the key is dropped and the new defaults are used.

We store this in the browser localStorage for the user to update and view accordingly. Can move some famous templates to server side if thats ever a use case.

Thats about it on the calculation part, as based on discussions and future iterations this can be updated :)

Thanks for reading !

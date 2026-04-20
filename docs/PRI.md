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
PRI = 100
    − (100 − successRate)      × 0.80   // successLoss
    − (100 − stabilityScore)   × 0.20   // stabilityLoss
    − errorPenalty             × 0.10   // errorLoss
    − outlierPenalty           × 0.05   // outlierLoss

// clamp to [0, 100]
```

The two positive weights (`0.80 + 0.20`) sum to **1.0**, so a perfect pool lands exactly on 100.

Why each weight:

| Term | Weight | Rationale |
|---|---|---|
| Success rate | **0.80** | Primary failure signal. A failed provision is the first thing to take action on to fix. |
| Stability | **0.20** | Variance matters, but a consistent 100%-success pool with varying provision times shouldnt tank the score by itself. Still something to look at :) |
| Error severity | **0.10** | Amplifies failures that indicate worse underlying state depending on criticality of error (pre set in code rn). |
| Outliers | **0.05** | Cut points for long-tail provisions. Real signal, rare. E.g. a deployment taking 5 mins when the median is 2 mins. |

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

### 5.4 outlierPenalty - IQR upper fence

We perform [Tukey's Rule](https://en.wikipedia.org/wiki/Tukey's_range_test) on the provision-time distribution:

```ts
Q1, Q3 = 25th and 75th percentiles
IQR    = Q3 − Q1
fence  = Q3 + k × IQR            // k = iqrMultiplier, default 1.5, this can also be changed on the dashboard

outlierRatio   = (count above fence) / totalServers
outlierPenalty = outlierRatio × 100

loss = outlierPenalty × 0.05
```

This is the **only** provision-time tail signal. There is no absolute "ideal provision time" - the pool's own median is the reference. A slow-but-consistent fleet loses nothing here; a fast fleet with a few stragglers does. Can change if discussed accordingly. Maybe if theres a target deployment time for a specific configuration that can act as a guide.

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
  base:           100,
  successLoss:    (100 − successRate)    × 0.80,
  stabilityLoss:  (100 − stabilityScore) × 0.20,
  errorLoss:      errorPenalty           × 0.10,
  outlierLoss:    outlierPenalty         × 0.05,
  total:          clamp(100 − sum(losses), 0, 100),
  contributions:  [sorted by loss, largest first],
}
```

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
  iqrMultiplier: number;                           // default 1.5
  colorThresholds: {
    pri:           { green: number; amber: number };
    criticalRatio: { amber: number; red: number };
    esxFailShare:  { amber: number; red: number };
  };
};
```

We store this in the browser localStorage for the user to update and view accordingly. Can move some famous templates to server side if thats ever a use case.

Thats about it on the calculation part, as based on discussions and future iterations this can be updated :)

Thanks for reading !

## 1. What the data generator does

The data generator is a **synthetic provisioning engine**. It produces a realistic fleet of ESX hosts and virtual machines, each with a provisioning outcome (`provisioned` or `failed`), a timing, and — when things go wrong — an error classification.

Think of it as a simulation that walks through the same logical stages a real hypervisor would, but uses probability models instead of talking to actual hardware. The output feeds directly into the PRI calculator and the dashboard, giving us data that *behaves* like production.

The generator runs in **five phases**, each building on the last:

1. **Zone setup** — create the geography.
2. **Host generation** — spin up ESX hosts across zones.
3. **VM generation** — provision VMs onto those hosts, running each through a failure pipeline.
4. **Cascading failures** — simulate a host crash taking down all its VMs after provisioning.
5. **Power state consistency** — clean up any impossible states.

---

## 2. Zones and configuration

Before anything is generated, the simulation sets up the *world*. Five zones, each with its own personality:

```python
SIM_CONFIG = {
    "zone-a": {"base_failure_rate": 0.005, "ip_pool": 500},
    "zone-b": {"base_failure_rate": 0.02,  "ip_pool": 400},
    "zone-c": {"base_failure_rate": 0.05,  "ip_pool": 300},
    "zone-d": {"base_failure_rate": 0.10,  "ip_pool": 250},
    "zone-e": {"base_failure_rate": 0.00,  "ip_pool": 1000},
}
```

`base_failure_rate` drives host-level failures. `ip_pool` is a finite counter — once a zone's IPs run out, new VMs in that zone will fail with `IP_FAILURE`. This lets us simulate address-space starvation organically.

Zone selection is weighted, currently uniform (20% each), but the weights can be adjusted to model uneven fleet distribution:

```python
ZONE_WEIGHTS = {
    "zone-a": 0.2, "zone-b": 0.2, "zone-c": 0.2,
    "zone-d": 0.2, "zone-e": 0.2,
}
```

---

## 3. Phase 1 — Host generation

The generator creates **250 hosts** spread across zones. Host generation is intentionally simple — a host either comes up or it doesn't.

```python
for i in range(1, host_total + 1):
    zone = choose_zone(ZONE_WEIGHTS)

    fail_prob = SIM_CONFIG[zone]['base_failure_rate']
    status = 'failed' if random.random() < fail_prob else 'provisioned'

    err_type = 'HARDWARE_FAILURE' if status == 'failed' else None
    err = 'hardware failure' if status == 'failed' else None
```

That's the core decision. A single random roll against the zone's `base_failure_rate`. If the host fails, it gets tagged as `HARDWARE_FAILURE` — because at the ESX level, if the box won't provision, it's the hardware.

A few more details are filled in for each host:

```python
prov_time = random.uniform(40, 120)                          # 40s to 2min
power_state = 'on' if random.random() < 0.98 else 'off'     # 2% chance of being off

prov_pct = 100.00 if status == 'provisioned' else random.uniform(20, 80)
st_msg = 'Provisioning completed' if status == 'provisioned' \
    else 'Provisioning failed'
```

Note the `power_state` coin-flip. Even a *successfully provisioned* host has a 2% chance of being powered off. This models a real scenario where a host was provisioned fine but later lost power. This becomes important later when we enforce power-state consistency on VMs.

Each host also gets a **health score** derived from its zone's base failure rate:

```python
base_health = (1 - SIM_CONFIG[zone]['base_failure_rate']) * 100
host_health = base_health * random.uniform(0.8, 1)

if status == 'failed':
    host_health = 0
```

A failed host has 0 health. A provisioned host's health hovers between 80–100% of the zone's baseline. This health score is passed down to VMs and influences their failure probabilities.

---

## 4. Phase 2 — VM generation (the big one)

This is where it gets interesting. The generator creates **2,250 VMs** and distributes them across existing hosts (5–15 VMs per host). Each VM walks through a **provisioning pipeline** that mirrors real-world stages. If it fails at any stage, it gets the corresponding error type, and the provision progress freezes at a percentage matching where in the pipeline it died.

### 4.1 Host assignment and VM sizing

```python
# Enforce 5-15 VMs per host
avail_hosts = [h for h in hosts if host_vm_counts[h['id']] < 15]
h = random.choice(avail_hosts) if avail_hosts else random.choice(hosts)
host_vm_counts[h['id']] += 1

# VM size distribution
m_rand = random.random()
if m_rand < 0.4:     mem, cores = 2048, 2     # small — 40%
elif m_rand < 0.75:  mem, cores = 4096, 4     # medium — 35%
else:                mem, cores = 8192, 8     # large — 25%

s_rand = random.random()
storage = 100 if s_rand < 0.33 else 200 if s_rand < 0.66 else 500
```

Larger VMs (8 GB RAM, 500 GB storage) are deliberately more failure-prone later in the pipeline. This is by design — bigger workloads stress resources harder.

### 4.2 Environmental signals

Before the failure pipeline runs, the generator computes a set of **environmental signals** that feed into failure probabilities:

```python
host_health = float(h['status_percent'])
host_power_off = h['power_state'] == 'off'

network_quality = random.uniform(0, 0.85) + (host_health / 100) * 0.15

is_peak = 18 <= dt.hour <= 22
if is_peak:
    network_quality = max(0, network_quality - 0.2)
```

- **Host health** — inherited from the parent host. A degraded host degrades its VMs.
- **Network quality** — a score from 0 to 1 where higher is better. Derived from host health plus random variation, *reduced during peak hours* (6 PM – 10 PM).
- **Peak hours** — VMs provisioned between 18:00–22:00 face worse network quality and longer provision times.

---

## 5. The failure pipeline — in order

Now we get to the core of the simulation. Every VM is run through a series of checks **in strict order**. The first one to fail wins — the VM is marked as `failed` with that error type, and the remaining checks are skipped.

This mirrors how a real provisioning pipeline works: you can't attach storage if the host is powered off, and you can't connect to the network if resource allocation already failed.

### 5.0 The progress map

Each error type maps to a provision-progress range. When a VM fails, its `provision_percent` is sampled from that range — giving the UI a realistic "how far did it get?" indicator:

```python
FAILURE_PROGRESS = {
    'POWER_FAILURE':    (0, 10),     # died at the door
    'RESOURCE_FAILURE': (10, 25),    # couldn't allocate CPU/memory
    'IP_FAILURE':       (35, 55),    # couldn't get an IP address
    'NETWORK_FAILURE':  (50, 75),    # network handshake failed
    'STORAGE_FAILURE':  (70, 95),    # disk attach failed
    'HOST_FAILURE':     (60, 95),    # host crashed (cascading)
}
```

Notice the progression — `POWER_FAILURE` barely gets past 0–10%, while `STORAGE_FAILURE` gets as far as 70–95% before dying. This is realistic: storage attachment is one of the last steps in provisioning.

### 5.1 Stage 1 — Power check (Pre-provision)

```python
if host_power_off:
    err_type = 'POWER_FAILURE'
    err = 'host power off'
```

**The very first thing we check.** If the parent host's power state is `off`, there is nothing to do — the VM cannot even begin provisioning. No probability roll here, it's a deterministic failure.

- **Progress range:** 0–10% (barely started)
- **When it happens:** ~2% of hosts are randomly powered off, so this catches any VM assigned to one of those hosts.

### 5.2 Stage 2 — Resource allocation (Pre-provision)

```python
host_failure_rate = 1 - host_health / 100
resource_failure_prob = max(0, host_failure_rate * 0.7 - 0.02)

if mem == 8192:
    resource_failure_prob += 0.15

resource_fail = random.random() < resource_failure_prob
```

Can we actually allocate the requested CPU and memory? This depends on:

- **Host health** — a degraded host (low health score) has less headroom. The probability scales with how unhealthy the host is.
- **VM size** — 8 GB VMs add a flat +15% failure probability. Big workloads are harder to place.

If the host is healthy (health ≈ 100%), the base probability is essentially `0.7 * 0 - 0.02 = 0` (floored to 0). For a degraded host at 80% health, it climbs to `0.7 * 0.2 - 0.02 = 0.12` — a 12% chance. Add the 8 GB tax and you're at 27%.

```python
elif resource_fail:
    err_type = 'RESOURCE_FAILURE'
    err = 'insufficient memory' if mem == 8192 else 'permission denied'
```

- **Error:** `RESOURCE_FAILURE`
- **Message:** `"insufficient memory"` for 8 GB VMs, `"permission denied"` for smaller ones.
- **Progress range:** 10–25%

### 5.3 Stage 3 — IP allocation (Pre-provision)

```python
ip_fail = ip_pool[h['zone']] <= 0
if not ip_fail:
    ip_pool[h['zone']] -= 1
```

Each zone has a finite IP pool. Every successful IP check decrements the counter. Once a zone's pool hits 0, **every subsequent VM in that zone fails with `IP_FAILURE`**.

This is a **deterministic, cumulative** failure. Early VMs in a zone are fine. Late VMs in a tight zone (like zone-d with only 250 IPs for potentially hundreds of VMs) will start failing once the pool drains. It creates a realistic "resource exhaustion cliff" in the data.

```python
elif ip_fail:
    err_type = 'IP_FAILURE'
    err = 'IP pool exhausted'
```

- **Error:** `IP_FAILURE`
- **Message:** `"IP pool exhausted"`
- **Progress range:** 35–55%

---

> **These three — Power, Resource, IP — are the pre-provision errors.** They happen before the VM even starts talking to the network or storage layers. If any of them fires, the VM is dead. Only if all three pass does the VM proceed to mid/post-provision stages.

---

### 5.4 Stage 4 — Network connection (Mid/Post-provision)

```python
network_fail = network_quality < 0.10
```

At this point the VM has been allocated resources and an IP. Now it needs to establish a network connection. This is a threshold check on the network quality score — if it drops below 0.10, the network is considered unreachable.

Remember, `network_quality` is a composite of:
- A random baseline (0 to 0.85)
- A bonus from host health (+0 to +0.15)
- A penalty during peak hours (−0.20 during 18:00–22:00)

So a degraded host during peak hours can see the network quality score dip below the threshold and fail.

```python
elif network_fail:
    err_type = 'NETWORK_FAILURE'
    err = 'network timeout'
```

- **Error:** `NETWORK_FAILURE`
- **Message:** `"network timeout"`
- **Progress range:** 50–75%

### 5.5 Stage 5 — Storage attachment (Mid/Post-provision)

```python
storage_failure_prob = max(0, host_failure_rate * 0.7 - 0.03)
if storage >= 500:
    storage_failure_prob += 0.10
if network_quality < 0.30:
    storage_failure_prob += 0.10

storage_fail = random.random() < storage_failure_prob
```

The final provisioning gate. Storage attachment failure probability depends on:

| Factor | Effect |
|---|---|
| Host health (via `host_failure_rate`) | Degraded host → higher base probability |
| Large disk (≥ 500 GB) | +10% failure probability |
| Poor network (quality < 0.30) | +10% — storage protocols need network connectivity |

A healthy host with a small disk and good network has essentially 0% storage failure. A degraded host with a 500 GB disk during a peak-hour network dip could easily see 25%+ failure probability.

```python
elif storage_fail:
    err_type = 'STORAGE_FAILURE'
    err = 'disk attach failed'
```

- **Error:** `STORAGE_FAILURE`
- **Message:** `"disk attach failed"`
- **Progress range:** 70–95%

---

## 6. Determining the outcome

After the pipeline, the VM's final status and progress are set:

```python
status = 'failed' if err_type else 'provisioned'

# VM power state follows from provisioning + host availability
power_state = 'on' if status == 'provisioned' and not host_power_off else 'off'

if status == 'provisioned':
    prov_pct = 100.0
else:
    low, high = FAILURE_PROGRESS[err_type]
    prov_pct = random.uniform(low, high)
```

For provisioned VMs, the provision time is computed from several factors:

```python
prov_time = (
    50                                              # base time
    + (mem / 150)                                   # memory overhead
    + (storage / 20)                                # storage overhead
    + random.uniform(0, 40)                         # random jitter
    + (host_failure_rate * random.uniform(40, 80))  # host degradation penalty
)

if is_peak:
    prov_time += random.uniform(10, 25)     # peak hour penalty
if network_quality < 0.35:
    prov_time += random.uniform(10, 30)     # poor network penalty
if storage >= 500:
    prov_time += random.uniform(5, 15)      # large disk penalty
```

So a small VM on a healthy host outside peak hours might provision in ~60 seconds. A large VM on a degraded host during peak hours with poor network? Easily 180+ seconds. This variation is what drives the **stability** and **outlier** components of the PRI score.

Successfully provisioned VMs also receive a health score derived from their host:

```python
vm_health = float(h['status_percent']) - random.uniform(0, 8)
if network_quality < 0.35:
    vm_health -= random.uniform(5, 15)
if storage >= 500:
    vm_health -= random.uniform(5, 10)
if is_peak:
    vm_health -= random.uniform(5, 10)
vm_health = max(0, min(100, vm_health))
```

---

## 7. Pipeline summary — the full picture

Here's the entire failure pipeline as a flowchart:

```
VM assigned to host
        │
        ▼
┌─────────────────────┐
│ Is host powered on? │──── NO ──→ POWER_FAILURE (0–10%)
└────────┬────────────┘
         │ YES
         ▼
┌─────────────────────────────┐
│ Can we allocate CPU/memory? │──── NO ──→ RESOURCE_FAILURE (10–25%)
└────────┬────────────────────┘
         │ YES
         ▼
┌──────────────────────────┐
│ Are IPs available?       │──── NO ──→ IP_FAILURE (35–55%)
└────────┬─────────────────┘
         │ YES
         ▼
  ── PRE-PROVISION COMPLETE ──
         │
         ▼
┌──────────────────────────┐
│ Network reachable?       │──── NO ──→ NETWORK_FAILURE (50–75%)
└────────┬─────────────────┘
         │ YES
         ▼
┌──────────────────────────┐
│ Storage attach OK?       │──── NO ──→ STORAGE_FAILURE (70–95%)
└────────┬─────────────────┘
         │ YES
         ▼
   ✅ PROVISIONED (100%)
```

The percentages in parentheses are the `provision_percent` range — how far the progress bar got before it stopped.

---

## 8. Phase 3 — Cascading failures (post-provision)

After all hosts and VMs are individually generated, the generator runs a **cascade pass**. This simulates what happens in reality when an ESX host crashes *after* its VMs have already been provisioned — every VM on that host goes down with it.

```python
# For every VM whose parent host has status = "failed":
#   → mark the VM as failed with HOST_FAILURE
#   → set power state to off
#   → set provision percent to a random value between 60–95%

UPDATE v
SET
  v.status           = 'failed',
  v.error_type       = 'HOST_FAILURE',
  v.error_message    = 'host failure',
  v.status_message   = 'Provisioning failed',
  v.provision_percent = round(60 + random() * 35, 2),
  v.power_state      = 'off'
WHERE parent_host.status = 'failed'
  AND parent_host.node_type = 'HOST'
  AND v.node_type = 'VM';
```

This is a bulk operation that finds every VM whose parent host is `failed`, and forcibly flips the VM to `failed` with error type `HOST_FAILURE`. The `provision_percent` is set to 60–95% — as if the VM was mostly provisioned before the host went down.

**Why this matters for PRI:** Without cascade deduplication (described in the [How we calculate PRI doc](./PRI.md)), one bad host with 15 VMs would count as 16 failures. The PRI calculator handles this by filtering out cascade victims, but the raw data *does* contain all 16 failed rows — so the dashboard can still show the full blast radius.

---

## 10. Error types — complete reference

Here's every error the generator can produce, in pipeline order:

| Error type | Stage | Cause | Deterministic? | Progress |
|---|---|---|---|---|
| `POWER_FAILURE` | Pre-provision | Host is powered off | ✅ Yes | 0–10% |
| `RESOURCE_FAILURE` | Pre-provision | Can't allocate CPU/RAM | ❌ Probabilistic | 10–25% |
| `IP_FAILURE` | Pre-provision | Zone IP pool exhausted | ✅ Yes (once pool = 0) | 35–55% |
| `NETWORK_FAILURE` | Mid-provision | Network quality below threshold | ❌ Probabilistic | 50–75% |
| `STORAGE_FAILURE` | Mid-provision | Disk attach failed | ❌ Probabilistic | 70–95% |
| `HOST_FAILURE` | Post-provision | Host crash cascade | ✅ Yes (bulk pass) | 60–95% |
| `HARDWARE_FAILURE` | Host-only | Host failed to provision | ❌ Probabilistic | 20–80% |

`HARDWARE_FAILURE` is only ever assigned to hosts, never to VMs. All other errors are VM-specific (except `HOST_FAILURE` which is set by the cascade pass).

---

## 11. What the data looks like

A healthy fleet run (zone-e style) produces rows like:

| node_type | status | error_type | provision_percent | provision_time |
|---|---|---|---|---|
| HOST | provisioned | — | 100.00 | 67.42s |
| VM | provisioned | — | 100.00 | 83.15s |
| VM | provisioned | — | 100.00 | 71.88s |

A troubled zone-d run might look like:

| node_type | status | error_type | provision_percent | provision_time |
|---|---|---|---|---|
| HOST | failed | HARDWARE_FAILURE | 43.21 | 89.55s |
| VM | failed | HOST_FAILURE | 78.44 | 102.33s |
| VM | failed | HOST_FAILURE | 65.89 | 95.12s |
| VM | failed | RESOURCE_FAILURE | 18.73 | 112.44s |
| VM | failed | IP_FAILURE | 41.22 | 88.90s |

---

## 12. The execution order

When data generation is triggered, this is the exact sequence:

1. Set up zone geography (5 zones with their configurations).
2. Generate and insert **250 hosts** across zones.
3. Generate and insert **2,250 VMs**, each walking through the failure pipeline.
4. Run the **cascade pass** — propagate host failures to their child VMs.
5. Run the **power state consistency pass** — fix any impossible states.

Steps 4 and 5 are post-generation operations that modify the data *after* individual generation is complete. This two-pass approach is deliberate — it's simpler to generate VMs optimistically and then apply cascade effects in bulk, rather than threading cascade logic into the per-VM generation.

---

That covers the full data generation pipeline. If you want to understand how the generated data is *scored*, check out the [How we calculate PRI](./PRI.md) guide :)

Thanks for reading!
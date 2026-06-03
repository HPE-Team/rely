---
theme: none
title: Rely
canvasWidth: 1280
canvasHeight: 720
highlighter: shiki
shikiConfig:
  theme: github-dark
lineNumbers: false
transition: slide-left
colorSchema: dark
fonts:
  sans: Space Grotesk
  mono: Geist Mono
  weights: "400,500,600,700"
---

<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:24px;text-align:center;background:#1c1c1c;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%, rgba(64,96,208,0.07) 0%, transparent 65%)"></div>
  <svg width="56" height="56" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:0.85;position:relative">
    <path d="M14 2.33333V25.6667M22.2496 5.75042L5.7504 22.2496M25.6666 14H2.33331M22.2496 22.2496L5.7504 5.75042" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div style="position:relative">
    <div style="font-size:76px;font-weight:700;letter-spacing:-0.04em;color:#fff;line-height:1;font-family:'Space Grotesk',sans-serif">Rel<span style="color:#4060D0">y</span>.</div>
    <div style="color:#a8a8a8;font-size:15px;margin-top:14px;font-family:'Space Grotesk',sans-serif">A metric for analyzing, classifying, and improving provisioning reliability across cloud infrastructure.</div>
  </div>
  <div style="position:absolute;bottom:28px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:32px;font-family:'Geist Mono',monospace">
    <div style="text-align:center">
      <div style="font-size:8.5px;letter-spacing:0.10em;text-transform:uppercase;color:#505050;margin-bottom:5px">Contributors</div>
      <div style="font-size:10px;color:#707070;letter-spacing:0.02em">Akhil&nbsp;&nbsp;·&nbsp;&nbsp;Harsh Iyer&nbsp;&nbsp;·&nbsp;&nbsp;Kartik Balani&nbsp;&nbsp;·&nbsp;&nbsp;Niranjan&nbsp;&nbsp;·&nbsp;&nbsp;Sachin Singh</div>
    </div>
    <div style="width:1px;height:24px;background:rgba(255,255,255,0.05)"></div>
    <div style="text-align:center">
      <div style="font-size:8.5px;letter-spacing:0.10em;text-transform:uppercase;color:#505050;margin-bottom:5px">Mentors</div>
      <div style="font-size:10px;color:#707070;letter-spacing:0.02em">Deven&nbsp;&nbsp;·&nbsp;&nbsp;Jaya</div>
    </div>
    <div style="width:1px;height:24px;background:rgba(255,255,255,0.05)"></div>
    <div style="text-align:center">
      <div style="font-size:8.5px;letter-spacing:0.10em;text-transform:uppercase;color:#505050;margin-bottom:5px">Faculty Mentor</div>
      <div style="font-size:10px;color:#707070;letter-spacing:0.02em">Victer Paul</div>
    </div>
  </div>
</div>

---
layout: default
---


# The Problem

<p style="color:#a8a8a8;font-size:13px;margin:-8px 0 14px">Provisioning failures are inevitable. <strong style="color:#fff">Knowing which zone is reliable, why failures happen, and where the next one is coming from</strong> — that's what operators don't have today.</p>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:stretch">
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-top:2px solid #fbbf24;border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:10px">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#fbbf24">Before deployment</div>
    <div style="color:#fff;font-size:13px;font-weight:600;line-height:1.3">No single source of truth</div>
    <div style="color:#808080;font-size:12px;line-height:1.55">Operator checks 5 dashboards, asks 2 colleagues, and still picks a zone on gut feel. The IP exhaustion signal was in the logs 3 days ago.</div>
    <div style="margin-top:auto;background:#1c1810;border:1px solid rgba(251,191,36,0.18);border-radius:6px;padding:10px 12px;text-align:center">
      <div style="font-family:'Geist Mono',monospace;font-size:20px;font-weight:700;color:#fbbf24;line-height:1">5 dashboards</div>
      <div style="font-size:10.5px;color:#808080;margin-top:4px">checked before every deployment — zero confidence</div>
    </div>
  </div>
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-top:2px solid #f87171;border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:10px">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#f87171">During operations</div>
    <div style="color:#fff;font-size:13px;font-weight:600;line-height:1.3">Silent reliability drift</div>
    <div style="color:#808080;font-size:12px;line-height:1.55">Zone success rate drifts from 97% → 81% over two weeks. No alert fires. Then 40 VMs fail simultaneously — and the on-call had no idea.</div>
    <div style="margin-top:auto;background:#1f0f0e;border:1px solid rgba(248,113,113,0.18);border-radius:6px;padding:10px 12px;text-align:center">
      <div style="font-family:'Geist Mono',monospace;font-size:20px;font-weight:700;color:#f87171;line-height:1">97% → 81%</div>
      <div style="font-size:10.5px;color:#808080;margin-top:4px">two-week drift — completely invisible</div>
    </div>
  </div>
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-top:2px solid #f87171;border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:10px">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#f87171">After failure</div>
    <div style="color:#fff;font-size:13px;font-weight:600;line-height:1.3">Post-mortem from scratch</div>
    <div style="color:#808080;font-size:12px;line-height:1.55">Hardware? Network? ESX host cascade? IP exhaustion? With no structured classification, every incident is reconstructed manually from raw logs.</div>
    <div style="margin-top:auto;background:#1f0f0e;border:1px solid rgba(248,113,113,0.18);border-radius:6px;padding:10px 12px;text-align:center">
      <div style="font-family:'Geist Mono',monospace;font-size:20px;font-weight:700;color:#f87171;line-height:1">Hours of RCA</div>
      <div style="font-size:10.5px;color:#808080;margin-top:4px">per incident — every time, from zero</div>
    </div>
  </div>
</div>

---
layout: default
---


# What We Need

One number that answers: **"Is this infrastructure pool meeting provisioning expectations?"**

That number must handle:

| Requirement | Example |
|---|---|
| Cascading failures | Dead ESX takes 40 VMs — blame the host, not 41 |
| Timing variance | 60–120 s spread vs. one outlier at 600 s |
| Error criticality | Hardware failure ≠ IP address conflict |
| Capacity pressure | 90% utilization today → failure tomorrow |
| Cross-zone comparison | Zone A vs. Zone B vs. Fleet |

Works at every scope: **VM → Host → Zone → Fleet.**

<div class="stat-row">
  <div class="stat"><div class="val">[0, 100]</div><div class="lbl">PRI Range</div></div>
  <div class="stat"><div class="val">6</div><div class="lbl">Formula Terms</div></div>
  <div class="stat"><div class="val">7</div><div class="lbl">Error Classes</div></div>
  <div class="stat"><div class="val">4</div><div class="lbl">Scopes</div></div>
</div>

---
layout: default
---


# Error Scenarios

We scanned common cloud provider failure patterns and identified **7 classes** covering the critical cases.

| Error | Phase | Severity | Covers |
|---|---|---|---|
| `POWER_FAILURE` | Pre-provision | critical | Host powered off — VM can't start |
| `RESOURCE_FAILURE` | Pre-provision | low | CPU / RAM exhaustion at scheduling |
| `IP_FAILURE` | Pre-provision | medium | IPAM pool drained — no address available |
| `NETWORK_FAILURE` | Post-provision | high | NIC / switch failure |
| `STORAGE_FAILURE` | Post-provision | critical | Disk attach failed |
| `HOST_FAILURE` | Post-provision | critical | ESX host crash |
| `HARDWARE_FAILURE` | Host-level only | critical | Physical component failure |

<div class="insight">
  <strong>Phase matters</strong> — pre-provision errors (POWER, IP, RESOURCE) fire before allocation commits. Post-provision errors indicate failures after the workload was placed. Rely tracks both and surfaces them separately in the error breakdown.
</div>

---
layout: default
---


# Data Generation Overview

<p style="color:#a8a8a8;font-size:13px;margin:-8px 0 14px">A <strong style="color:#fff">synthetic provisioning engine</strong> that produces realistic fleet data in five phases — zones, hosts, VMs, cascades, and consistency cleanup.</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;margin-top:4px">
  <div style="padding-right:28px;border-right:1px solid rgba(255,255,255,0.09);display:flex;flex-direction:column;gap:12px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Simulation phases</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #4060D0;border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:10px">
        <span style="color:#4060D0;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;flex-shrink:0">01</span>
        <div><span style="color:#fff;font-size:12.5px;font-weight:600">Zone setup</span><span style="color:#606060;font-size:11.5px"> — 5 zones, each with base failure rate + IP pool</span></div>
      </div>
      <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #4060D0;border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:10px">
        <span style="color:#4060D0;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;flex-shrink:0">02</span>
        <div><span style="color:#fff;font-size:12.5px;font-weight:600">Host generation</span><span style="color:#606060;font-size:11.5px"> — 250 ESX hosts across zones</span></div>
      </div>
      <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #4060D0;border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:10px">
        <span style="color:#4060D0;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;flex-shrink:0">03</span>
        <div><span style="color:#fff;font-size:12.5px;font-weight:600">VM generation</span><span style="color:#606060;font-size:11.5px"> — 2,250 VMs through failure pipeline</span></div>
      </div>
      <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #4060D0;border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:10px">
        <span style="color:#4060D0;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;flex-shrink:0">04</span>
        <div><span style="color:#fff;font-size:12.5px;font-weight:600">Cascade pass</span><span style="color:#606060;font-size:11.5px"> — host crash → all child VMs fail</span></div>
      </div>
      <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #4060D0;border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:10px">
        <span style="color:#4060D0;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;flex-shrink:0">05</span>
        <div><span style="color:#fff;font-size:12.5px;font-weight:600">Power consistency</span><span style="color:#606060;font-size:11.5px"> — fix impossible state combinations</span></div>
      </div>
    </div>
    <div class="insight" style="margin-top:auto">VMs are generated <strong>optimistically</strong>, then cascade + consistency passes correct in bulk — simpler than threading failure logic per VM.</div>
  </div>
  <div style="padding-left:28px;display:flex;flex-direction:column;gap:12px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Zone configuration</div>
    <table>
      <thead><tr><th>Zone</th><th>Failure Rate</th><th>IP Pool</th><th>Character</th></tr></thead>
      <tbody>
        <tr><td>zone-a</td><td style="color:#4ade80">0.5%</td><td>500</td><td>Healthy baseline</td></tr>
        <tr><td>zone-b</td><td style="color:#4ade80">2%</td><td>400</td><td>Slight degradation</td></tr>
        <tr><td>zone-c</td><td style="color:#fbbf24">5%</td><td>300</td><td>Moderate risk</td></tr>
        <tr><td>zone-d</td><td style="color:#f87171">10%</td><td>250</td><td>High failure zone</td></tr>
        <tr><td>zone-e</td><td style="color:#4ade80">0%</td><td>1000</td><td>Perfect — control</td></tr>
      </tbody>
    </table>
    <div style="background:#1e1e1e;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:6px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">VM size distribution</div>
      <div style="color:#a8a8a8;font-size:12px;line-height:1.55"><span style="color:#fff;font-weight:600">40%</span> small (2 GB, 2 vCPU) · <span style="color:#fff;font-weight:600">35%</span> medium (4 GB, 4 vCPU) · <span style="color:#fff;font-weight:600">25%</span> large (8 GB, 8 vCPU). Larger VMs are deliberately more failure-prone — bigger workloads stress resources harder.</div>
    </div>
    <div class="insight" style="margin-top:auto">Zone-d's tight IP pool (<strong>250 IPs for ~450 VMs</strong>) creates a realistic resource exhaustion cliff mid-generation.</div>
  </div>
</div>

---
layout: default
---


# The Failure Pipeline

<p style="color:#a8a8a8;font-size:13px;margin:-8px 0 14px">Every VM walks through <strong style="color:#fff">5 sequential stages</strong>. First failure wins — the remaining checks are skipped, and provision progress freezes at that stage.</p>

<div style="display:flex;flex-direction:column;gap:8px;flex:1;margin-top:4px">
  <div style="display:grid;grid-template-columns:72px 1fr 1fr 1fr;gap:0;background:#282828;border:1px solid rgba(255,255,255,0.08);border-radius:8px;overflow:hidden">
    <div style="background:#2e2e2e;padding:6px 10px;font-size:9.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4060D0;font-family:'Geist Mono',monospace;display:flex;align-items:center">Stage</div>
    <div style="background:#2e2e2e;padding:6px 10px;font-size:9.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4060D0;font-family:'Geist Mono',monospace;border-left:1px solid rgba(255,255,255,0.04)">Check</div>
    <div style="background:#2e2e2e;padding:6px 10px;font-size:9.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4060D0;font-family:'Geist Mono',monospace;border-left:1px solid rgba(255,255,255,0.04)">Failure driver</div>
    <div style="background:#2e2e2e;padding:6px 10px;font-size:9.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4060D0;font-family:'Geist Mono',monospace;border-left:1px solid rgba(255,255,255,0.04)">Progress</div>
  </div>

  <div style="display:grid;grid-template-columns:72px 1fr 1fr 1fr;gap:0;background:#1f0f0e;border:1px solid rgba(248,113,113,0.12);border-left:3px solid #f87171;border-radius:8px;overflow:hidden">
    <div style="padding:8px 10px;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:#f87171;display:flex;align-items:center">1</div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04)"><div style="color:#fff;font-size:12px;font-weight:600">Power check</div><div style="color:#808080;font-size:11px">Host powered on?</div></div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04);color:#a8a8a8;font-size:11.5px"><strong style="color:#fff">Deterministic</strong> — host power_state = off → instant fail</div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04)"><div style="background:rgba(248,113,113,0.15);border-radius:4px;padding:2px 8px;font-family:'Geist Mono',monospace;font-size:11px;color:#f87171;display:inline-block">0 – 10%</div></div>
  </div>

  <div style="display:grid;grid-template-columns:72px 1fr 1fr 1fr;gap:0;background:#1c1810;border:1px solid rgba(251,191,36,0.12);border-left:3px solid #fbbf24;border-radius:8px;overflow:hidden">
    <div style="padding:8px 10px;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:#fbbf24;display:flex;align-items:center">2</div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04)"><div style="color:#fff;font-size:12px;font-weight:600">Resource alloc</div><div style="color:#808080;font-size:11px">CPU/memory available?</div></div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04);color:#a8a8a8;font-size:11.5px"><strong style="color:#fff">Probabilistic</strong> — host health + 8 GB VMs add +15%</div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04)"><div style="background:rgba(251,191,36,0.15);border-radius:4px;padding:2px 8px;font-family:'Geist Mono',monospace;font-size:11px;color:#fbbf24;display:inline-block">10 – 25%</div></div>
  </div>

  <div style="display:grid;grid-template-columns:72px 1fr 1fr 1fr;gap:0;background:#1c1810;border:1px solid rgba(251,191,36,0.12);border-left:3px solid #fbbf24;border-radius:8px;overflow:hidden">
    <div style="padding:8px 10px;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:#fbbf24;display:flex;align-items:center">3</div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04)"><div style="color:#fff;font-size:12px;font-weight:600">IP allocation</div><div style="color:#808080;font-size:11px">Zone IPs remaining?</div></div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04);color:#a8a8a8;font-size:11.5px"><strong style="color:#fff">Cumulative</strong> — pool drains per VM, cliff at zero</div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04)"><div style="background:rgba(251,191,36,0.15);border-radius:4px;padding:2px 8px;font-family:'Geist Mono',monospace;font-size:11px;color:#fbbf24;display:inline-block">35 – 55%</div></div>
  </div>

  <div style="display:flex;align-items:center;gap:8px;padding:0 8px">
    <div style="flex:1;height:1px;background:rgba(255,255,255,0.08)"></div>
    <span style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace;white-space:nowrap">PRE-PROVISION COMPLETE — proceed to mid/post stages</span>
    <div style="flex:1;height:1px;background:rgba(255,255,255,0.08)"></div>
  </div>

  <div style="display:grid;grid-template-columns:72px 1fr 1fr 1fr;gap:0;background:rgba(64,96,208,0.06);border:1px solid rgba(64,96,208,0.15);border-left:3px solid #4060D0;border-radius:8px;overflow:hidden">
    <div style="padding:8px 10px;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:#4060D0;display:flex;align-items:center">4</div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04)"><div style="color:#fff;font-size:12px;font-weight:600">Network conn</div><div style="color:#808080;font-size:11px">Network quality ≥ 0.10?</div></div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04);color:#a8a8a8;font-size:11.5px"><strong style="color:#fff">Threshold</strong> — host health + peak hours degrade quality</div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04)"><div style="background:rgba(64,96,208,0.15);border-radius:4px;padding:2px 8px;font-family:'Geist Mono',monospace;font-size:11px;color:#4060D0;display:inline-block">50 – 75%</div></div>
  </div>

  <div style="display:grid;grid-template-columns:72px 1fr 1fr 1fr;gap:0;background:rgba(64,96,208,0.06);border:1px solid rgba(64,96,208,0.15);border-left:3px solid #4060D0;border-radius:8px;overflow:hidden">
    <div style="padding:8px 10px;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:#4060D0;display:flex;align-items:center">5</div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04)"><div style="color:#fff;font-size:12px;font-weight:600">Storage attach</div><div style="color:#808080;font-size:11px">Disk allocation OK?</div></div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04);color:#a8a8a8;font-size:11.5px"><strong style="color:#fff">Multi-factor</strong> — host health + disk size + network quality</div>
    <div style="padding:8px 10px;border-left:1px solid rgba(255,255,255,0.04)"><div style="background:rgba(64,96,208,0.15);border-radius:4px;padding:2px 8px;font-family:'Geist Mono',monospace;font-size:11px;color:#4060D0;display:inline-block">70 – 95%</div></div>
  </div>

  <div class="insight" style="margin-top:auto">Progress % = <strong>how far the progress bar got</strong> before it stopped. Storage failures reach 70–95% because disk attach is one of the last steps in real provisioning.</div>
</div>

---
layout: default
---


# Cascades & Environmental Signals

<p style="color:#a8a8a8;font-size:13px;margin:-8px 0 14px">After individual generation, <strong style="color:#fff">two post-passes</strong> correct the data. Plus, environmental factors shape every probability in the pipeline.</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;margin-top:4px">
  <div style="padding-right:28px;border-right:1px solid rgba(255,255,255,0.09);display:flex;flex-direction:column;gap:12px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Cascade pass — host crash propagation</div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #f87171;border-radius:8px;padding:12px 16px;font-family:'Geist Mono',monospace;font-size:11.5px;line-height:2;color:#d4d4d4">
      <div><span style="color:#808080">FOR EACH</span> vm <span style="color:#808080">WHERE</span> parent_host.status = <span style="color:#f87171">'failed'</span></div>
      <div>  vm.status → <span style="color:#f87171">'failed'</span></div>
      <div>  vm.error_type → <span style="color:#f87171">'HOST_FAILURE'</span></div>
      <div>  vm.provision_pct → <span style="color:#a8a8a8">random(60, 95)</span></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div style="background:#1f0f0e;border:1px solid rgba(248,113,113,0.18);border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:4px">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#f87171;font-family:'Geist Mono',monospace">Raw data</div>
        <div style="color:#a8a8a8;font-size:11.5px;line-height:1.5">1 host + 15 VMs → <strong style="color:#f87171">16 failed rows</strong> in the database. Full blast radius preserved.</div>
      </div>
      <div style="background:#0e1f12;border:1px solid rgba(74,222,128,0.18);border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:4px">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4ade80;font-family:'Geist Mono',monospace">PRI scoring</div>
        <div style="color:#a8a8a8;font-size:11.5px;line-height:1.5">Cascade dedup → only <strong style="color:#4ade80">1 failure</strong> penalizes the score. VMs surfaced separately.</div>
      </div>
    </div>
    <div class="insight" style="margin-top:auto">Data shows all 16 failures — the <strong>PRI calculator</strong> deduplicates. Dashboard shows the blast radius without inflating the score.</div>
  </div>
  <div style="padding-left:28px;display:flex;flex-direction:column;gap:12px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Environmental signals — what shapes failure probability</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;align-items:center;gap:6px"><span style="color:#fff;font-size:12px;font-weight:600">Host health</span><span style="background:rgba(248,113,113,0.12);color:#f87171;font-size:9px;padding:1px 6px;border-radius:3px;font-family:'Geist Mono',monospace;font-weight:700">INHERITED</span></div>
        <div style="color:#808080;font-size:11.5px;line-height:1.45">Derived from zone base_failure_rate × random(0.8, 1.0). Failed host = 0. Degraded hosts degrade all child VMs.</div>
      </div>
      <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;align-items:center;gap:6px"><span style="color:#fff;font-size:12px;font-weight:600">Network quality</span><span style="background:rgba(251,191,36,0.12);color:#fbbf24;font-size:9px;padding:1px 6px;border-radius:3px;font-family:'Geist Mono',monospace;font-weight:700">COMPOSITE</span></div>
        <div style="color:#808080;font-size:11.5px;line-height:1.45">random(0, 0.85) + host_health bonus. During peak hours (18:00–22:00), −0.20 penalty. Affects network + storage stages.</div>
      </div>
      <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;align-items:center;gap:6px"><span style="color:#fff;font-size:12px;font-weight:600">VM size tax</span><span style="background:rgba(64,96,208,0.12);color:#4060D0;font-size:9px;padding:1px 6px;border-radius:3px;font-family:'Geist Mono',monospace;font-weight:700">ADDITIVE</span></div>
        <div style="color:#808080;font-size:11.5px;line-height:1.45">8 GB VMs: +15% resource failure. 500 GB disk: +10% storage failure. Large workloads carry inherently higher risk.</div>
      </div>
      <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;align-items:center;gap:6px"><span style="color:#fff;font-size:12px;font-weight:600">Peak hours</span><span style="background:rgba(251,191,36,0.12);color:#fbbf24;font-size:9px;padding:1px 6px;border-radius:3px;font-family:'Geist Mono',monospace;font-weight:700">18:00 – 22:00</span></div>
        <div style="color:#808080;font-size:11.5px;line-height:1.45">Worse network quality, longer provision times (+10–25 s). Simulates real-world congestion during business-critical windows.</div>
      </div>
    </div>
    <div class="insight" style="margin-top:auto">A large VM on a degraded host during peak hours can see <strong>25%+ combined failure probability</strong> — each factor stacks.</div>
  </div>
</div>

---
layout: default
---


# Generation Error Reference

<p style="color:#a8a8a8;font-size:13px;margin:-8px 0 14px">Every error the generator can produce, in <strong style="color:#fff">pipeline order</strong>. The progress column shows how far the provision bar got before it stopped.</p>

<table>
  <thead><tr><th>Error type</th><th>Stage</th><th>Cause</th><th>Deterministic?</th><th>Progress</th></tr></thead>
  <tbody>
    <tr><td><code>POWER_FAILURE</code></td><td style="color:#fbbf24">Pre-provision</td><td>Host is powered off</td><td style="color:#4ade80">✅ Yes</td><td><code>0–10%</code></td></tr>
    <tr><td><code>RESOURCE_FAILURE</code></td><td style="color:#fbbf24">Pre-provision</td><td>Can't allocate CPU / RAM</td><td style="color:#a8a8a8">❌ Probabilistic</td><td><code>10–25%</code></td></tr>
    <tr><td><code>IP_FAILURE</code></td><td style="color:#fbbf24">Pre-provision</td><td>Zone IP pool exhausted</td><td style="color:#4ade80">✅ Yes (once pool = 0)</td><td><code>35–55%</code></td></tr>
    <tr><td><code>NETWORK_FAILURE</code></td><td style="color:#4060D0">Mid-provision</td><td>Network quality below threshold</td><td style="color:#a8a8a8">❌ Probabilistic</td><td><code>50–75%</code></td></tr>
    <tr><td><code>STORAGE_FAILURE</code></td><td style="color:#4060D0">Mid-provision</td><td>Disk attach failed</td><td style="color:#a8a8a8">❌ Probabilistic</td><td><code>70–95%</code></td></tr>
    <tr><td><code>HOST_FAILURE</code></td><td style="color:#f87171">Post-provision</td><td>Host crash cascade (bulk pass)</td><td style="color:#4ade80">✅ Yes</td><td><code>60–95%</code></td></tr>
    <tr><td><code>HARDWARE_FAILURE</code></td><td style="color:#808080">Host-level only</td><td>Host failed to provision</td><td style="color:#a8a8a8">❌ Probabilistic</td><td><code>20–80%</code></td></tr>
  </tbody>
</table>

<div class="insight" style="margin-top:auto"><code>HARDWARE_FAILURE</code> is the only error assigned to <strong>hosts</strong>, not VMs. All others are VM-level — <code>HOST_FAILURE</code> being the exception where the cascade pass overwrites individual VM errors in bulk.</div>

---
layout: default
---


<div style="display:flex;flex-direction:column;gap:14px;height:100%">

  <div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px">
    <h1 style="margin:0">Research Foundation</h1>
    <a href="http://queensu.scholaris.ca/server/api/core/bitstreams/b7cda482-3b00-4eb5-bdd8-f8d8d6c696f6/content" target="_blank" style="flex-shrink:0;display:inline-flex;align-items:center;gap:5px;background:rgba(64,96,208,0.10);border:1px solid rgba(64,96,208,0.28);border-radius:5px;padding:4px 11px;font-family:'Geist Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#4060D0;text-decoration:none">View Paper ↗</a>
  </div>

  <div style="background:#202020;border:1px solid rgba(255,255,255,0.09);border-left:3px solid #4060D0;border-radius:8px;padding:14px 18px;display:flex;flex-direction:column;gap:7px">
    <div style="font-style:italic;color:#f0f0f0;font-size:13.5px;font-weight:500;line-height:1.4">"Towards Reliability Evaluation and Integration in Cloud Resource Management"</div>
    <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
      <span style="color:#a8a8a8;font-size:10.5px;font-family:'Geist Mono',monospace">A B M Bodrul Alam</span>
      <span style="color:#3a3a3a">·</span>
      <span style="color:#606060;font-size:10.5px;font-family:'Geist Mono',monospace">PhD Thesis</span>
      <span style="color:#3a3a3a">·</span>
      <span style="color:#606060;font-size:10.5px;font-family:'Geist Mono',monospace">School of Computing, Queen's University, Kingston ON</span>
      <span style="color:#3a3a3a">·</span>
      <span style="color:#606060;font-size:10.5px;font-family:'Geist Mono',monospace">August 2020</span>
    </div>
  </div>

  <div style="font-size:9.5px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:#444;font-family:'Geist Mono',monospace">Three techniques drawn from this work</div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px">
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">Term 6</div>
        <div style="font-size:9px;color:#3e3e3e;font-family:'Geist Mono',monospace">Fleet Deviation</div>
      </div>
      <div style="color:#fff;font-size:12.5px;font-weight:600;line-height:1.25">Fleet-relative grading</div>
      <div style="color:#777;font-size:11.5px;line-height:1.55">Alam introduces parameter α > 1 to ensure VMs are distributed across different servers rather than concentrated on one. His experiments show reliability at 67% when α = 1 — no distribution priority. Increasing α pushed it to 88%, proving that placement must be measured against peers, not just in isolation. Fleet deviation applies this directly: lagging zones are penalised relative to the fleet baseline, not just scored on their own numbers.</div>
      <div style="font-family:'Geist Mono',monospace;font-size:9px;color:#3e3e3e;border-top:1px solid rgba(255,255,255,0.06);padding-top:7px;margin-top:auto">Section 4.2, p.50–51 · Fig. 4.12–4.14, p.67–69</div>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">Term 5</div>
        <div style="font-size:9px;color:#3e3e3e;font-family:'Geist Mono',monospace">Capacity Reliability</div>
      </div>
      <div style="color:#fff;font-size:12.5px;font-weight:600;line-height:1.25">Nonlinear capacity score</div>
      <div style="color:#777;font-size:11.5px;line-height:1.55">Alam's capacity constraint [Eq. 4.12] proves reliability degrades when resource allocation approaches its ceiling, and his multiplicative formula [Eq. 4.2] means any saturated resource collapses the total score. The thesis establishes why the penalty should be sharp, not linear. Our score(u) = 1/(1+u²) gives that shape — a host at 50% scores 0.80, fully committed drops to 0.50, overcommit hits 0.31. CPU and memory weighted at 0.40 each; storage at 0.20 reflects decoupled SAN architecture.</div>
      <div style="font-family:'Geist Mono',monospace;font-size:9px;color:#3e3e3e;border-top:1px solid rgba(255,255,255,0.06);padding-top:7px;margin-top:auto">Eq. 4.2, p.47 · Eq. 4.12, p.55 · Section 4.1</div>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">Term 3</div>
        <div style="font-size:9px;color:#3e3e3e;font-family:'Geist Mono',monospace">Error Severity</div>
      </div>
      <div style="color:#fff;font-size:12.5px;font-weight:600;line-height:1.25">Weighted error taxonomy</div>
      <div style="color:#777;font-size:11.5px;line-height:1.55">Alam classifies cloud failures into distinct categories — hardware, software, network, overflow, timeout, resource allocation — and models each separately because their impacts are fundamentally different. The thesis states these failures "may occur individually, concurrently, or one can be the cause of one or more other failures." Our weights implement this: hardware and power sit at 1.0 — infrastructure-level, non-self-healing, cascade to dependent VMs. Resource failures sit at 0.3 — recoverable and non-cascading.</div>
      <div style="font-family:'Geist Mono',monospace;font-size:9px;color:#3e3e3e;border-top:1px solid rgba(255,255,255,0.06);padding-top:7px;margin-top:auto">Section 3.1.1, p.32–33 · Section 3.2, p.34–38 · Eq. 3.6</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:auto">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px 15px">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#484848;margin-bottom:6px">Designed from first principles</div>
      <div style="color:#666;font-size:12px;line-height:1.55">Success rate, stability, outlier detection — built from scratch against HPE's error classification and provisioning data. No prior art applied.</div>
    </div>
    <div class="insight" style="margin-top:0">
      Research provided <strong>three useful starting points</strong>. The derivation, tuning, and adaptation to provisioning data was our own work.
    </div>
  </div>

</div>

---
layout: default
---

<style>
  .wrap { display:flex; flex-direction:column; gap:14px; padding:1rem 0; font-family:var(--font-sans); }
  h1 { margin:0; font-size:22px; font-weight:500; color:var(--color-text-primary); }
  .sub { color:var(--color-text-secondary); font-size:13px; }
  .legend { display:flex; gap:16px; flex-wrap:wrap; }
  .leg-item { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--color-text-secondary); font-family:var(--font-mono); }
  .leg-dot { width:10px; height:10px; border-radius:2px; flex-shrink:0; }
</style>

<div class="wrap">
  <h2 class="sr-only">VPRI variable redundancy diagram — shows which dataset columns map to multiple formula components in Alam's model, causing double-counting and structural mismatch problems</h2>

  <h1>Why direct mapping broke down</h1>
  <p class="sub">Columns in the dataset mapped to multiple formula components simultaneously — the same variable doing two different jobs, or being forced into a role it was never designed for.</p>

  <div class="legend">
    <div class="leg-item"><div class="leg-dot" style="background:#EF9F27"></div>redundant — same column, multiple components</div>
    <div class="leg-item"><div class="leg-dot" style="background:#E24B4A"></div>structural mismatch — column type / schema doesn't fit</div>
    <div class="leg-item"><div class="leg-dot" style="background:#639922"></div>clean mapping</div>
    <div class="leg-item"><div class="leg-dot" style="background:#888780"></div>absent from dataset</div>
  </div>

<svg width="100%" viewBox="0 0 680 620" role="img">
  <title>VPRI redundancy diagram</title>
  <desc>Dataset columns on the left connect via lines to formula components on the right. Amber lines show columns used in multiple components. Red lines show structural mismatches. Green lines show clean mappings. Gray dashed lines show absent columns.</desc>
  <defs>
    <marker id="arr-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#639922" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>
    <marker id="arr-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#EF9F27" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>
    <marker id="arr-r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#E24B4A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>
    <marker id="arr-x" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#888780" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>
  </defs>

  <!-- ── COLUMN HEADER ── -->
  <text class="ts" x="112" y="22" text-anchor="middle" fill="#888780">Dataset columns</text>
  <!-- ── FORMULA HEADER ── -->
  <text class="ts" x="548" y="22" text-anchor="middle" fill="#888780">Formula components</text>

  <!-- ═══════ COLUMNS (left side) x=40..184, w=144 ═══════ -->

  <!-- status -->
  <g class="c-green"><rect x="40" y="36" width="144" height="36" rx="6" stroke-width="0.5"/><text class="th" x="112" y="54" text-anchor="middle" dominant-baseline="central">status</text></g>

  <!-- status_percent -->
  <g class="c-red"><rect x="40" y="86" width="144" height="36" rx="6" stroke-width="0.5"/><text class="th" x="112" y="104" text-anchor="middle" dominant-baseline="central">status_percent</text></g>

  <!-- provision_percent -->
  <g class="c-green"><rect x="40" y="136" width="144" height="36" rx="6" stroke-width="0.5"/><text class="th" x="112" y="154" text-anchor="middle" dominant-baseline="central">provision_percent</text></g>

  <!-- error_message -->
  <g class="c-green"><rect x="40" y="186" width="144" height="36" rx="6" stroke-width="0.5"/><text class="th" x="112" y="204" text-anchor="middle" dominant-baseline="central">error_message</text></g>

  <!-- provision_time -->
  <g class="c-amber"><rect x="40" y="236" width="144" height="36" rx="6" stroke-width="0.5"/><text class="th" x="112" y="254" text-anchor="middle" dominant-baseline="central">provision_time</text></g>

  <!-- status_eta -->
  <g class="c-gray"><rect x="40" y="286" width="144" height="36" rx="6" stroke-width="0.5" stroke-dasharray="4 3"/><text class="th" x="112" y="304" text-anchor="middle" dominant-baseline="central">status_eta</text></g>
  <text class="ts" x="40" y="332" fill="#888780">absent — derived from p95</text>

  <!-- max_memory -->
  <g class="c-amber"><rect x="40" y="346" width="144" height="36" rx="6" stroke-width="0.5"/><text class="th" x="112" y="364" text-anchor="middle" dominant-baseline="central">max_memory</text></g>

  <!-- max_cores -->
  <g class="c-amber"><rect x="40" y="396" width="144" height="36" rx="6" stroke-width="0.5"/><text class="th" x="112" y="414" text-anchor="middle" dominant-baseline="central">max_cores</text></g>

  <!-- max_storage -->
  <g class="c-amber"><rect x="40" y="446" width="144" height="36" rx="6" stroke-width="0.5"/><text class="th" x="112" y="464" text-anchor="middle" dominant-baseline="central">max_storage</text></g>

  <!-- power_state -->
  <g class="c-green"><rect x="40" y="496" width="144" height="36" rx="6" stroke-width="0.5"/><text class="th" x="112" y="514" text-anchor="middle" dominant-baseline="central">power_state</text></g>

  <!-- zone_id -->
  <g class="c-red"><rect x="40" y="546" width="144" height="36" rx="6" stroke-width="0.5"/><text class="th" x="112" y="564" text-anchor="middle" dominant-baseline="central">zone_id</text></g>

  <!-- ═══════ FORMULA COMPONENTS (right side) x=456..636, w=180 ═══════ -->

  <!-- R_OF -->
  <g class="c-red"><rect x="456" y="36" width="180" height="36" rx="6" stroke-width="0.5"/><text class="th" x="546" y="54" text-anchor="middle" dominant-baseline="central">R_OF — overflow</text></g>

  <!-- R_TF -->
  <g class="c-amber"><rect x="456" y="86" width="180" height="36" rx="6" stroke-width="0.5"/><text class="th" x="546" y="104" text-anchor="middle" dominant-baseline="central">R_TF — timeout</text></g>

  <!-- R_RAF -->
  <g class="c-green"><rect x="456" y="136" width="180" height="36" rx="6" stroke-width="0.5"/><text class="th" x="546" y="154" text-anchor="middle" dominant-baseline="central">R_RAF — allocation</text></g>

  <!-- R_HF -->
  <g class="c-amber"><rect x="456" y="236" width="180" height="36" rx="6" stroke-width="0.5"/><text class="th" x="546" y="254" text-anchor="middle" dominant-baseline="central">R_HF — hardware</text></g>

  <!-- R_SF -->
  <g class="c-green"><rect x="456" y="286" width="180" height="36" rx="6" stroke-width="0.5"/><text class="th" x="546" y="304" text-anchor="middle" dominant-baseline="central">R_SF — software</text></g>

  <!-- R_NF -->
  <g class="c-amber"><rect x="456" y="336" width="180" height="36" rx="6" stroke-width="0.5"/><text class="th" x="546" y="354" text-anchor="middle" dominant-baseline="central">R_NF — network</text></g>

  <!-- LatencyScore -->
  <g class="c-amber"><rect x="456" y="436" width="180" height="36" rx="6" stroke-width="0.5"/><text class="th" x="546" y="454" text-anchor="middle" dominant-baseline="central">LatencyScore</text></g>

  <!-- ResourceScore -->
  <g class="c-amber"><rect x="456" y="486" width="180" height="36" rx="6" stroke-width="0.5"/><text class="th" x="546" y="504" text-anchor="middle" dominant-baseline="central">ResourceScore</text></g>

  <!-- ZoneBonus -->
  <g class="c-red"><rect x="456" y="536" width="180" height="36" rx="6" stroke-width="0.5"/><text class="th" x="546" y="554" text-anchor="middle" dominant-baseline="central">ZoneBonus (α)</text></g>

  <!-- ═══════ CONNECTORS ═══════ -->

  <!-- status → R_SF (clean green) -->
  <path d="M184 54 L240 54 L240 304 L456 304" fill="none" stroke="#639922" stroke-width="1.2" marker-end="url(#arr-g)"/>

  <!-- status_percent → R_OF (red — text type forced into overflow proxy) -->
  <path d="M184 104 L456 54" fill="none" stroke="#E24B4A" stroke-width="1.2" marker-end="url(#arr-r)"/>

  <!-- provision_percent → R_RAF (clean green) -->
  <path d="M184 154 L456 154" fill="none" stroke="#639922" stroke-width="1.2" marker-end="url(#arr-g)"/>

  <!-- error_message → R_SF (clean green) -->
  <path d="M184 204 L240 204 L240 316 L456 316" fill="none" stroke="#639922" stroke-width="1.2" marker-end="url(#arr-g)"/>

  <!-- provision_time → R_TF (amber — redundant) -->
  <path d="M184 254 L320 254 L320 104 L456 104" fill="none" stroke="#EF9F27" stroke-width="1.5" marker-end="url(#arr-a)"/>

  <!-- provision_time → LatencyScore (amber — same column, second penalty for same thing) -->
  <path d="M184 258 L320 258 L320 454 L456 454" fill="none" stroke="#EF9F27" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#arr-a)"/>

  <!-- status_eta → R_TF (gray dashed — absent) -->
  <path d="M184 304 L350 304 L350 116 L456 116" fill="none" stroke="#888780" stroke-width="1" stroke-dasharray="4 3" marker-end="url(#arr-x)"/>

  <!-- status_eta → LatencyScore (gray dashed — absent) -->
  <path d="M184 308 L356 308 L356 464 L456 464" fill="none" stroke="#888780" stroke-width="1" stroke-dasharray="4 3" marker-end="url(#arr-x)"/>

  <!-- max_memory → R_HF (amber — bigint not a ratio) -->
  <path d="M184 364 L330 364 L330 254 L456 254" fill="none" stroke="#EF9F27" stroke-width="1.5" marker-end="url(#arr-a)"/>

  <!-- max_memory → ResourceScore (amber — same column, second use) -->
  <path d="M184 368 L334 368 L334 504 L456 504" fill="none" stroke="#EF9F27" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#arr-a)"/>

  <!-- max_cores → R_HF (amber) -->
  <path d="M184 414 L336 414 L336 264 L456 264" fill="none" stroke="#EF9F27" stroke-width="1.5" marker-end="url(#arr-a)"/>

  <!-- max_cores → ResourceScore (amber dashed — redundant) -->
  <path d="M184 418 L340 418 L340 514 L456 514" fill="none" stroke="#EF9F27" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#arr-a)"/>

  <!-- max_storage → R_NF (amber — bigint not a ratio) -->
  <path d="M184 464 L360 464 L360 354 L456 354" fill="none" stroke="#EF9F27" stroke-width="1.5" marker-end="url(#arr-a)"/>

  <!-- max_storage → ResourceScore (amber dashed — redundant) -->
  <path d="M184 468 L364 468 L364 524 L456 524" fill="none" stroke="#EF9F27" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#arr-a)"/>

  <!-- power_state → R_HF (clean green) -->
  <path d="M184 514 L420 514 L420 262 L456 262" fill="none" stroke="#639922" stroke-width="1.2" marker-end="url(#arr-g)"/>

  <!-- zone_id → ZoneBonus (red — single int, can't derive alpha across VMs) -->
  <path d="M184 564 L456 554" fill="none" stroke="#E24B4A" stroke-width="1.2" marker-end="url(#arr-r)"/>

  <!-- ── CALLOUT LABELS on key redundancy points ── -->
  <!-- provision_time dual-use callout -->
  <rect x="228" y="382" width="124" height="40" rx="4" fill="none" stroke="#EF9F27" stroke-width="0.5" stroke-dasharray="3 2"/>
  <text class="ts" x="290" y="397" text-anchor="middle" fill="#BA7517">double penalty</text>
  <text class="ts" x="290" y="412" text-anchor="middle" fill="#BA7517">same column</text>

  <!-- resource triple-use callout -->
  <rect x="228" y="476" width="124" height="40" rx="4" fill="none" stroke="#EF9F27" stroke-width="0.5" stroke-dasharray="3 2"/>
  <text class="ts" x="290" y="491" text-anchor="middle" fill="#BA7517">raw bytes — not</text>
  <text class="ts" x="290" y="506" text-anchor="middle" fill="#BA7517">a utilisation ratio</text>

  <!-- zone_id callout -->
  <rect x="228" y="552" width="130" height="28" rx="4" fill="none" stroke="#E24B4A" stroke-width="0.5" stroke-dasharray="3 2"/>
  <text class="ts" x="293" y="570" text-anchor="middle" fill="#A32D2D">needs multi-VM context</text>

  <!-- status_percent callout -->
  <rect x="228" y="64" width="124" height="28" rx="4" fill="none" stroke="#E24B4A" stroke-width="0.5" stroke-dasharray="3 2"/>
  <text class="ts" x="290" y="82" text-anchor="middle" fill="#A32D2D">text — not N_req</text>

  <!-- stage labels -->
  <text class="ts" x="546" y="198" text-anchor="middle" fill="#888780">── Stage 1: RPR ──</text>
  <text class="ts" x="546" y="418" text-anchor="middle" fill="#888780">── Stage 2: ER ──</text>

</svg>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:4px">
    <div style="background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:8px;padding:10px 12px">
      <div style="font-size:9px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;font-family:var(--font-mono);color:var(--color-text-warning);margin-bottom:5px">Double penalty</div>
      <div style="font-size:11.5px;color:var(--color-text-secondary);line-height:1.5">provision_time fed both R_TF and LatencyScore — the same overrun penalised twice in the same formula.</div>
    </div>
    <div style="background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:8px;padding:10px 12px">
      <div style="font-size:9px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;font-family:var(--font-mono);color:var(--color-text-warning);margin-bottom:5px">Triple use</div>
      <div style="font-size:11.5px;color:var(--color-text-secondary);line-height:1.5">max_memory, max_cores, max_storage each appeared in two components — R_HF and ResourceScore — as raw bytes instead of normalised ratios.</div>
    </div>
    <div style="background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:8px;padding:10px 12px">
      <div style="font-size:9px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;font-family:var(--font-mono);color:var(--color-text-danger);margin-bottom:5px">Schema mismatch</div>
      <div style="font-size:11.5px;color:var(--color-text-secondary);line-height:1.5">status_percent is text, not N_req. zone_id is a single integer per row — Alam's α needs a set of VMs across one request. status_eta doesn't exist.</div>
    </div>
  </div>
</div>

---
layout: default
---

<div style="display:flex;flex-direction:column;gap:14px;height:100%">

  <div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px">
    <h1 style="margin:0">Our Contributions</h1>
    <div style="font-size:9.5px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">Built from scratch · HPE provisioning data</div>
  </div>

  <div style="background:#202020;border:1px solid rgba(255,255,255,0.09);border-left:3px solid #4060D0;border-radius:8px;padding:14px 18px">
    <div style="color:#a8a8a8;font-size:11.5px;line-height:1.6">The research paper provided three starting points. Everything below was designed independently — no prior art applied. Each decision was made against HPE's error classification, provisioning data, and operational requirements.</div>
  </div>

  <div style="font-size:9.5px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:#444;font-family:'Geist Mono',monospace">Six original design decisions</div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px;flex:1">
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;   padding:14px 15px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">01</div>
        <div style="font-size:9px;color:#3e3e3e;font-family:'Geist Mono',monospace">Formula structure</div>
      </div>
      <div style="color:#fff;font-size:12.5px;font-weight:600;line-height:1.25">Deduction from 100</div>
      <div style="color:#777;font-size:11.5px;line-height:1.55">Starts at 100, loses points for named reasons. A perfect pool costs nothing to explain — it just stayed at 100. Every point lost has a label: success loss, stability loss, error loss. An operator can read the breakdown without understanding the formula.</div>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">02</div>
        <div style="font-size:9px;color:#3e3e3e;font-family:'Geist Mono',monospace">Term 1</div>
      </div>
      <div style="color:#fff;font-size:12.5px;font-weight:600;line-height:1.25">Success rate at 0.80</div>
      <div style="color:#777;font-size:11.5px;line-height:1.55">4× the weight of every other term. One failed provision is always the loudest signal regardless of how consistent timing is. A pool cannot score above 20 if nothing is provisioning. The weight reflects a deliberate priority: fix failures first, optimise everything else second.</div>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">03</div>
        <div style="font-size:9px;color:#3e3e3e;font-family:'Geist Mono',monospace">Term 2</div>
      </div>
      <div style="color:#fff;font-size:12.5px;font-weight:600;line-height:1.25">Stability via CV</div>
      <div style="color:#777;font-size:11.5px;line-height:1.55">Timing variance as a reliability signal, not just a performance metric. A pool at 100% success rate with wildly inconsistent provision times is showing an early warning sign. CV is relative — a 30s deviation means something different in a 60s pool vs a 600s pool. Raw stddev would not catch this.</div>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">04</div>
        <div style="font-size:9px;color:#3e3e3e;font-family:'Geist Mono',monospace">Term 4</div>
      </div>
      <div style="color:#fff;font-size:12.5px;font-weight:600;line-height:1.25">Resource-aware outlier detection</div>
      <div style="color:#777;font-size:11.5px;line-height:1.55">Standard Tukey uses k = 1.5 for every VM. A 256GB VM legitimately takes longer than a 4GB VM — a fixed fence creates false positives. k_i scales proportionally to VM size: k_i = clamp(1.5 + α × (vm.size / med.size − 1), 0.5, 4.0). Only genuine stragglers relative to their size-peer group are penalised.</div>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">05</div>
        <div style="font-size:9px;color:#3e3e3e;font-family:'Geist Mono',monospace">Cascade deduplication</div>
      </div>
      <div style="color:#fff;font-size:12.5px;font-weight:600;line-height:1.25">One ESX failure = one incident</div>
      <div style="color:#777;font-size:11.5px;line-height:1.55">When an ESX host fails, all its VMs fail too. Without dedup, one host outage in a 40-VM pool counts as 41 failures and destroys the score. We attribute the failure to the host only — cascaded VMs are surfaced separately in the UI but do not subtract from PRI. The score stays meaningful.</div>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">06</div>
        <div style="font-size:9px;color:#3e3e3e;font-family:'Geist Mono',monospace">Colour system</div>
      </div>
      <div style="color:#fff;font-size:12.5px;font-weight:600;line-height:1.25">Green / amber / red orthogonal to PRI</div>
      <div style="color:#777;font-size:11.5px;line-height:1.55">Two zones with PRI 82 can be green and red. The colour catches what the number hides — a pool where 65% of errors are critical hardware failures is red regardless of score. Three inputs: PRI value, critical error ratio, ESX fail share. All thresholds configurable live without a code change.</div>
    </div>

  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:auto">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px 15px">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#484848;margin-bottom:6px">Weights are configurable</div>
      <div style="color:#666;font-size:12px;line-height:1.55">Every weight, threshold, and error severity value is tunable live via the settings panel. No code change needed to adjust operational priority.</div>
    </div>
    <div class="insight" style="margin-top:0">
      The paper told us <strong>why</strong> certain things matter. These six decisions defined <strong>how</strong> to measure them against real infrastructure data.
    </div>
  </div>

</div>

---
layout: default
---


# PRI Formula

<p style="color:#a8a8a8;font-size:13px;margin:-8px 0 14px">Starts at 100. Each term subtracts proportionally. Clamped to [0, 100].</p>

<div style="background:#282828;border:1px solid rgba(255,255,255,0.09);border-left:3px solid #4060D0;border-radius:8px;padding:18px 28px 16px;font-family:'Geist Mono',monospace;font-size:14.5px;line-height:2.55">
  <div>
    <span style="color:#a8a8a8">rawPRI</span><span style="color:#808080"> = </span><span style="color:#d4d4d4">100</span>
  </div>
  <div>
    <span style="color:#808080">       − </span><span style="color:#d4d4d4">(100 − </span><span style="color:#4060D0;font-weight:600">successRate</span><span style="color:#d4d4d4">)</span><span style="color:#808080">   ×</span><span style="color:#fff;font-weight:700"> 0.80</span><span style="color:#444;padding-left:16px;font-size:12px">← success loss</span>
  </div>
  <div>
    <span style="color:#808080">       − </span><span style="color:#d4d4d4">(100 − </span><span style="color:#4060D0;font-weight:600">stabilityScore</span><span style="color:#d4d4d4">)</span><span style="color:#808080"> ×</span><span style="color:#fff;font-weight:700"> 0.20</span><span style="color:#444;padding-left:16px;font-size:12px">← stability loss</span>
  </div>
  <div>
    <span style="color:#808080">       − </span><span style="color:#4060D0;font-weight:600">errorPenalty</span><span style="color:#808080">            ×</span><span style="color:#fff;font-weight:700"> 0.10</span><span style="color:#444;padding-left:16px;font-size:12px">← error severity loss</span>
  </div>
  <div>
    <span style="color:#808080">       − </span><span style="color:#4060D0;font-weight:600">outlierPenalty</span><span style="color:#808080">          ×</span><span style="color:#fff;font-weight:700"> 0.05</span><span style="color:#444;padding-left:16px;font-size:12px">← outlier loss</span>
  </div>
  <div>
    <span style="color:#808080">       − </span><span style="color:#d4d4d4">(1 − </span><span style="color:#4060D0;font-weight:600">CR</span><span style="color:#d4d4d4">)</span><span style="color:#808080"> × </span><span style="color:#4060D0;font-weight:600">crWeight</span><span style="color:#808080"> ×</span><span style="color:#d4d4d4"> 100</span><span style="color:#444;padding-left:16px;font-size:12px">← capacity reliability loss</span>
  </div>
  <div style="margin-top:6px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.07)">
    <span style="color:#a8a8a8">PRI</span><span style="color:#808080"> = clamp(</span><span style="color:#a8a8a8">rawPRI</span><span style="color:#808080"> − </span><span style="color:#4060D0;font-weight:600">fleetDeviationLoss</span><span style="color:#808080">, 0, 100)</span><span style="color:#444;padding-left:16px;font-size:12px">← post-hoc fleet penalty</span>
  </div>
</div>

<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-top:14px">
  <div style="background:#1f1f1f;border:1px solid rgba(255,255,255,0.08);border-top:2px solid #4060D0;border-radius:8px;padding:11px 10px;text-align:center">
    <div style="color:#4060D0;font-size:20px;font-weight:700;font-family:'Geist Mono',monospace;line-height:1">0.80</div>
    <div style="color:#fff;font-size:11px;font-weight:600;margin-top:5px;letter-spacing:0.02em">Success Rate</div>
    <div style="color:#808080;font-size:10px;margin-top:3px">Primary signal</div>
  </div>
  <div style="background:#1f1f1f;border:1px solid rgba(255,255,255,0.08);border-top:2px solid #4060D0;border-radius:8px;padding:11px 10px;text-align:center">
    <div style="color:#4060D0;font-size:20px;font-weight:700;font-family:'Geist Mono',monospace;line-height:1">0.20</div>
    <div style="color:#fff;font-size:11px;font-weight:600;margin-top:5px;letter-spacing:0.02em">Stability</div>
    <div style="color:#808080;font-size:10px;margin-top:3px">Timing variance</div>
  </div>
  <div style="background:#1f1f1f;border:1px solid rgba(255,255,255,0.08);border-top:2px solid #4060D0;border-radius:8px;padding:11px 10px;text-align:center">
    <div style="color:#4060D0;font-size:20px;font-weight:700;font-family:'Geist Mono',monospace;line-height:1">0.10</div>
    <div style="color:#fff;font-size:11px;font-weight:600;margin-top:5px;letter-spacing:0.02em">Error Severity</div>
    <div style="color:#808080;font-size:10px;margin-top:3px">Criticality amplifier</div>
  </div>
  <div style="background:#1f1f1f;border:1px solid rgba(255,255,255,0.08);border-top:2px solid #4060D0;border-radius:8px;padding:11px 10px;text-align:center">
    <div style="color:#4060D0;font-size:20px;font-weight:700;font-family:'Geist Mono',monospace;line-height:1">0.05</div>
    <div style="color:#fff;font-size:11px;font-weight:600;margin-top:5px;letter-spacing:0.02em">Outliers</div>
    <div style="color:#808080;font-size:10px;margin-top:3px">Long-tail provisions</div>
  </div>
  <div style="background:#1f1f1f;border:1px solid rgba(255,255,255,0.08);border-top:2px solid #4060D0;border-radius:8px;padding:11px 10px;text-align:center">
    <div style="color:#4060D0;font-size:20px;font-weight:700;font-family:'Geist Mono',monospace;line-height:1">0.15</div>
    <div style="color:#fff;font-size:11px;font-weight:600;margin-top:5px;letter-spacing:0.02em">Capacity (CR)</div>
    <div style="color:#808080;font-size:10px;margin-top:3px">Predictive overcommit</div>
  </div>
  <div style="background:#1f1f1f;border:1px solid rgba(255,255,255,0.08);border-top:2px solid #4060D0;border-radius:8px;padding:11px 10px;text-align:center">
    <div style="color:#4060D0;font-size:20px;font-weight:700;font-family:'Geist Mono',monospace;line-height:1">0.05</div>
    <div style="color:#fff;font-size:11px;font-weight:600;margin-top:5px;letter-spacing:0.02em">Fleet Deviation</div>
    <div style="color:#808080;font-size:10px;margin-top:3px">Post-hoc relative</div>
  </div>
</div>

---
layout: default
---

# Term 1: Success Rate

<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;margin-top:4px">
  <div style="padding-right:28px;border-right:1px solid rgba(255,255,255,0.09);display:flex;flex-direction:column;gap:12px">
    <div style="display:inline-flex;align-items:center;gap:8px">
      <span style="background:rgba(64,96,208,0.12);border:1px solid rgba(64,96,208,0.3);border-radius:4px;padding:2px 9px;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:#4060D0">weight: 0.80</span>
      <span style="color:#606060;font-size:12px">Primary signal — highest weight of all terms</span>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #4060D0;border-radius:8px;padding:12px 16px;font-family:'Geist Mono',monospace;font-size:12.5px;line-height:2.2;color:#d4d4d4">
      <div>successRate = (successful / total) × 100</div>
      <div>loss = (100 − successRate) × <span style="color:#fff;font-weight:700">0.80</span></div>
    </div>
    <div style="background:#1e1e1e;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:6px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Cascade Dedup</div>
      <div style="color:#a8a8a8;font-size:12.5px;line-height:1.55">When an ESX host fails, all its VMs fail too. Without dedup, 1 host outage = <code>1 + N</code> penalties. Rely blames only the host — VMs are dropped from the calculation and surfaced separately.</div>
    </div>
    <div class="insight" style="margin-top:auto">Dropped VMs still appear in the UI as <strong>cascaded failures</strong> — visible, not penalized.</div>
  </div>
  <div style="padding-left:28px;display:flex;flex-direction:column;gap:12px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Cascade dedup — before vs after</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div style="background:#1f0f0e;border:1px solid rgba(248,113,113,0.18);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:6px">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#f87171;font-family:'Geist Mono',monospace">Without dedup</div>
        <div style="color:#a8a8a8;font-size:12px;line-height:1.5">ESX host fails.<br/>40 VMs go down.<br/><strong style="color:#f87171">41 failures</strong> counted against success rate.</div>
      </div>
      <div style="background:#0e1f12;border:1px solid rgba(74,222,128,0.18);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:6px">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4ade80;font-family:'Geist Mono',monospace">With dedup</div>
        <div style="color:#a8a8a8;font-size:12px;line-height:1.5">ESX host fails.<br/>40 VMs surfaced separately.<br/><strong style="color:#4ade80">1 failure</strong> penalizes the score.</div>
      </div>
    </div>
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace;margin-top:4px">Success rate impact on PRI</div>
    <table>
      <thead><tr><th>Success Rate</th><th>Loss (× 0.80)</th><th>PRI contribution</th></tr></thead>
      <tbody>
        <tr><td>100%</td><td>0</td><td style="color:#4ade80">−0 pts</td></tr>
        <tr><td>95%</td><td>5 × 0.80</td><td style="color:#4ade80">−4 pts</td></tr>
        <tr><td>80%</td><td>20 × 0.80</td><td style="color:#fbbf24">−16 pts</td></tr>
        <tr><td>60%</td><td>40 × 0.80</td><td style="color:#f87171">−32 pts</td></tr>
      </tbody>
    </table>
    <div class="insight" style="margin-top:auto">Success rate is <strong>4× the weight</strong> of stability — one failure is always the loudest signal.</div>
  </div>
</div>

---
layout: default
---

# Term 2: Stability

<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;margin-top:4px">
  <div style="padding-right:28px;border-right:1px solid rgba(255,255,255,0.09);display:flex;flex-direction:column;gap:12px">
    <div style="display:inline-flex;align-items:center;gap:8px">
      <span style="background:rgba(64,96,208,0.12);border:1px solid rgba(64,96,208,0.3);border-radius:4px;padding:2px 9px;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:#4060D0">weight: 0.20</span>
      <span style="color:#606060;font-size:12px">Timing consistency — are provisions predictable?</span>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #4060D0;border-radius:8px;padding:12px 16px;font-family:'Geist Mono',monospace;font-size:12.5px;line-height:2.2;color:#d4d4d4">
      <div>CV = stddev / mean × 100</div>
      <div>stabilityScore = clamp(100 − CV, 0, 100)</div>
      <div>loss = (100 − stabilityScore) × <span style="color:#fff;font-weight:700">0.20</span></div>
    </div>
    <div style="background:#1e1e1e;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:6px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">What CV means</div>
      <div style="color:#a8a8a8;font-size:12.5px;line-height:1.55">CV = how spread out provision times are, relative to the average. A fleet finishing in 60–70 s consistently has low CV → high stability. High variance even at 100% success still signals something worth investigating.</div>
    </div>
    <div class="insight" style="margin-top:auto">A 100%-success fleet with tight timing loses <strong>zero</strong> stability points.</div>
  </div>
  <div style="padding-left:28px;display:flex;flex-direction:column;gap:12px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Stability vs. Outliers — two different signals</div>
    <table>
      <thead><tr><th>Scenario</th><th>Stability</th><th>Outliers</th></tr></thead>
      <tbody>
        <tr><td>All provisions 60–120 s, evenly spread</td><td style="color:#fbbf24">Low</td><td style="color:#4ade80">Zero</td></tr>
        <tr><td>All ≈60 s, 3 servers at 600 s</td><td style="color:#4ade80">High</td><td style="color:#f87171">Non-zero</td></tr>
        <tr><td>All identical time</td><td style="color:#4ade80">100</td><td style="color:#4ade80">Zero</td></tr>
      </tbody>
    </table>
    <div class="insight" style="margin-top:auto">Stability = <strong>overall spread</strong>. Outliers = <strong>extreme stragglers</strong>. A fleet can score well on one and badly on the other.</div>
  </div>
</div>

---
layout: default
---

# Term 3: Error Severity

<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;margin-top:4px">
  <div style="padding-right:28px;border-right:1px solid rgba(255,255,255,0.09);display:flex;flex-direction:column;gap:12px">
    <div style="display:inline-flex;align-items:center;gap:8px">
      <span style="background:rgba(64,96,208,0.12);border:1px solid rgba(64,96,208,0.3);border-radius:4px;padding:2px 9px;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:#4060D0">weight: 0.10</span>
      <span style="color:#606060;font-size:12px">Not all failures are equal</span>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #4060D0;border-radius:8px;padding:12px 16px;font-family:'Geist Mono',monospace;font-size:12.5px;line-height:2.2;color:#d4d4d4">
      <div>weightedCount = Σ(count[type] × weight[type])</div>
      <div>errorPenalty = min(100, weightedCount / total × 100)</div>
      <div>loss = errorPenalty × <span style="color:#fff;font-weight:700">0.10</span></div>
    </div>
    <div style="background:#1e1e1e;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px 14px;color:#a8a8a8;font-size:12.5px;line-height:1.55">
      Two zones with the same failure count can have different PRI loss if their error types differ. Hardware failures hurt far more than IP conflicts.
    </div>
    <div class="insight" style="margin-top:auto">Error weights are <strong>tunable live</strong> in Settings — adjust per environment priority.</div>
  </div>
  <div style="padding-left:28px;display:flex;flex-direction:column;gap:12px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Error type weights</div>
    <table>
      <thead><tr><th>Error type</th><th>Weight</th><th>Severity</th></tr></thead>
      <tbody>
        <tr><td><code>HARDWARE_FAILURE</code></td><td>1.0</td><td style="color:#f87171">critical</td></tr>
        <tr><td><code>POWER_FAILURE</code></td><td>1.0</td><td style="color:#f87171">critical</td></tr>
        <tr><td><code>STORAGE_FAILURE</code></td><td>0.9</td><td style="color:#f87171">critical</td></tr>
        <tr><td><code>HOST_FAILURE</code></td><td>0.9</td><td style="color:#f87171">critical</td></tr>
        <tr><td><code>NETWORK_FAILURE</code></td><td>0.7</td><td style="color:#fbbf24">high</td></tr>
        <tr><td><code>IP_FAILURE</code></td><td>0.5</td><td style="color:#a8a8a8">medium</td></tr>
        <tr><td><code>RESOURCE_FAILURE</code></td><td>0.3</td><td style="color:#a8a8a8">low</td></tr>
      </tbody>
    </table>
    <div class="insight" style="margin-top:auto">Errors with weight ≥ 0.9 can also trigger a <strong>red color override</strong> — even if PRI is moderate.</div>
  </div>
</div>

---
layout: default
---


# Term 4: Outlier Detection

<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;margin-top:4px">
  <div style="padding-right:28px;border-right:1px solid rgba(255,255,255,0.09);display:flex;flex-direction:column;gap:12px">
    <div style="display:inline-flex;align-items:center;gap:8px">
      <span style="background:rgba(64,96,208,0.12);border:1px solid rgba(64,96,208,0.3);border-radius:4px;padding:2px 9px;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:#4060D0">weight: 0.05</span>
      <span style="color:#606060;font-size:12px">Dynamic Tukey fence, resource-aware</span>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #4060D0;border-radius:8px;padding:12px 16px;font-family:'Geist Mono',monospace;font-size:11.5px;line-height:2.1;color:#d4d4d4">
      <div>k_i = clamp(1.5 + α × (vm.size / med.size − 1), 0.5, 4.0)</div>
      <div>fence_i = Q3 + k_i × IQR</div>
      <div>outlierPenalty = count(time > fence_i) / total × 100</div>
    </div>
    <div style="background:#1e1e1e;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:6px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Why resource-aware?</div>
      <div style="color:#a8a8a8;font-size:12.5px;line-height:1.55">Standard Tukey uses k = 1.5 for every VM. But a large VM with 256 GB RAM legitimately takes longer than a 4 GB VM. Fixed fences create false positives. <code>k_i</code> widens the fence proportionally to VM size.</div>
    </div>
    <div class="insight" style="margin-top:auto">Defaults: <strong>α_mem = 0.3, α_cpu = 0.3, α_stor = 0.2</strong> — all tunable in Settings.</div>
  </div>
  <div style="padding-left:28px;display:flex;flex-direction:column;gap:12px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">How k_i varies by VM size</div>
    <table>
      <thead><tr><th>VM profile</th><th>k_i</th><th>Effect</th></tr></thead>
      <tbody>
        <tr><td>Tiny (1 vCPU, 4 GB)</td><td style="color:#4ade80">1.50</td><td>Baseline fence</td></tr>
        <tr><td>Medium (8 vCPU, 32 GB)</td><td style="color:#fbbf24">2.10</td><td>Wider — bigger VM</td></tr>
        <tr><td>Large (32 vCPU, 128 GB)</td><td style="color:#f87171">3.20</td><td>Much wider fence</td></tr>
        <tr><td>Any VM (identical fleet)</td><td>1.50</td><td>All same → no adjustment</td></tr>
      </tbody>
    </table>
    <div style="background:#1e1e1e;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;margin-top:4px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">What counts as an outlier?</div>
      <div style="color:#a8a8a8;font-size:12px;line-height:1.55">Any VM whose provision time exceeds its personal upper fence. A slow-but-consistent fleet scores zero here. Only genuine stragglers relative to their size-peer group are penalized.</div>
    </div>
    <div class="insight" style="margin-top:auto">No absolute time threshold — the <strong>fleet's own distribution</strong> is the reference. Consistent = clean.</div>
  </div>
</div>

---
layout: default
---

# Term 5: Capacity Reliability

<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;margin-top:4px">
  <div style="padding-right:28px;border-right:1px solid rgba(255,255,255,0.09);display:flex;flex-direction:column;gap:12px">
    <div style="display:inline-flex;align-items:center;gap:8px">
      <span style="background:rgba(64,96,208,0.12);border:1px solid rgba(64,96,208,0.3);border-radius:4px;padding:2px 9px;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:#4060D0">weight: 0.15</span>
      <span style="color:#606060;font-size:12px">Only predictive term — fires before failures happen</span>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #4060D0;border-radius:8px;padding:12px 16px;font-family:'Geist Mono',monospace;font-size:12px;line-height:2.1;color:#d4d4d4">
      <div>u = Σ(vm.resource) / host.resource</div>
      <div>score(u) = 1 / (1 + u²)</div>
      <div>CR_host = 0.4×score(u_cpu) + 0.4×score(u_mem) + 0.2×score(u_stor)</div>
      <div>crLoss = (1 − CR) × <span style="color:#fff;font-weight:700">crWeight</span> × 100</div>
    </div>
    <div style="background:#1e1e1e;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px 14px;color:#a8a8a8;font-size:12.5px;line-height:1.55">
      <code>u</code> is utilization — can exceed 1.0 under hypervisor overcommit (e.g. 128 vCPUs on a 64-core host). Hosts with more VMs carry more influence in the zone aggregate.
    </div>
    <div class="insight" style="margin-top:auto">A zone at 90% utilization today is a <strong>future failure</strong>. CR catches this before it shows up in success rate.</div>
  </div>
  <div style="padding-left:28px;display:flex;flex-direction:column;gap:12px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Why nonlinear — score drops sharply at saturation</div>
    <table>
      <thead><tr><th>Utilization (u)</th><th>Score</th><th>State</th></tr></thead>
      <tbody>
        <tr><td>0.0</td><td style="color:#4ade80">1.00</td><td>Host empty</td></tr>
        <tr><td>0.5</td><td style="color:#4ade80">0.80</td><td>50% utilized</td></tr>
        <tr><td>1.0</td><td style="color:#fbbf24">0.50</td><td>Fully committed</td></tr>
        <tr><td>1.5</td><td style="color:#f87171">0.31</td><td>50% overcommit</td></tr>
        <tr><td>2.0</td><td style="color:#f87171">0.20</td><td>200% overcommit</td></tr>
      </tbody>
    </table>
    <div class="insight" style="margin-top:auto">CPU + Memory weighted at <strong>40% each</strong> — they cause immediate OOM / CPU steal. Storage at 20% — hypervisors typically use decoupled SANs.</div>
  </div>
</div>

---
layout: default
---


# Term 6: Fleet Deviation

<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;margin-top:4px">
  <div style="padding-right:28px;border-right:1px solid rgba(255,255,255,0.09);display:flex;flex-direction:column;gap:12px">
    <div style="display:inline-flex;align-items:center;gap:8px">
      <span style="background:rgba(64,96,208,0.12);border:1px solid rgba(64,96,208,0.3);border-radius:4px;padding:2px 9px;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:#4060D0">post-hoc</span>
      <span style="color:#606060;font-size:12px">One-sided relative penalty — laggards only</span>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #4060D0;border-radius:8px;padding:12px 16px;font-family:'Geist Mono',monospace;font-size:12px;line-height:2.1;color:#d4d4d4">
      <div>fleetPRI = aggregatePRI(all zones, no deviation)</div>
      <div>loss = max(0, fleetPRI − rawZonePRI) × impact</div>
      <div>PRI = clamp(rawZonePRI − loss, 0, 100)</div>
    </div>
    <div style="background:#1e1e1e;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Three design choices</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="color:#a8a8a8;font-size:12px;line-height:1.5"><span style="color:#fff;font-weight:600">One-sided</span> — zones above fleet baseline get zero deduction. Only laggards are penalized.</div>
        <div style="color:#a8a8a8;font-size:12px;line-height:1.5"><span style="color:#fff;font-weight:600">Post-hoc</span> — applied after 5-term PRI is computed. Avoids circular dependency.</div>
        <div style="color:#a8a8a8;font-size:12px;line-height:1.5"><span style="color:#fff;font-weight:600">Configurable</span> — default impact = 0.05. Set to 0 to disable cross-zone comparison entirely.</div>
      </div>
    </div>
    <div class="insight" style="margin-top:auto">Fleet PRI uses <strong>all servers across all zones</strong> as denominator — a single zone can't inflate the baseline.</div>
  </div>
  <div style="padding-left:28px;display:flex;flex-direction:column;gap:12px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#505050;font-family:'Geist Mono',monospace">Worked example — 4-zone fleet</div>
    <table>
      <thead><tr><th>Zone</th><th>Raw PRI</th><th>vs Fleet (88)</th><th>Final PRI</th></tr></thead>
      <tbody>
        <tr><td>Zone A</td><td>94</td><td style="color:#4ade80">+6 → no penalty</td><td style="color:#4ade80">94</td></tr>
        <tr><td>Zone B</td><td>88</td><td style="color:#4ade80">0 → no penalty</td><td style="color:#4ade80">88</td></tr>
        <tr><td>Zone C</td><td>74</td><td style="color:#fbbf24">−14 → −0.7</td><td style="color:#fbbf24">73.3</td></tr>
        <tr><td>Zone D</td><td>61</td><td style="color:#f87171">−27 → −1.35</td><td style="color:#f87171">59.7</td></tr>
      </tbody>
    </table>
    <div style="background:#1e1e1e;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:11px 14px;color:#a8a8a8;font-size:12px;line-height:1.55">
      Fleet PRI = 88. Impact = 0.05.<br/>Zones A and B are at or above baseline — untouched.<br/>Zones C and D lag the fleet — small nudge down.
    </div>
    <div class="insight" style="margin-top:auto">Loss is intentionally <strong>small</strong> — nudges ranking without masking absolute score.</div>
  </div>
</div>

---
layout: default
---


# Color System

<p style="color:#a8a8a8;font-size:13px;margin:-8px 0 16px">PRI is a number. Color is an operational signal. They are <strong style="color:#fff">orthogonal</strong> — a zone can be red with a high PRI, or amber with a low one.</p>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;flex:1">
  <div style="background:#0e1f12;border:1px solid rgba(74,222,128,0.2);border-top:2px solid #4ade80;border-radius:8px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:9px;height:9px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px rgba(74,222,128,0.7);flex-shrink:0"></div>
      <span style="color:#4ade80;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase">Green</span>
    </div>
    <div style="color:#a8a8a8;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:'Geist Mono',monospace">Requires ALL of</div>
    <div style="display:flex;flex-direction:column;gap:5px">
      <div style="background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.15);border-radius:5px;padding:5px 10px;font-family:'Geist Mono',monospace;font-size:11.5px;color:#d4d4d4">PRI ≥ 85</div>
      <div style="background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.15);border-radius:5px;padding:5px 10px;font-family:'Geist Mono',monospace;font-size:11.5px;color:#d4d4d4">criticalRatio &lt; 0.30</div>
      <div style="background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.15);border-radius:5px;padding:5px 10px;font-family:'Geist Mono',monospace;font-size:11.5px;color:#d4d4d4">esxFailShare &lt; 0.05</div>
    </div>
    <div style="margin-top:auto;padding-top:10px;border-top:1px solid rgba(74,222,128,0.1);color:#808080;font-size:12px;line-height:1.5">Pool meeting all expectations. No immediate action needed. Healthy provisioning throughput with no elevated severity or ESX risk.</div>
  </div>
  <div style="background:#1c1810;border:1px solid rgba(251,191,36,0.2);border-top:2px solid #fbbf24;border-radius:8px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:9px;height:9px;border-radius:50%;background:#fbbf24;box-shadow:0 0 8px rgba(251,191,36,0.7);flex-shrink:0"></div>
      <span style="color:#fbbf24;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase">Amber</span>
    </div>
    <div style="color:#a8a8a8;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:'Geist Mono',monospace">Everything else</div>
    <div style="display:flex;flex-direction:column;gap:5px">
      <div style="background:rgba(251,191,36,0.07);border:1px solid rgba(251,191,36,0.15);border-radius:5px;padding:5px 10px;font-family:'Geist Mono',monospace;font-size:11.5px;color:#d4d4d4">Not green, not red</div>
      <div style="background:rgba(251,191,36,0.07);border:1px solid rgba(251,191,36,0.15);border-radius:5px;padding:5px 10px;font-family:'Geist Mono',monospace;font-size:11.5px;color:#d4d4d4">PRI 70 – 84</div>
      <div style="background:rgba(251,191,36,0.07);border:1px solid rgba(251,191,36,0.15);border-radius:5px;padding:5px 10px;font-family:'Geist Mono',monospace;font-size:11.5px;color:#d4d4d4">criticalRatio 0.30 – 0.59</div>
    </div>
    <div style="margin-top:auto;padding-top:10px;border-top:1px solid rgba(251,191,36,0.1);color:#808080;font-size:12px;line-height:1.5">Degraded but not critical. Investigate trending failures or elevated severity before it escalates. Monitor closely.</div>
  </div>
  <div style="background:#1f0f0e;border:1px solid rgba(248,113,113,0.2);border-top:2px solid #f87171;border-radius:8px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:9px;height:9px;border-radius:50%;background:#f87171;box-shadow:0 0 8px rgba(248,113,113,0.7);flex-shrink:0"></div>
      <span style="color:#f87171;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase">Red</span>
    </div>
    <div style="color:#a8a8a8;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:'Geist Mono',monospace">Any ONE of</div>
    <div style="display:flex;flex-direction:column;gap:5px">
      <div style="background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.15);border-radius:5px;padding:5px 10px;font-family:'Geist Mono',monospace;font-size:11.5px;color:#d4d4d4">PRI &lt; 70</div>
      <div style="background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.15);border-radius:5px;padding:5px 10px;font-family:'Geist Mono',monospace;font-size:11.5px;color:#d4d4d4">criticalRatio ≥ 0.60</div>
      <div style="background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.15);border-radius:5px;padding:5px 10px;font-family:'Geist Mono',monospace;font-size:11.5px;color:#d4d4d4">esxFailShare ≥ 0.10</div>
    </div>
    <div style="margin-top:auto;padding-top:10px;border-top:1px solid rgba(248,113,113,0.1);color:#808080;font-size:12px;line-height:1.5">Immediate attention required. Provisioning failing at scale, critical errors dominate, or ESX infrastructure at risk.</div>
  </div>
</div>

---
layout: default
---


# Tech Stack

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:4px">
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:6px">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">Framework</div>
    <div style="color:#fff;font-size:13px;font-weight:600">Next.js 16</div>
    <div style="color:#606060;font-size:11.5px;line-height:1.5">App Router · TypeScript · Server-side API routes for all PRI calculations</div>
  </div>
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:6px">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">Database</div>
    <div style="color:#fff;font-size:13px;font-weight:600">MySQL + Drizzle ORM</div>
    <div style="color:#606060;font-size:11.5px;line-height:1.5">Type-safe schema · Provisioning events, zone topology, error logs</div>
  </div>
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:6px">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">Visualization</div>
    <div style="color:#fff;font-size:13px;font-weight:600">@xyflow/react</div>
    <div style="color:#606060;font-size:11.5px;line-height:1.5">Host mesh topology — zones, hosts, and VM relationships as a live node graph</div>
  </div>
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:6px">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">Charts</div>
    <div style="color:#fff;font-size:13px;font-weight:600">Recharts</div>
    <div style="color:#606060;font-size:11.5px;line-height:1.5">Error distributions · PRI time series · Capacity utilization breakdowns</div>
  </div>
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:6px">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">UI Components</div>
    <div style="color:#fff;font-size:13px;font-weight:600">shadcn/ui + Radix</div>
    <div style="color:#606060;font-size:11.5px;line-height:1.5">Accessible primitives · Consistent dark-theme design system throughout</div>
  </div>
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:6px">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">Config</div>
    <div style="color:#fff;font-size:13px;font-weight:600">localStorage</div>
    <div style="color:#606060;font-size:11.5px;line-height:1.5">Live-tunable weights · Serialized as a config blob into each API request — no separate config API</div>
  </div>
</div>

<div style="background:#1e1e1e;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 18px;margin-top:12px;display:flex;gap:24px;align-items:center">
  <div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#4060D0;font-family:'Geist Mono',monospace;white-space:nowrap">Architecture</div>
  <div style="color:#a8a8a8;font-size:12.5px;line-height:1.5">Every PRI calculation runs <strong style="color:#fff">server-side</strong> in API routes. Client receives pre-computed scores, breakdowns, and color classifications. Settings flow as a config blob in each request — no separate config API needed.</div>
</div>

---
layout: center
---

<div style="display:flex;flex-direction:column;align-items:center;gap:28px;text-align:center;position:relative">
  <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.25);border-radius:12px;padding:6px 18px;font-family:'Geist Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#4ade80">Live Demo</div>
  <div>
    <div style="font-size:48px;font-weight:700;letter-spacing:-0.03em;color:#fff;font-family:'Space Grotesk',sans-serif;line-height:1">Rel<span style="color:#4060D0">y</span>.</div>
    <div style="color:#a8a8a8;margin-top:12px;font-size:15px;font-family:'Space Grotesk',sans-serif;max-width:480px;line-height:1.6">Zone overview · Host mesh · PRI breakdown · Color classification · Settings panel</div>
    <a href="https://relyhpe.vercel.app" target="_blank" style="display:inline-block;margin-top:18px;font-family:'Geist Mono',monospace;font-size:13px;color:#4060D0;text-decoration:none;border-bottom:1px solid rgba(64,96,208,0.35);padding-bottom:2px;letter-spacing:0.02em">relyhpe.vercel.app ↗</a>
  </div>
</div>

---
layout: center
---

<div style="display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center;position:relative">
  <svg width="44" height="44" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:0.65">
    <path d="M14 2.33333V25.6667M22.2496 5.75042L5.7504 22.2496M25.6666 14H2.33331M22.2496 22.2496L5.7504 5.75042" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div>
    <div style="font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#4060D0;font-family:'Geist Mono',monospace;margin-bottom:12px">Thank You</div>
    <div style="font-size:42px;font-weight:700;letter-spacing:-0.03em;color:#fff;font-family:'Space Grotesk',sans-serif;line-height:1">Rel<span style="color:#4060D0">y</span>.</div>
    <div style="color:#a8a8a8;margin-top:10px;font-size:15px;font-family:'Space Grotesk',sans-serif">Built for infrastructure operators who need <strong style="color:#fff">clarity</strong>, not more dashboards.</div>
  </div>
  <div style="font-size:12px;color:#5e5e5e;font-family:'Geist Mono',monospace;margin-top:4px">
    PRI answers: "Is this pool meeting expectations?" &nbsp;·&nbsp; Color answers: "Should I be worried right now?"
  </div>
</div>

<div style="position:absolute;bottom:28px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:32px;font-family:'Geist Mono',monospace">
  <div style="text-align:center">
    <div style="font-size:8.5px;letter-spacing:0.10em;text-transform:uppercase;color:#505050;margin-bottom:5px">Contributors</div>
    <div style="font-size:10px;color:#707070;letter-spacing:0.02em">Akhil&nbsp;&nbsp;·&nbsp;&nbsp;Harsh Iyer&nbsp;&nbsp;·&nbsp;&nbsp;Kartik Balani&nbsp;&nbsp;·&nbsp;&nbsp;Niranjan&nbsp;&nbsp;·&nbsp;&nbsp;Sachin Singh</div>
  </div>
  <div style="width:1px;height:24px;background:rgba(255,255,255,0.05)"></div>
  <div style="text-align:center">
    <div style="font-size:8.5px;letter-spacing:0.10em;text-transform:uppercase;color:#505050;margin-bottom:5px">Mentors</div>
    <div style="font-size:10px;color:#707070;letter-spacing:0.02em">Deven&nbsp;&nbsp;·&nbsp;&nbsp;Jaya</div>
  </div>
  <div style="width:1px;height:24px;background:rgba(255,255,255,0.05)"></div>
  <div style="text-align:center">
    <div style="font-size:8.5px;letter-spacing:0.10em;text-transform:uppercase;color:#505050;margin-bottom:5px">Faculty Mentor</div>
    <div style="font-size:10px;color:#707070;letter-spacing:0.02em">Victer Paul</div>
  </div>
</div>

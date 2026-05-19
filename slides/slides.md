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

<p style="color:#a8a8a8;font-size:13px;margin:-8px 0 14px">Modern cloud platforms rely heavily on automated provisioning systems. Provisioning jobs often fail due to configuration issues, environmental constraints, or platform limitations — and <strong style="color:#fff">understanding why is critical for scalable, resilient cloud operations.</strong></p>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:start">
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:8px">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#f87171">Scenario 1</div>
    <div style="color:#fff;font-size:13px;font-weight:600;line-height:1.3">Deployment decision paralysis</div>
    <div style="color:#808080;font-size:12px;line-height:1.55">Which zone for this critical batch job — AWS or Azure? An operator opens 5 dashboards, cross-references 3 Jira tickets, and asks two colleagues. They pick a zone based on gut feel. It fails due to IP exhaustion that was visible in the logs three days ago.</div>
  </div>
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:8px">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#fbbf24">Scenario 2</div>
    <div style="color:#fff;font-size:13px;font-weight:600;line-height:1.3">Silent reliability degradation</div>
    <div style="color:#808080;font-size:12px;line-height:1.55">Zone success rate drifts from 97% to 81% over two weeks. No alert fires. No dashboard highlights it. Then 40 VMs fail simultaneously during a time-critical deployment — and the on-call engineer has no idea this zone had been degrading.</div>
  </div>
  <div style="background:#282828;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:8px">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#a8a8a8">Scenario 3</div>
    <div style="color:#fff;font-size:13px;font-weight:600;line-height:1.3">Post-mortem guesswork</div>
    <div style="color:#808080;font-size:12px;line-height:1.55">After a failure cascade, root cause analysis takes hours. Was it hardware? Network? ESX host failure pulling down VMs? IP exhaustion? With no structured classification, every incident is reconstructed from scratch from raw logs.</div>
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
| `HARDWARE_FAILURE` | Post Provision | critical | Physical component degradation |
| `HOST_FAILURE` | Post Provision | critical | ESX / hypervisor unavailability |
| `POWER_FAILURE` | **Pre Provision** | critical | Power state before provisioning begins |
| `STORAGE_FAILURE` | Post Provision | critical | Disk / SAN allocation failure |
| `NETWORK_FAILURE` | Post Provision | high | NIC / switch / routing failure |
| `IP_FAILURE` | **Pre Provision** | high | IPAM / address reservation failure |
| `RESOURCE_FAILURE` | **Pre Provision** | medium | CPU / RAM exhaustion at planning |

<div class="insight">
  <strong>Phase matters</strong> — pre-provision errors (POWER, IP, RESOURCE) fire before allocation commits. Post-provision errors indicate failures after the workload was placed. Rely tracks both and surfaces them separately in the error breakdown.
</div>

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
      <div style="color:#777;font-size:11.5px;line-height:1.55">Score a zone against the fleet-wide baseline. Lagging zones are penalized relative to peers, not just in isolation.</div>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">Term 5</div>
        <div style="font-size:9px;color:#3e3e3e;font-family:'Geist Mono',monospace">Capacity Reliability</div>
      </div>
      <div style="color:#fff;font-size:12.5px;font-weight:600;line-height:1.25">Nonlinear capacity score</div>
      <div style="color:#777;font-size:11.5px;line-height:1.55">Model host utilization as a predictive risk via nonlinear decay — not a linear percentage. Catches overcommit before it becomes failure.</div>
    </div>
    <div style="background:#282828;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 15px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#4060D0">Term 4</div>
        <div style="font-size:9px;color:#3e3e3e;font-family:'Geist Mono',monospace">Outlier Detection</div>
      </div>
      <div style="color:#fff;font-size:12.5px;font-weight:600;line-height:1.25">Dynamic Tukey fences</div>
      <div style="color:#777;font-size:11.5px;line-height:1.55">Per-VM outlier thresholds scaled by resource footprint. Larger VMs get wider fences — no false positives from legitimate size differences.</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:auto">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px 15px">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:'Geist Mono',monospace;color:#484848;margin-bottom:6px">Designed from first principles</div>
      <div style="color:#666;font-size:12px;line-height:1.55">Success rate, stability, error severity — built from scratch against HPE's error classification and provisioning data. No prior art applied.</div>
    </div>
    <div class="insight" style="margin-top:0">
      Research provided <strong>three useful starting points</strong>. The derivation, tuning, and adaptation to provisioning data was our own work.
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
  <div style="background:rgba(64,96,208,0.08);border:1px solid rgba(64,96,208,0.2);border-radius:12px;padding:6px 18px;font-family:'Geist Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#4060D0">Live Demo</div>
  <div>
    <div style="font-size:48px;font-weight:700;letter-spacing:-0.03em;color:#fff;font-family:'Space Grotesk',sans-serif;line-height:1">Rel<span style="color:#4060D0">y</span>.</div>
    <div style="color:#a8a8a8;margin-top:12px;font-size:15px;font-family:'Space Grotesk',sans-serif;max-width:480px;line-height:1.6">Zone overview · Host mesh · PRI breakdown · Color classification · Settings panel</div>
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

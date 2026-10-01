# Rely.

A metric for analyzing, classifying, and improving provisioning reliability across cloud infrastructure.

Rely scores the reliability of ESX hosts and VMs with the **Provisioning Reliability Index (PRI)**, a 0–100 score paired with a `green | amber | red` color. It shows the score on a dashboard you can break down by fleet, zone, host, and VM.

## Links

| | |
| --- | --- |
| 🌐 **Live website** | [relyhpe.vercel.app](https://relyhpe.vercel.app) |
| 📊 **Presentation (Google Slides)** | [Rely: Google Slides deck](https://docs.google.com/presentation/d/1zC9et_DmEGsjAW9u5Vdt3EMyc-gSRmKaEgjv956md44/view) |
| 🎞️ **Presentation (web, Slidev)** | [relyhpe.vercel.app/slides](https://relyhpe.vercel.app/slides) |
| 🧮 **How We Calculate PRI** | [relyhpe.vercel.app/docs/how-we-calculate](https://relyhpe.vercel.app/docs/how-we-calculate) |
| ⚙️ **How We Generate Data** | [relyhpe.vercel.app/docs/how-we-generate](https://relyhpe.vercel.app/docs/how-we-generate) |
| 🗂️ **Data Browser** | [relyhpe.vercel.app/data](https://relyhpe.vercel.app/data) |
| 💻 **Source code** | [github.com/HPE-Team/rely](https://github.com/HPE-Team/rely) |

### Docs in this repo

- [docs/PRI.md](docs/PRI.md): what PRI is, its inputs, and how the score and color are computed (rendered at `/docs/how-we-calculate`)
- [docs/GENERATOR.md](docs/GENERATOR.md): the synthetic provisioning engine that produces the fleet data (rendered at `/docs/how-we-generate`)
- [docs/SCHEMA.md](docs/SCHEMA.md): the database schema (`zones`, `compute_server2`, `zone_metrics`, …)

## Features

- **Fleet overview**: fleet-wide PRI, error distribution, error heatmap, and error timeline
- **Zone drill-down**: per-zone PRI, a zone comparison table, and the hosts in each zone
- **Host → VM mesh**: an interactive graph of each ESX host and its VMs, with VM detail modals
- **Configurable weights**: tune PRI weights live, or pick from presets and shared configs
- **PRI breakdown**: see how each indicator (success rate, stability, error severity, outliers) affects the score
- **Command palette and search**: jump to any zone, host, or VM
- **Data browser**: browse and export raw compute-server records

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript
- Tailwind CSS v4, shadcn/ui, Radix UI
- Recharts and React Flow (`@xyflow/react`) for charts and graphs
- Drizzle ORM with MySQL (`mysql2`)
- Slidev for the web presentation (in [slides/](slides/))
- Deployed on Vercel

## Project structure

```
app/
  api/            REST routes (zones, hosts, compute-servers, search, pdf, …)
  components/     dashboard, layout, and UI components
  docs/           "How We Calculate" and "How We Generate" pages
  data/           Data browser
  zone/[id]/      Zone, host, and VM pages
  lib/
    calculations/ PRI and error calculations (pri.ts, errors.ts)
    config/       PRI config and presets
    db/           Drizzle connection and schema
docs/             Markdown sources for the docs pages
slides/           Slidev presentation
```

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure the database

Create a `.env.local` file that points at a MySQL database containing the generated data:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=provisioning_db
```

See [docs/SCHEMA.md](docs/SCHEMA.md) for the tables and [docs/GENERATOR.md](docs/GENERATOR.md) for how the data is generated.

### 3. Run

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint
```

### Slides

```bash
cd slides
npm install
npm run dev
```

## Team

**Contributors:** Akhil · Harsh Iyer · Kartik Balani · Niranjan · Sachin Singh

**Mentors:** Deven · Jaya

**Faculty Mentor:** Victer Paul

# Canton Cyber City

**A 3D intelligence explorer for Canton ledger activity.**

Canton Cyber City turns dense Canton network activity into a navigable cyber-city: parties become buildings, relationships become paths, and ledger behavior becomes an analyst-friendly visual map.

This project was built as a hackathon submission to make Canton data easier to inspect, explain, and reason about without forcing users to read raw ledger records first.

## Positioning

Traditional explorers are good at answering **"what happened?"**

Canton Cyber City is designed to help answer:

- **where** activity is happening
- **how** parties relate to each other
- **which** relationships deserve attention
- **why** a transaction or counterparty may matter operationally

The product idea is an intelligence layer for Canton activity: not a replacement for raw data, but a navigation system on top of it.

## Quick Guide

If you are reviewing this project, the intended flow is:

1. Open the app.
2. Enter a Canton party ID.
3. Start the scan.
4. Wait for the scanner dashboard to open.
5. Inspect the generated city:
   - the center node is the scanned target
   - surrounding buildings represent related parties, validators, apps, or system actors
   - visual emphasis indicates relationship strength, confidence, importance, or suppression
6. Use the scanner panels:
   - the table gives transaction-level visibility
   - the inspector explains selected activity
   - the HUD summarizes the active network context

The project is not meant to be only a 3D animation. The 3D city is the visual layer of an analysis system that also derives summaries, rankings, clusters, and relationship signals from Canton activity.

## What Problem It Solves

Ledger data is powerful, but it is often hard to understand quickly:

- party IDs are long and hard to compare
- relationships are spread across many records
- validators, apps, fee accounts, governance actors, and unknown parties can blend together
- raw transaction tables do not immediately show network shape

Canton Cyber City addresses this by turning ledger activity into a readable spatial model, supported by scanner-style analytical panels.

## Who It Is For

The project is designed around three main reviewer/user profiles:

- **Institutional finance teams**  
  Banks, asset managers, RWA issuers, and custody teams that need clearer visibility into high-complexity Canton activity.

- **Validator and infrastructure operators**  
  Teams that need to understand network participants, operational flows, validator relationships, and ecosystem topology.

- **Risk, compliance, and forensic analysts**  
  Analysts who need faster ways to follow relationships, identify high-value flows, review suspicious patterns, and reduce manual pathfinding through raw records.

The interface is intentionally visual because the core problem is not only access to data; it is the cognitive cost of understanding relationships inside that data.

## Core Features

- **Party-centric scan flow**  
  Start from a target party ID and build a visual network around it.

- **3D city visualization**  
  Buildings represent network actors. The city layout provides a fast visual sense of the target's activity environment.

- **Relationship paths**  
  Transactional links can be rendered as neon paths between nodes.

- **Counterparty intelligence**  
  The app derives rankings, confidence labels, interaction direction, activity volume, semantic tags, and risk hints.

- **Cluster and district hints**  
  Related actors can be grouped into validator, app, governance, or operations-style districts.

- **Noise suppression and promotion**  
  Less useful nodes can be visually reduced while important nodes are promoted.

- **Scanner dashboard**  
  Contract table, inspector, global stats, and HUD provide operational views over the same graph.

- **Server-side Modo API proxy**  
  The Modo API key is kept server-side and is not exposed through `NEXT_PUBLIC_*`.

## Intelligence Model

The app derives a set of analytical signals from the fetched activity:

- **relationship scoring** based on amount, frequency, recency, and confidence
- **confidence labels** to distinguish stronger and weaker inferred relationships
- **entity classes** such as validator, app, governance, fee account, contract, or unknown
- **risk flags** for deterministic patterns such as high-value flow, self-transfer, one-way flow, or low-confidence links
- **temporal summaries** such as recent activity and peak activity window
- **cluster hints** that help the city read as districts rather than disconnected dots
- **noise suppression** to reduce low-value visual clutter

These signals are deterministic UI intelligence, not speculative AI output. The goal is to help an analyst decide where to look next.

## Demo Walkthrough

Recommended demo path:

1. Enter a target party ID on the uplink screen.
2. Press `INITIATE_EXPLORATION`.
3. Watch the terminal log while the app fetches and reconstructs activity.
4. On the dashboard, rotate and zoom the 3D city.
5. Hover buildings to inspect node details.
6. Select table rows to connect raw activity with the visual network.
7. Open the inspector to review selected contract or transaction context.

## Architecture Overview

```text
User party ID
   |
   v
useLedger
   |
   v
cantonApi / modoFetch
   |
   v
/api/modo server proxy
   |
   v
Modo Canton API
   |
   v
useCityStore
   |
   v
3D City + Scanner Dashboard
```

## How To Read The City

- **Center / protected node**  
  The scanned party is the central point of the city.

- **Building height and emphasis**  
  Larger or more visually prominent buildings generally indicate stronger activity, higher relevance, or promoted analytical importance.

- **Districts / clusters**  
  Validator, app, governance, and operational relationships can appear as visual groupings.

- **Muted nodes**  
  Suppressed nodes remain present but are visually reduced so the analyst can focus on stronger signals.

- **Relationship paths**  
  Paths connect transactional or inferred relationships between parties.

- **Scanner panels**  
  The 3D scene provides topology; the table and inspector provide raw and decoded detail.

## Project Structure

```text
src/
  app/
    api/modo/route.ts        # server-side proxy for Modo API requests
    page.tsx                 # initial scanner/uplink screen

  components/
    3d/                      # City, Building, NeonPath, PrivacyDome
    scanner/                 # Dashboard, ContractTable, Inspector, GlobalStats
    ui/                      # HUD and supporting UI components

  hooks/
    useLedger.ts             # scan orchestration and terminal log flow

  services/
    cantonApi.ts             # app-facing Canton/Modo data methods
    cantonApi.helpers.ts     # paging, normalization, profile helpers

  store/
    useCityStore.ts          # Zustand state, derived graph intelligence
```

## Technology Stack

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Three.js**
- **React Three Fiber**
- **Drei**
- **Zustand**
- **Axios**
- **Lucide React**
- **Framer Motion**

## Environment Variables

Required at runtime:

```env
MODO_API_KEY=your_modo_api_key
NEXT_PUBLIC_LEDGER_URL=https://ledger-api-json.participant.hackcanton-01.devnet.naas.noders.services
```

Use `.env.example` as the safe template for local setup.

Important:

- Use `MODO_API_KEY`, not `NEXT_PUBLIC_MODO_API_KEY`.
- `MODO_API_KEY` is read only by the server route at `src/app/api/modo/route.ts`.
- Do not commit `.env.local`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build and run production locally:

```bash
npm run build
npm run start
```

## Scripts

```bash
npm run dev      # start development server
npm run build    # create production build
npm run start    # run production build
npm run lint     # run ESLint
```

## Deployment Notes

### GitHub

Do not commit:

- `.env.local`
- `.next/`
- `node_modules/`
- `tsconfig.tsbuildinfo`

These are either local secrets, dependencies, or generated build artifacts.

### Vercel

Set this environment variable in Vercel:

```env
MODO_API_KEY=your_modo_api_key
```

If your deployment requires a custom ledger endpoint, also set:

```env
NEXT_PUBLIC_LEDGER_URL=...
```

Do not set:

```env
NEXT_PUBLIC_MODO_API_KEY=...
```

The app intentionally routes Modo requests through `/api/modo` so the API key stays server-side.

## Security Notes

- The active runtime flow does not require the old hardcoded auth credential path.
- Modo requests are proxied through a server-side API route.
- The real API key should be provided only as `MODO_API_KEY`.
- `.env.local` must remain outside Git.
- Public client code should not contain API secrets.

## What To Look For During Review

Technical review points:

- server-side Modo proxy route
- typed Zustand graph state
- derived relationship summaries
- cluster hints and noise suppression
- 3D scene integration with scanner panels
- party-focused scan orchestration

Product review points:

- whether the 3D city makes network structure easier to understand
- whether the scanner panels help explain the visual graph
- whether selected transactions and counterparties are easier to inspect than in raw tables
- whether the cyber-city metaphor supports analysis rather than becoming decoration

Strategic review points:

- whether Canton activity becomes easier to explain to non-specialists
- whether the interface reduces the time needed to find meaningful relationships
- whether visual topology can support validator, institutional, or risk workflows
- whether this could evolve into a daily monitoring layer for Canton ecosystem teams

## Known Operational Notes

- The app is graphics-heavy because it combines WebGL and dashboard UI.
- For manual packaging, do not include `.next`, `node_modules`, or `tsconfig.tsbuildinfo`.
- If the app cannot fetch data in deployment, first verify that `MODO_API_KEY` is configured on the host.

## Pre-Deploy Checklist

1. Confirm `.env.local` is not committed.
2. Confirm `MODO_API_KEY` exists in the deployment environment.
3. Confirm `NEXT_PUBLIC_MODO_API_KEY` is not used.
4. Confirm `.next` and `node_modules` are not included in the upload.
5. Run:

```bash
npm run build
```

6. Smoke test:
   - open the app
   - start a scan
   - confirm data loads
   - confirm the city renders
   - confirm table and inspector interactions work

## Future Improvements

Potential next steps:

- add screenshots or a demo video
- add saved scan sessions
- add richer cluster explanations
- add exportable investigation reports
- add stronger filtering for entity classes and confidence levels
- add a dedicated presentation mode for judging/demo environments
- add a validation report comparing analysis time against raw table inspection
- add deeper validator and institutional monitoring workflows
- expose selected derived intelligence through a dedicated API layer

## Ownership

Created by **Tubterfly**.

This is an original hackathon project built to explore how Canton activity can be represented as an interactive intelligence interface.

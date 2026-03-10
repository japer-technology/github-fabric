# Cost and Constraints

> [NanoClaw Index](./index.md) · [Transformation Map](./transformation-map.md) · [Smallness as Architecture](./smallness-as-architecture.md)

> NanoClaw is the lightest agent the Fabric has absorbed. Six runtime dependencies, ~125 KB of source, and a container that builds in seconds. The economics are not just viable — they are the Fabric's best case.

---

## 1. The Cost Model

In its native model, NanoClaw's cost is the LLM API bill. The orchestrator runs on whatever machine you have — a Mac, a Linux server, even a Raspberry Pi. There is no hosting cost beyond the hardware you already own.

In the Fabric, cost has four components:

| Component | Driver | Rate |
|-----------|--------|------|
| **GitHub Actions minutes** | Compute time per invocation (build + reasoning + commit) | Free tier: 2,000 min/month. Pro: 3,000. Team: 3,000. Enterprise: 50,000. |
| **LLM API tokens** | Prompt + completion tokens per agent call | Varies by provider and model |
| **Git storage** | Committed state (sessions, memory, task records) | GitHub repo size limits (5 GB soft, 100 GB hard) |
| **Container build** | Docker image build and cache | Cached between runs (~200 MB) |

NanoClaw's advantage is that the first and fourth components are dramatically smaller than any previous case study.

---

## 2. Actions Minutes Budget

### Per-Invocation Breakdown

| Phase | Duration | Actions Minutes |
|-------|----------|----------------|
| Runner setup + checkout | ~20s | ~0.3 |
| Dependency installation (cached) | ~10–20s | ~0.2–0.3 |
| TypeScript compilation | ~10–15s | ~0.2 |
| Container build (cached) | ~5–15s | ~0.1–0.3 |
| Credential proxy startup | ~2s | ~0.03 |
| Agent execution (LLM reasoning) | ~30–120s | 0.5–2.0 |
| State commit + push | ~5–10s | ~0.1 |
| **Total** | ~1.5–3.5 min | **~1.5–3.5 min** |

**Critical advantage over OpenClaw:** NanoClaw has 6 dependencies vs. 100+. The `npm install` step takes seconds, not minutes. The TypeScript compilation (`tsc`) processes ~17 source files, not hundreds. The container build uses a minimal Dockerfile, not a multi-stage monorepo build.

### With Caching

| Scenario | Build Phase | Total Invocation |
|----------|-------------|------------------|
| Cold start (no cache) | ~45s | ~2.5–3.5 min |
| Warm cache (deps + build cached) | ~15s | ~1.5–2.5 min |
| Hot cache (everything cached) | ~5s | ~1–2 min |

With proper caching, NanoClaw approaches the theoretical minimum for a Fabric invocation: the build overhead essentially vanishes, leaving only LLM reasoning time as the variable cost.

### Monthly Budget

On the free tier (2,000 min/month):

| Scenario | Minutes per Invocation | Monthly Invocations |
|----------|----------------------|---------------------|
| Cold (every invocation rebuilds) | ~3 min | ~660 |
| Warm (cached deps + build) | ~2 min | ~1,000 |
| Hot (everything cached) | ~1.5 min | ~1,330 |

Practical estimate with mixed cache hits: **~800–1,200 invocations per month** on the free tier.

### Comparison with Other Modules

| Module | Minutes per Invocation | Monthly Budget (Free) | Build Overhead |
|--------|----------------------|----------------------|----------------|
| GMI | ~1.5–3 min | ~600–1,300 | Minimal (single package) |
| **NanoClaw** | **~1.5–3 min** | **~800–1,200** | **Minimal (6 deps, small build)** |
| OpenClaw | ~2.5–7 min | ~300–800 | Heavy (100+ deps, monorepo build) |
| Agenticana (single) | ~1.5–3 min | ~600–1,300 | Moderate |
| Agenticana (swarm) | ~5–9.5 min | ~200–400 | Heavy (parallel agents) |

NanoClaw matches GMI's per-invocation cost while providing dramatically more capability (container isolation, multi-tool agent, scheduled tasks, memory). It is the most cost-efficient complex agent the Fabric has evaluated.

---

## 3. LLM Token Budget

NanoClaw inherits the Claude Agent SDK's model flexibility. The Fabric expression preserves this:

### Token Consumption Estimates

NanoClaw invocations are lighter than OpenClaw (fewer tools to describe in context) but heavier than GMI (container context, memory, tool results):

| Invocation Type | Prompt Tokens | Completion Tokens | Total Tokens |
|----------------|--------------|-------------------|-------------|
| Simple issue response | ~2,500 | ~1,000 | ~3,500 |
| Issue with file reading | ~5,000 | ~2,500 | ~7,500 |
| Web search + analysis | ~8,000 | ~4,000 | ~12,000 |
| Browser automation task | ~10,000 | ~5,000 | ~15,000 |
| Agent swarm (multi-agent) | ~15,000 | ~8,000 | ~23,000 |
| Complex multi-tool task | ~20,000 | ~10,000 | ~30,000 |

### Monthly Token Budget Example

At 800 invocations/month with a mixed workload using Claude Sonnet ($3/1M input, $15/1M output):

| Task Type | Invocations | Tokens Each | Total Tokens | Cost |
|-----------|-------------|------------|-------------|------|
| Simple responses | 400 | 3.5K | 1.4M | $4.20 + $3.75 = $7.95 |
| File/web tasks | 250 | 10K | 2.5M | $7.50 + $9.38 = $16.88 |
| Complex tasks | 120 | 23K | 2.76M | $8.28 + $18.00 = $26.28 |
| Browser/swarm | 30 | 30K | 900K | $2.70 + $6.75 = $9.45 |
| **Total** | 800 | | 7.56M | **~$60/month** |

With cheaper models for simple tasks (Haiku for simple, Sonnet for complex):

| Task Type | Model | Invocations | Cost |
|-----------|-------|-------------|------|
| Simple responses | Haiku ($0.25/$1.25) | 400 | ~$0.85 |
| File/web tasks | Sonnet | 250 | ~$16.88 |
| Complex tasks | Sonnet | 120 | ~$26.28 |
| Browser/swarm | Sonnet | 30 | ~$9.45 |
| **Total** | Mixed | 800 | **~$53/month** |

NanoClaw's token costs are comparable to OpenClaw's — the LLM cost is determined by task complexity, not source complexity. The agent's intelligence (Claude) is the same regardless of how many lines of orchestration code surround it.

---

## 4. Git Storage Budget

### Session Transcripts

NanoClaw sessions are lighter than OpenClaw's (fewer tool descriptions, simpler context):

Each JSONL session: ~3–50 KB.

At 800 invocations/month: ~2.4–40 MB/month.

### Memory

Per-group `CLAUDE.md` growth: ~10–50 KB/month at active usage.

Append-only `memory.log`: ~30–100 KB/month.

### Task Records

Task definitions + run records: ~5–20 KB/month.

### Annual Projection

| Data Type | Monthly Growth | Annual Growth |
|-----------|---------------|---------------|
| Sessions | 2.4–40 MB | 29–480 MB |
| Memory | 10–50 KB | 120–600 KB |
| Task records | 5–20 KB | 60–240 KB |
| **Total** | ~2.5–41 MB | **~30–481 MB** |

For most deployments: **50–150 MB/year** — comfortable for GitHub's storage limits and well below the range where archival is necessary.

### Storage Optimization

- **Session pruning:** Archive sessions older than 90 days to a separate branch.
- **Memory compaction:** Periodically summarize `CLAUDE.md` to keep it within context-window budgets.
- **Selective commit:** Only commit sessions with state changes (skip read-only invocations).

---

## 5. Runner Resource Constraints

| Resource | GitHub Runner Limit | NanoClaw Requirement | Margin |
|----------|-------------------|--------------------|--------|
| **RAM** | 7 GB | ~500 MB (Node.js + container + agent) | Very comfortable (~6.5 GB headroom) |
| **Disk** | 14 GB | ~500 MB (repo + deps + container image) | Very comfortable (~13.5 GB headroom) |
| **CPU** | 2 cores | 1 core (single process, single compilation) | Comfortable |
| **Network** | Egress only | LLM API calls + web search/fetch | Sufficient |
| **Job timeout** | 6 hours | ~1.5–3.5 minutes typical | No concern |

NanoClaw's minimal footprint means runner resources are never a constraint. There is no CPU-intensive build phase (unlike OpenClaw's pnpm workspace build), no heavy dependency tree to install, and no large container image to build.

### Container Resource Usage

| Resource | NanoClaw Container | Notes |
|----------|-------------------|-------|
| **Image size** | ~200 MB | Node.js base + Claude SDK + minimal tools |
| **Runtime memory** | ~200–400 MB | Agent execution + tool use |
| **Browser (if used)** | +~500 MB | Headless Chromium |
| **Total peak** | ~400–900 MB | Well within runner limits |

---

## 6. Budget Guardrails

| Guardrail | Default | Configuration |
|-----------|---------|---------------|
| Maximum invocations per day | 50 | `config/settings.json` |
| Maximum tokens per invocation | 30,000 | Model-level config |
| Maximum browser automation time | 60s | Tool-level config |
| Maximum agent swarm size | 3 agents | Agent config |
| Container build cache TTL | 7 days | Workflow cache config |
| Session archive after | 90 days | State management config |
| Monthly Actions minutes alert | 80% of tier | Monitoring workflow |

All guardrails are **committed configuration** — reviewable, diffable, and adjustable via PR.

---

## 7. Comparison: NanoClaw vs. Native Deployment

| Cost Dimension | NanoClaw Native (Local) | NanoClaw on Fabric | Notes |
|---------------|------------------------|-------------------|-------|
| **Compute** | $0 (runs on your machine) | Free–$0 (Actions free tier) | Both free at typical usage |
| **LLM tokens** | $30–60/month | $30–60/month | Same (model choice, not platform) |
| **Storage** | Disk (unlimited practical) | Git (5 GB soft limit) | Fabric needs archival at high volume |
| **Maintenance** | Manual (updates, restarts, monitoring) | Zero (workflow-managed) | Fabric wins |
| **Availability** | Depends on host uptime | 99.9%+ (GitHub Actions SLA) | Fabric is more reliable |
| **Auditability** | SQLite logs (may be lost) | Git history (permanent) | Fabric wins decisively |
| **Speed** | 1–5s response (streaming) | 1.5–3.5 min response | Native wins decisively |
| **Channels** | 5+ (WhatsApp, Telegram, etc.) | 1 (GitHub Issues) | Native wins for multi-channel |
| **Container isolation** | ✓ (Docker/Apple Container) | ✓ (Docker inside runner) | Both — Fabric adds runner layer |
| **Total monthly** | ~$30–60 (LLM only) | ~$30–60 (LLM only) | Identical for typical usage |

The economic case for the Fabric is not cost savings — NanoClaw is already free to run locally. The case is **governance**: the Fabric trades response speed and channel breadth for permanent auditability, zero-maintenance operation, and defense-in-depth isolation.

---

## 8. Summary

| Dimension | Status | Key Detail |
|-----------|--------|------------|
| Actions minutes | ✅ Best case | ~800–1,200 invocations/month on free tier (with caching) |
| LLM tokens | ✅ Comparable | ~$53–60/month for 800 mixed invocations |
| Git storage | ✅ Comfortable | ~30–481 MB/year (archival rarely needed) |
| Runner resources | ✅ Abundant | ~500 MB RAM, ~500 MB disk — massive headroom |
| Container build | ✅ Fast | ~5–15s cached, ~45s cold |
| Budget guardrails | ✅ Committed | All limits reviewable as configuration |

NanoClaw on the Fabric is the most economically efficient complex agent the Fabric has evaluated. Its minimal build footprint translates directly to lower Actions minutes consumption. Its small dependency tree means faster cold starts and smaller cache payloads. Its lightweight container means more headroom for agent reasoning. The economics are not a constraint — they are an advantage. NanoClaw demonstrates that the Fabric's optimal cost profile is achieved not by optimizing complex builds, but by starting with a source agent that was designed to be minimal from the beginning.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

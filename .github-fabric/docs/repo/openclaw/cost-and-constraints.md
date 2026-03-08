# Cost and Constraints

> [OpenClaw Index](./index.md) · [Transformation Map](./transformation-map.md) · [Gateway as Persistent Mind](./gateway-as-persistent-mind.md)

> OpenClaw is the most resource-intensive module the Fabric has absorbed. Every invocation builds a 500 MB+ monorepo, runs a full AI runtime, and commits state. The economics are viable — but demand awareness.

---

## 1. The Cost Model

In its native model, OpenClaw's cost is the LLM API bill plus hosting (a personal machine or small VPS). The Gateway is lightweight — it runs comfortably on a Raspberry Pi or a $5/month cloud instance.

In the Fabric, cost has four components:

| Component | Driver | Rate |
|-----------|--------|------|
| **GitHub Actions minutes** | Compute time per invocation (build + reasoning + commit) | Free tier: 2,000 min/month. Pro: 3,000. Team: 3,000. Enterprise: 50,000. |
| **LLM API tokens** | Prompt + completion tokens per agent call | Varies by provider and model |
| **Git storage** | Committed state (sessions, memory, issue mappings) | GitHub repo size limits (5 GB soft, 100 GB hard) |
| **Build artifacts** | npm packages, build output | Cached between runs (~200–500 MB) |

The interaction between build time and reasoning time is what distinguishes OpenClaw's cost profile from simpler modules.

---

## 2. Actions Minutes Budget

### Per-Invocation Breakdown

| Phase | Duration | Actions Minutes |
|-------|----------|----------------|
| Runner setup + checkout | ~30s | 0.5 |
| Dependency installation (cached) | ~30–60s | 0.5–1.0 |
| OpenClaw build | ~60–180s | 1.0–3.0 |
| Agent execution (LLM reasoning) | ~30–120s | 0.5–2.0 |
| State commit + push | ~10–30s | ~0.5 |
| **Total** | ~3–7 min | **~3–7 min** |

**Critical difference from GMI:** The build step. GMI installs one npm package (~10s). OpenClaw builds a full monorepo from source (~1–3 min). This roughly doubles the per-invocation cost.

### With Caching

GitHub Actions supports caching `node_modules` and build output between runs:

| Scenario | Build Phase | Total Invocation |
|----------|-------------|------------------|
| Cold start (no cache) | ~3 min | ~5–7 min |
| Warm cache (deps cached) | ~1 min | ~3–4 min |
| Hot cache (deps + build cached) | ~30s | ~2–3 min |

With proper caching, the cost approaches GMI levels for subsequent invocations. The first invocation after an upstream update is expensive; subsequent invocations amortize the build cost.

### Monthly Budget

On the free tier (2,000 min/month):

| Scenario | Minutes per Invocation | Monthly Invocations |
|----------|----------------------|---------------------|
| Cold (every invocation rebuilds) | ~6 min | ~330 |
| Warm (cached deps) | ~4 min | ~500 |
| Hot (cached deps + build) | ~2.5 min | ~800 |

Practical estimate with mixed cache hits: **~400–600 invocations per month** on the free tier.

### Comparison with Other Modules

| Module | Minutes per Invocation | Monthly Budget (Free) |
|--------|----------------------|----------------------|
| GMI | ~1.5–3 min | ~600–1,300 |
| OpenClaw (Fabric) | ~2.5–7 min | ~300–800 |
| Agenticana (single agent) | ~1.5–3 min | ~600–1,300 |
| Agenticana (swarm, 3 agents) | ~5–9.5 min | ~200–400 |

OpenClaw's per-invocation cost falls between GMI (single agent) and Agenticana's swarm mode. This is expected: OpenClaw brings more tools and a heavier runtime, but executes as a single agent.

---

## 3. LLM Token Budget

OpenClaw supports multiple providers and models. The Fabric expression inherits this flexibility:

### Model Selection

| Provider | Model | Input Cost (per 1M tokens) | Output Cost (per 1M tokens) | Use Case |
|----------|-------|---------------------------|----------------------------|----------|
| Anthropic | Claude Haiku | $0.25 | $1.25 | Simple queries, status checks |
| Anthropic | Claude Sonnet | $3.00 | $15.00 | Standard development tasks |
| Anthropic | Claude Opus | $15.00 | $75.00 | Complex reasoning, architecture |
| OpenAI | GPT-4o-mini | $0.15 | $0.60 | Simple queries |
| OpenAI | GPT-4o | $2.50 | $10.00 | Standard tasks |
| Google | Gemini Flash | $0.075 | $0.30 | Simple queries |
| Google | Gemini Pro | $1.25 | $5.00 | Standard tasks |

### Token Consumption Estimates

OpenClaw's tool-rich invocations consume more tokens than simpler agents because tool calls and their results are included in the context:

| Invocation Type | Prompt Tokens | Completion Tokens | Total Tokens |
|----------------|--------------|-------------------|-------------|
| Simple issue response | ~3,000 | ~1,500 | ~4,500 |
| Code review with file reading | ~8,000 | ~4,000 | ~12,000 |
| Browser automation task | ~12,000 | ~6,000 | ~18,000 |
| Sub-agent orchestration | ~20,000 | ~10,000 | ~30,000 |
| Complex multi-tool task | ~30,000 | ~15,000 | ~45,000 |

### Monthly Token Budget Example

At 500 invocations/month with a mixed workload using Claude Sonnet:

| Task Type | Invocations | Tokens Each | Total Tokens | Cost |
|-----------|-------------|------------|-------------|------|
| Simple responses | 200 | 4.5K | 900K | $2.70 + $3.75 = $6.45 |
| Code review | 200 | 12K | 2.4M | $7.20 + $12.00 = $19.20 |
| Complex tasks | 80 | 30K | 2.4M | $7.20 + $18.00 = $25.20 |
| Browser/multi-tool | 20 | 45K | 900K | $2.70 + $6.75 = $9.45 |
| **Total** | 500 | | 6.6M | **~$60/month** |

With cheaper models (Haiku for simple tasks, Sonnet for complex):

| Task Type | Model | Invocations | Cost |
|-----------|-------|-------------|------|
| Simple responses | Haiku | 200 | ~$1.10 |
| Code review | Sonnet | 200 | ~$19.20 |
| Complex tasks | Sonnet | 80 | ~$25.20 |
| Browser/multi-tool | Sonnet | 20 | ~$9.45 |
| **Total** | Mixed | 500 | **~$55/month** |

OpenClaw's model failover system (configured in `.GITOPENCLAW/config/settings.json`) can automatically fall back from expensive models to cheaper ones, further reducing costs for simple tasks.

---

## 4. Git Storage Budget

### Session Transcripts

Each JSONL session: ~5–100 KB (OpenClaw sessions tend to be larger than GMI sessions due to tool call/result inclusion).

At 500 invocations/month: ~2.5–50 MB/month.

### Memory Log

Append-only `memory.log` growth: ~50–200 KB/month at 500 invocations.

### Issue Mappings

One JSON file per issue: ~0.5 KB each. Negligible.

### Annual Projection

| Data Type | Monthly Growth | Annual Growth |
|-----------|---------------|---------------|
| Sessions | 2.5–50 MB | 30–600 MB |
| Memory | 50–200 KB | 0.6–2.4 MB |
| Mappings | ~50 KB | ~0.6 MB |
| **Total** | ~3–51 MB | **~31–603 MB** |

The upper bound (603 MB/year) approaches the range where periodic archival is advisable. For most deployments, the actual growth will be in the 50–200 MB/year range — comfortable for GitHub's storage limits.

### Storage Optimization

- **Session pruning:** Old sessions can be archived to a separate branch or deleted from `state/` after a retention period (e.g., 90 days).
- **Memory compaction:** The memory.log can be periodically summarized, replacing many small entries with fewer consolidated ones.
- **Committed vs. regenerated:** Binary artifacts (SQLite databases, vector indices) should be gitignored and regenerated at invocation time from committed source data.

---

## 5. Runner Resource Constraints

| Resource | GitHub Runner Limit | OpenClaw Requirement | Margin |
|----------|-------------------|--------------------|--------|
| **RAM** | 7 GB | ~1–2 GB (Node.js + build + runtime) | Comfortable (~5 GB headroom) |
| **Disk** | 14 GB | ~2–3 GB (repo + node_modules + build output) | Comfortable (~11 GB headroom) |
| **CPU** | 2 cores | 1–2 cores (build + reasoning) | Tight during build, comfortable during reasoning |
| **Network** | Egress only, no hard cap | LLM API calls + web search/fetch | Sufficient |
| **Job timeout** | 6 hours | ~3–7 minutes typical | No concern |

The only tight constraint is CPU during the build phase. The `pnpm build` step is CPU-intensive (TypeScript compilation, bundling). This is why build caching matters — it avoids the CPU bottleneck on subsequent invocations.

### Browser Automation Constraints

OpenClaw's browser tool (headless Chromium) on Actions runners:

| Property | Constraint |
|----------|-----------|
| Display | Headless only (no `--headed`) |
| Memory | ~500 MB for Chromium |
| Timeout | Configurable per-page, default 30s |
| Concurrent tabs | Limited by RAM (~3–5 tabs comfortably) |
| Downloads | Temp directory (ephemeral) |
| CDP protocol | Full access |
| JavaScript | V8 execution available |

Browser automation is one of OpenClaw's most powerful tools, and it works on Actions runners with these constraints. Pages with heavy JavaScript, video, or WebGL may fail or be slow.

---

## 6. Budget Guardrails

The Fabric should enforce budget guardrails specific to OpenClaw's cost profile:

| Guardrail | Default | Configuration |
|-----------|---------|---------------|
| Maximum invocations per day | 30 | `.GITOPENCLAW/config/settings.json` |
| Maximum tokens per invocation | 50,000 | Model-level config |
| Maximum browser automation time | 60s | Tool-level config |
| Maximum sub-agent depth | 2 | Agent config |
| Build cache TTL | 7 days | Workflow-level cache config |
| Session archive after | 90 days | State management config |
| Monthly Actions minutes alert | 80% of tier | Separate monitoring workflow |

All guardrails are **committed configuration** — reviewable, diffable, and adjustable by PR. A team that needs more invocations raises the limit through a reviewed change, creating an audit trail of the decision.

---

## 7. Comparison: OpenClaw vs. Native Deployment

| Cost Dimension | OpenClaw Native (VPS) | OpenClaw on Fabric | Notes |
|---------------|----------------------|--------------------|-------|
| **Compute** | $5–20/month (VPS) | Free–$4/month (Actions) | Fabric is free on free tier |
| **LLM tokens** | $30–100/month | $30–100/month | Same (determined by model choice) |
| **Storage** | Disk (unlimited practical) | Git (5 GB soft limit) | Fabric needs archival strategy |
| **Maintenance** | Manual (updates, restarts, monitoring) | Zero (workflow-managed) | Fabric wins decisively |
| **Availability** | Depends on host uptime | 99.9%+ (GitHub Actions SLA) | Fabric is more reliable |
| **Auditability** | Logs (may be lost) | Git history (permanent) | Fabric wins decisively |
| **Speed** | 1–5s response | 2–7 min response | Native wins decisively |
| **Channels** | 22+ | 1 | Native wins for multi-channel |
| **Total monthly** | ~$35–120 | ~$30–100 | Comparable at similar usage |

The economic case for the Fabric is not cost savings — it is **governance dividends**. The Fabric trades response speed and channel breadth for auditability, reproducibility, and zero-maintenance operation.

---

## 8. Summary

| Dimension | Status | Key Constraint |
|-----------|--------|----------------|
| Actions minutes | ✅ Viable | ~400–600 invocations/month on free tier (with caching) |
| LLM tokens | ✅ Viable | ~$55–60/month for 500 mixed invocations |
| Git storage | ✅ Comfortable | ~31–603 MB/year (archival recommended at high end) |
| Runner resources | ✅ Sufficient | Build phase is CPU-tight; caching mitigates |
| Browser automation | ✅ Works | Headless only, ~500 MB RAM overhead |
| Budget guardrails | ✅ Committed | All limits are reviewable configuration |

OpenClaw on the Fabric is economically viable for developer-workflow use cases. The build cost is higher than simpler modules, but caching reduces it to comparable levels. The LLM cost is determined by model choice and task complexity — the same as native deployment. The governance dividends — auditability, reproducibility, zero maintenance — justify the tradeoff of speed and channel breadth.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

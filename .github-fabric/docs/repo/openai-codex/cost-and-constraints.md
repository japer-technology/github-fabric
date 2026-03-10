# Cost and Constraints

> [OpenAI Codex Index](./index.md) · [Transformation Map](./transformation-map.md) · [Sandbox as Governance](./sandbox-as-governance.md)

> Codex is a compiled Rust binary. It has zero runtime dependencies. It starts in milliseconds. This changes the Fabric's cost model fundamentally — the build overhead that dominates every previous module's economics essentially vanishes. What remains is pure reasoning cost.

---

## 1. The Cost Model

In its native model, Codex's cost is the LLM API bill plus zero. The binary runs on whatever machine you have — a Mac, a Linux workstation, a CI runner. There is no hosting cost, no dependency cost, no build cost. You download the binary and run it.

In the Fabric, cost has four components:

| Component | Driver | Rate |
|-----------|--------|------|
| **GitHub Actions minutes** | Compute time per invocation (download + reasoning + commit) | Free tier: 2,000 min/month. Pro: 3,000. Team: 3,000. Enterprise: 50,000. |
| **LLM API tokens** | Prompt + completion tokens per reasoning call | Varies by provider and model |
| **Git storage** | Committed state (transcripts, responses, logs) | GitHub repo size limits (5 GB soft, 100 GB hard) |
| **Binary cache** | Cached Codex binary (~15 MB) | GitHub Actions cache (10 GB limit) |

Codex's advantage is that the first component — Actions minutes — is dramatically lower than any previous module because there is **no build phase.**

---

## 2. Actions Minutes Budget

### Per-Invocation Breakdown

| Phase | Duration | Actions Minutes |
|-------|----------|----------------|
| Runner setup + checkout | ~20s | ~0.3 |
| Binary download (cached) | ~2–5s | ~0.05–0.1 |
| Binary download (cold) | ~10–15s | ~0.2 |
| Preflight checks | ~2s | ~0.03 |
| Agent execution (LLM reasoning) | ~30–180s | 0.5–3.0 |
| State commit + push | ~5–10s | ~0.1 |
| Response posting | ~2–5s | ~0.05 |
| **Total** | ~1–3.5 min | **~1–3.5 min** |

**Critical advantage:** No `npm install`, no `pip install`, no `cargo build`, no `tsc`, no Docker image build. The build phase that consumes 30–120 seconds in every previous module is eliminated entirely. The only variable cost is LLM reasoning time.

### With Caching

| Scenario | Setup Phase | Total Invocation |
|----------|-------------|------------------|
| Cold start (no cache, binary download) | ~35s | ~1.5–3.5 min |
| Warm cache (binary cached) | ~25s | ~1–3 min |
| Hot path (everything cached, fast reasoning) | ~25s | ~1–2 min |

With the binary cached, Codex approaches the theoretical minimum for a Fabric invocation: runner setup (~20s) + reasoning time + commit (~10s). The overhead is irreducible — it is GitHub Actions' base cost, not the module's.

### Monthly Budget

On the free tier (2,000 min/month):

| Scenario | Minutes per Invocation | Monthly Invocations |
|----------|----------------------|---------------------|
| Cold (every invocation downloads binary) | ~2.5 min | ~800 |
| Warm (cached binary) | ~2 min | ~1,000 |
| Hot (cached, fast tasks) | ~1.5 min | ~1,330 |

Practical estimate with mixed cache hits: **~900–1,300 invocations per month** on the free tier.

### Comparison with Other Modules

| Module | Minutes per Invocation | Monthly Budget (Free) | Build Overhead |
|--------|----------------------|----------------------|----------------|
| GMI | ~1.5–3 min | ~600–1,300 | Minimal (single package) |
| NanoClaw | ~1.5–3 min | ~800–1,200 | Minimal (6 deps, small build) |
| **Codex** | **~1–3 min** | **~900–1,300** | **None (pre-built binary)** |
| OpenClaw | ~2.5–7 min | ~300–800 | Heavy (100+ deps, monorepo build) |
| Agenticana (single) | ~1.5–3 min | ~600–1,300 | Moderate |
| Agenticana (swarm) | ~5–9.5 min | ~200–400 | Heavy (parallel agents) |

Codex matches or exceeds the efficiency of every previous module while providing the most capable agent (sandboxed shell execution, file reading/writing, multi-provider support).

---

## 3. LLM Token Budget

### Token Consumption Estimates

Codex invocations are moderately heavy — the system prompt includes detailed instructions, and the agent reads repository files as part of reasoning:

| Invocation Type | Prompt Tokens | Completion Tokens | Total Tokens |
|----------------|--------------|-------------------|-------------|
| Simple code explanation | ~3,000 | ~1,500 | ~4,500 |
| File modification (single file) | ~5,000 | ~3,000 | ~8,000 |
| Multi-file refactor | ~10,000 | ~5,000 | ~15,000 |
| Test generation + execution | ~12,000 | ~8,000 | ~20,000 |
| Complex multi-step task | ~20,000 | ~12,000 | ~32,000 |
| Large codebase analysis | ~30,000 | ~15,000 | ~45,000 |

### Monthly Token Budget Example

At 900 invocations/month with a mixed workload using o4-mini:

| Task Type | Invocations | Tokens Each | Total Tokens | Estimated Cost |
|-----------|-------------|------------|-------------|----------------|
| Simple explanations | 300 | 4.5K | 1.35M | ~$2–4 |
| File modifications | 300 | 10K | 3.0M | ~$5–10 |
| Multi-file tasks | 200 | 20K | 4.0M | ~$8–15 |
| Complex tasks | 100 | 35K | 3.5M | ~$10–20 |
| **Total** | 900 | | 11.85M | **~$25–50/month** |

Note: Exact costs depend on the model and provider. o4-mini is significantly cheaper than GPT-4o or o1 for the same token count. Codex's multi-provider support means users can optimize cost by selecting the appropriate model tier for each task type.

---

## 4. Git Storage Budget

### State Growth

Codex adds less state than previous modules because it has no native database (no SQLite to serialize):

| Data Type | Per Invocation | Monthly (900 invocations) |
|-----------|---------------|--------------------------|
| Transcript JSONL | ~2–20 KB | ~1.8–18 MB |
| Response markdown | ~1–10 KB | ~0.9–9 MB |
| Execution logs | ~1–5 KB | ~0.9–4.5 MB |
| File diffs (committed by agent) | Variable | Variable |
| **Total state** | ~4–35 KB | **~3.6–31.5 MB** |

### Annual Projection

| Data Type | Monthly Growth | Annual Growth |
|-----------|---------------|---------------|
| Transcripts | 1.8–18 MB | 22–216 MB |
| Responses | 0.9–9 MB | 11–108 MB |
| Logs | 0.9–4.5 MB | 11–54 MB |
| **Total** | ~3.6–31.5 MB | **~44–378 MB** |

For most deployments: **50–150 MB/year** — comfortable for GitHub's storage limits and well below the range where archival is necessary.

---

## 5. Runner Resource Constraints

| Resource | GitHub Runner Limit | Codex Requirement | Margin |
|----------|-------------------|--------------------|--------|
| **RAM** | 7 GB | ~200–500 MB (Rust binary + sandboxed process) | Very comfortable (~6.5 GB headroom) |
| **Disk** | 14 GB | ~50 MB (binary + repo checkout) | Very comfortable (~13.9 GB headroom) |
| **CPU** | 2 cores | 1 core (single-threaded agent loop) | Comfortable |
| **Network** | Egress only | LLM API calls + git push | Sufficient |
| **Job timeout** | 6 hours | ~1–3.5 minutes typical | No concern |

Codex's compiled binary has the smallest runtime footprint of any Fabric module. The entire agent — binary, runtime, and working state — fits in ~200 MB of RAM. No JVM warmup, no Node.js event loop, no Python interpreter. This is the Fabric's lightest runtime.

---

## 6. Binary Distribution Economics

The pre-built binary model introduces a new cost dimension: binary cache management.

| Dimension | Detail |
|-----------|--------|
| Binary size | ~15 MB (statically linked, musl target) |
| Cache key | Version hash (changes only on Codex releases) |
| Cache hit rate | ~99%+ (binary changes monthly at most) |
| Cache storage | Counts against Actions cache limit (10 GB) |
| Download bandwidth | ~15 MB on cache miss (from GitHub Releases) |

The binary changes only when the upstream Codex project releases a new version. Between releases (typically weeks to months), every invocation hits the cache. This means the binary distribution cost is effectively zero for ongoing operations.

### Comparison: Build vs. Binary

| Strategy | Time | Compute Cost | Cache Cost | Reliability |
|----------|------|-------------|------------|-------------|
| Build from source (Cargo) | 5–15 min | High (Rust compilation is CPU-intensive) | Large (target/ directory) | Variable (depends on deps) |
| Install from npm | 30–60s | Moderate | Moderate (~100 MB) | Good |
| **Pre-built binary** | **2–5s** | **Negligible** | **~15 MB** | **Excellent** |

Pre-built binary distribution is the optimal strategy for Codex and should be the Fabric's recommended approach for any compiled agent.

---

## 7. Budget Guardrails

| Guardrail | Default | Configuration |
|-----------|---------|---------------|
| Maximum invocations per day | 50 | `config/settings.json` |
| Maximum tokens per invocation | 100,000 | Model-level config |
| Maximum execution time per invocation | 300s | Workflow timeout |
| Binary cache TTL | Until next release | Version-pinned cache key |
| Transcript archive after | 90 days | State management config |
| Monthly Actions minutes alert | 80% of tier | Monitoring workflow |

All guardrails are **committed configuration** — reviewable, diffable, and adjustable via PR.

---

## 8. Comparison: Codex vs. Native Deployment

| Cost Dimension | Codex Native (Local) | Codex on Fabric | Notes |
|---------------|---------------------|-----------------|-------|
| **Compute** | $0 (runs on your machine) | Free–$0 (Actions free tier) | Both free at typical usage |
| **LLM tokens** | $25–50/month | $25–50/month | Same (model choice, not platform) |
| **Storage** | Disk (unlimited practical) | Git (5 GB soft limit) | Fabric needs archival at high volume |
| **Build** | $0 (pre-built binary) | $0 (pre-built binary) | Identical |
| **Maintenance** | Manual (update binary, manage env) | Zero (workflow-managed) | Fabric wins |
| **Availability** | Depends on your machine being on | 99.9%+ (GitHub Actions SLA) | Fabric wins |
| **Auditability** | Terminal output (lost on close) | Git history (permanent) | Fabric wins decisively |
| **Speed** | Instant (streaming terminal output) | 1–3.5 min (workflow overhead) | Native wins decisively |
| **Sandbox** | Seatbelt/Docker (kernel-enforced) | Docker + runner VM (double-layered) | Fabric adds a layer |
| **Multi-user** | Single user (your terminal) | Team (collaborator permissions) | Fabric wins |
| **Total monthly** | ~$25–50 (LLM only) | ~$25–50 (LLM only) | Identical for typical usage |

The economic case for the Fabric is not cost savings — Codex is already free to run locally. The case is **governance**: the Fabric trades response speed for permanent auditability, zero-maintenance operation, team visibility, and defense-in-depth isolation. For a solo developer on a personal project, native Codex is faster and more convenient. For a team, an organization, or any context requiring accountability, the Fabric is the correct deployment target.

---

## 9. Summary

| Dimension | Status | Key Detail |
|-----------|--------|------------|
| Actions minutes | ✅ Best case | ~900–1,300 invocations/month on free tier — zero build overhead |
| LLM tokens | ✅ Comparable | ~$25–50/month for 900 mixed invocations |
| Git storage | ✅ Comfortable | ~44–378 MB/year (archival rarely needed) |
| Runner resources | ✅ Minimal | ~200 MB RAM, ~50 MB disk — maximum headroom |
| Binary distribution | ✅ Optimal | ~15 MB cached, changes monthly at most |
| Budget guardrails | ✅ Committed | All limits reviewable as configuration |

Codex on the Fabric is the most economically efficient module the Fabric has evaluated — not because it uses less reasoning (the LLM cost is the same regardless of the orchestration layer), but because it eliminates every cost that is not reasoning. No build. No dependencies. No compilation. No container image. The pre-built Rust binary reduces the Fabric's overhead to its irreducible minimum: runner setup, reasoning, and commit. Everything else is zero.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

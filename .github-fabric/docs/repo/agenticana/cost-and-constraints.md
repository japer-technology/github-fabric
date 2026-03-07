# Cost and Constraints

> [Agenticana Index](./index.md) · [Transformation Map](./transformation-map.md) · [Swarm and Simulacrum](./swarm-and-simulacrum.md)

> When every agent invocation costs Actions minutes and LLM tokens, the Model Router stops being an optimization — it becomes an operational necessity.

---

## 1. The Cost Model

In the local VS Code model, Agenticana's cost is the LLM API bill. The developer's machine is free. The runtime is free. The only variable cost is tokens consumed by the twenty agents and their skills.

In the Fabric, cost has three components:

| Component | Driver | Rate |
|-----------|--------|------|
| **GitHub Actions minutes** | Compute time per job | Free tier: 2,000 min/month. Pro: 3,000. Team: 3,000. Enterprise: 50,000. |
| **LLM API tokens** | Prompt + completion tokens per agent call | Varies by provider and model tier |
| **Git storage** | Committed state (sessions, ReasoningBank, attestations) | GitHub repo size limits (5 GB soft, 100 GB hard) |

The interaction between these components is what makes cost management non-trivial for a twenty-agent system.

---

## 2. Actions Minutes Budget

### Single-Agent Invocation

A typical single-agent invocation:

| Phase | Duration | Actions Minutes |
|-------|----------|----------------|
| Runner setup + checkout | ~30s | 0.5 |
| Dependency installation | ~30s | 0.5 |
| Route determination | ~5s | ~0 |
| Agent execution (LLM reasoning) | 30–120s | 0.5–2.0 |
| State commit + push | ~10s | ~0 |
| **Total** | ~1.5–3.5 min | **~1.5–3.0 min** |

On the free tier (2,000 min/month), this allows roughly **600–1,300 single-agent invocations per month**.

### Swarm Invocation

A three-agent swarm:

| Job | Duration | Actions Minutes |
|-----|----------|----------------|
| Route job | ~0.5 min | 0.5 |
| Agent A (parallel) | ~1.5–3.0 min | 1.5–3.0 |
| Agent B (parallel) | ~1.5–3.0 min | 1.5–3.0 |
| Agent C (parallel) | ~1.5–3.0 min | 1.5–3.0 |
| **Total (wall-clock)** | ~2.0–3.5 min | **~5.0–9.5 min** |

Wall-clock time is short (parallel execution), but Actions minutes are additive (each parallel job consumes minutes independently). A three-agent swarm costs ~3–4× a single-agent invocation.

On the free tier, this allows roughly **200–400 swarm invocations per month**.

### Simulacrum Invocation

A three-specialist, three-round Logic Simulacrum:

| Phase | Jobs | Duration Each | Total Minutes |
|-------|------|---------------|---------------|
| Propose (3 specialists) | 3 | ~2 min | 6 |
| Critique (3 specialists) | 3 | ~2 min | 6 |
| Vote (3 specialists) | 3 | ~1.5 min | 4.5 |
| Decide (orchestrator) | 1 | ~2 min | 2 |
| **Total** | 10 jobs | | **~18.5 min** |

A single Simulacrum consumes roughly 15–20 Actions minutes. On the free tier, this allows approximately **100–130 debates per month** — assuming the entire budget is devoted to debates.

### Budget Allocation Strategy

A practical monthly budget on the free tier (2,000 minutes):

| Invocation Type | Allocation | Count |
|----------------|------------|-------|
| Single-agent issues | 60% (1,200 min) | ~400–800 |
| Swarm reviews | 25% (500 min) | ~50–100 |
| Simulacrum debates | 15% (300 min) | ~15–20 |
| **Total** | 100% | ~465–920 invocations |

---

## 3. LLM Token Budget

Agenticana's Model Router selects models across four tiers:

| Tier | Model Examples | Cost (per 1M input tokens) | Use Case |
|------|---------------|---------------------------|----------|
| **Lite** | GPT-4o-mini, Claude 3 Haiku | $0.15–0.25 | Simple queries, status checks |
| **Flash** | Gemini 2.0 Flash, Claude 3.5 Sonnet | $0.50–3.00 | Standard development tasks |
| **Pro** | GPT-4o, Claude 3.5 Opus | $2.50–15.00 | Complex reasoning, security audits |
| **Pro-Extended** | GPT-5.3, Claude 4 | $5.00–30.00 | Architecture debates, deep analysis |

### Token Consumption Estimates

| Invocation Type | Prompt Tokens | Completion Tokens | Total Tokens |
|----------------|--------------|-------------------|-------------|
| Simple issue (lite) | ~2,000 | ~1,000 | ~3,000 |
| Standard task (flash) | ~5,000 | ~3,000 | ~8,000 |
| Security audit (pro) | ~10,000 | ~5,000 | ~15,000 |
| Swarm (3 agents, flash) | ~15,000 | ~9,000 | ~24,000 |
| Simulacrum (3 specialists, 3 rounds) | ~80,000 | ~30,000 | ~110,000 |

### Monthly Token Budget Example

At 500 invocations/month with a mixed workload:

| Tier | Invocations | Tokens Each | Total Tokens | Estimated Cost |
|------|-------------|------------|-------------|---------------|
| Lite | 200 | 3K | 600K | $0.10–0.15 |
| Flash | 200 | 8K | 1.6M | $0.80–4.80 |
| Pro | 80 | 15K | 1.2M | $3.00–18.00 |
| Simulacrum (Pro-Extended) | 20 | 110K | 2.2M | $11.00–66.00 |
| **Total** | 500 | | 5.6M | **$15–89/month** |

The Model Router's cost-aware selection is not optional on a budget. Without it, defaulting every invocation to `pro` would cost 3–10× more. The Router's complexity scorer — which analyzes the task, estimates tokens, and selects the cheapest adequate model — pays for itself immediately.

---

## 4. Git Storage Budget

### Session Transcripts

Each JSONL session transcript: ~5–50 KB depending on conversation length.

At 500 invocations/month: ~2.5–25 MB/month of new session data.

### ReasoningBank Growth

Each decision entry: ~0.5–2 KB (without embeddings).

At 500 invocations/month with ~30% recording new decisions: ~75–300 KB/month.

### Attestation Records

Each PoW attestation: ~0.5–1 KB.

At 500 invocations/month: ~250–500 KB/month.

### Annual Projection

| Data Type | Monthly Growth | Annual Growth |
|-----------|---------------|---------------|
| Sessions | 2.5–25 MB | 30–300 MB |
| ReasoningBank | 75–300 KB | 0.9–3.6 MB |
| Attestations | 250–500 KB | 3–6 MB |
| **Total** | ~3–26 MB | **~34–310 MB** |

This is well within GitHub's repository size limits. Even at the high end, a year of Agenticana state is under 500 MB. The [GitHub Data Size Limits](../../docs/analysis/github-data-size-limits.md) analysis confirms that repositories up to 5 GB are operationally comfortable.

For very long-running deployments, periodic archival (moving old sessions to a separate branch or archive repo) keeps the active state lean.

---

## 5. The Model Router in the Fabric

The Model Router's complexity scoring algorithm becomes a critical Fabric component:

```
Task → Complexity Scorer → Token Estimator → Model Selection → Agent Execution
```

### Complexity Scoring Factors

| Factor | Low Complexity | Medium | High |
|--------|---------------|--------|------|
| Task scope | Single file | Multiple files | Architectural |
| Domain breadth | One domain | Two domains | Cross-cutting |
| Risk level | No side effects | File modifications | Security-sensitive |
| Context required | Current issue | Issue + recent history | Full repo + ReasoningBank |

### Scoring → Tier Mapping

| Complexity Score | Tier | Typical Agent |
|-----------------|------|---------------|
| 0–30 | Lite | Any (simple query) |
| 31–60 | Flash | Frontend, Backend, Debugger |
| 61–85 | Pro | Security Auditor, Performance Optimizer |
| 86–100 | Pro-Extended | Orchestrator (Simulacrum), Architecture |

### Fabric Integration

The dispatch manifest includes model tier constraints per agent. The Model Router may downgrade from the agent's default tier if the task complexity is low, or upgrade if the task requires deeper reasoning. The key constraint: **the Router's selection must be logged in the session transcript.** This makes the model choice auditable — if a task was handled poorly, the reviewer can check whether the Router selected an appropriate model.

---

## 6. Constraint Awareness

### Actions Runner Limits

| Resource | Limit | Impact |
|----------|-------|--------|
| RAM | 7 GB | Sufficient for all agent tasks. ReasoningBank fits in memory. |
| Disk | 14 GB | Sufficient. Repo + dependencies + runtime < 2 GB typically. |
| Job timeout | 6 hours | More than enough for any single-agent or swarm invocation. |
| Network | Egress only | LLM API calls require outbound HTTPS. No inbound connections. |
| Concurrency | OS/plan-dependent | Free: 20 concurrent jobs. Pro: 40. Enterprise: 500. |

### Rate Limits

| Service | Limit | Mitigation |
|---------|-------|-----------|
| GitHub API | 1,000 requests/hour (app) | Issue comments are low-volume. Not a concern. |
| LLM API | Provider-specific RPM/TPM | Model Router should respect rate limits and retry with backoff. |
| Git push | No hard limit, but concurrent pushes conflict | Push-retry-with-rebase loop with exponential backoff. |

### Budget Guardrails

The Fabric should enforce budget guardrails to prevent runaway cost:

1. **Maximum invocations per day** — configurable in `dispatch.yaml`. Default: 50.
2. **Maximum swarm size** — configurable. Default: 4 agents.
3. **Maximum Simulacrum rounds** — configurable. Default: 3.
4. **Token budget per invocation** — Model Router enforces. Default: 50K tokens.
5. **Monthly Actions minutes alert** — workflow that checks usage and warns at 80% of budget.

These guardrails are committed configuration — reviewable, diffable, and adjustable by PR. They prevent a misconfigured dispatch manifest or a flood of issues from exhausting the budget.

---

## 7. Summary

Agenticana on the Fabric is operationally viable but demands conscious cost management:

| Dimension | Status | Key Constraint |
|-----------|--------|----------------|
| Actions minutes | ✅ Viable | Free tier: ~500 mixed invocations/month |
| LLM tokens | ✅ Viable | Model Router essential — $15–89/month for 500 invocations |
| Git storage | ✅ Comfortable | ~34–310 MB/year, well within limits |
| Runner resources | ✅ No concern | All agent tasks fit within standard runner specs |
| Rate limits | ✅ No concern | Low-volume API usage per invocation |

The Model Router is not a nice-to-have. It is the mechanism that makes twenty agents economically feasible on GitHub Actions. Without it, the cost of defaulting to `pro` tier for every invocation would be prohibitive. With it, the cost scales predictably with task complexity, and the budget guardrails keep the system within bounds.

The Fabric adds a cost dimension that the local model does not have: Actions minutes. But it also adds a governance dimension that the local model cannot match: every cost decision is logged, every model selection is auditable, and the budget is a committed parameter that the team controls through the same PR process they use for everything else.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

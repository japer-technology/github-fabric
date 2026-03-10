# Cost and Constraints

> [OpenAI Node Index](./index.md) · [Transformation Map](./transformation-map.md) · [Vendor Lock-In as Governance Question](./vendor-lock-in-as-governance.md)

> Previous cost analyses measured Actions minutes, git storage, and build time. openai-node introduces a cost the Fabric has not encountered: metered external intelligence. Every token costs money, and the meter is controlled by the vendor.

---

## 1. The Cost Model Shift

In previous case studies, the Fabric's cost was primarily **compute time** — GitHub Actions minutes consumed during build, execution, and state commit. The LLM API cost was acknowledged but not centered.

openai-node reverses this. The SDK itself adds negligible cost (one npm dependency, zero runtime overhead). But every API call made through the SDK incurs **per-token charges** set by OpenAI. For a Fabric module that uses intelligence on every invocation, the API bill will dominate all other costs.

| Cost Component | Previous Case Studies | openai-node Analysis |
|---------------|----------------------|---------------------|
| **Actions minutes** | Primary cost driver | Still present, but secondary |
| **Git storage** | Secondary cost | Negligible — SDK adds ~200 KB to node_modules (not committed) |
| **Build time** | Significant for complex agents | Minimal — `npm ci` with cache is ~15–30s |
| **LLM API tokens** | Acknowledged | **Primary cost driver** — every API call is metered |
| **Rate limit headroom** | Not analyzed | New constraint — throughput limits may throttle the Fabric |

---

## 2. API Pricing

OpenAI's pricing is per-token, varying by model and capability. Representative rates (as of the SDK's current version targeting the API):

| Model | Input Tokens | Output Tokens | Context Window |
|-------|-------------|--------------|----------------|
| **GPT-4o** | $2.50 / 1M tokens | $10.00 / 1M tokens | 128K |
| **GPT-4o mini** | $0.15 / 1M tokens | $0.60 / 1M tokens | 128K |
| **o3-mini** | $1.10 / 1M tokens | $4.40 / 1M tokens | 200K |
| **GPT-4.1** | $2.00 / 1M tokens | $8.00 / 1M tokens | 1M |
| **GPT-4.1 mini** | $0.40 / 1M tokens | $1.60 / 1M tokens | 1M |
| **GPT-4.1 nano** | $0.10 / 1M tokens | $0.40 / 1M tokens | 1M |

*Prices are indicative and subject to change. Consult [OpenAI's pricing page](https://openai.com/pricing) for current rates.*

### Cost Per Fabric Invocation

A typical Fabric module invocation sends a system prompt (~500 tokens), context (~2,000 tokens), and receives a response (~1,000 tokens). Estimated cost per invocation:

| Model | Input Cost | Output Cost | Total per Invocation |
|-------|-----------|-------------|---------------------|
| GPT-4o | $0.006 | $0.010 | **~$0.016** |
| GPT-4o mini | $0.0004 | $0.0006 | **~$0.001** |
| o3-mini | $0.003 | $0.004 | **~$0.007** |
| GPT-4.1 nano | $0.0003 | $0.0004 | **~$0.0007** |

### Monthly Projection

Assuming 20 invocations per day (moderate usage):

| Model | Daily Cost | Monthly Cost | Annual Cost |
|-------|-----------|-------------|-------------|
| GPT-4o | $0.32 | **~$10** | ~$117 |
| GPT-4o mini | $0.02 | **~$0.60** | ~$7 |
| o3-mini | $0.14 | **~$4** | ~$51 |
| GPT-4.1 nano | $0.01 | **~$0.42** | ~$5 |

At moderate usage with GPT-4o mini or GPT-4.1 nano, the API cost is **negligible** — less than $1/month. With GPT-4o for complex reasoning, costs remain modest at ~$10/month. Heavy usage (100+ invocations/day) with premium models would approach $50–100/month.

---

## 3. Actions Minutes Budget

The SDK's impact on Actions minutes is minimal — it adds only the `npm ci` installation time and the API call latency.

| Phase | Duration | Actions Minutes |
|-------|----------|----------------|
| Runner setup + checkout | ~20s | ~0.3 |
| Node.js setup (cached) | ~10s | ~0.2 |
| `npm ci` (cached) | ~15–30s | ~0.3–0.5 |
| SDK API call (depends on model + tokens) | ~5–60s | ~0.1–1.0 |
| Response processing + state commit | ~10s | ~0.2 |
| **Total per invocation** | ~1–2 min | **~1–2 min** |

### Monthly Minutes at Different Usage Levels

| Usage | Invocations/Month | Minutes/Month | Free Tier (2,000) | Pro Tier (3,000) |
|-------|-------------------|---------------|-------------------|-----------------|
| Light (5/day) | ~150 | ~225 | 11% of budget | 8% |
| Moderate (20/day) | ~600 | ~900 | 45% of budget | 30% |
| Heavy (50/day) | ~1,500 | ~2,250 | **Exceeds budget** | 75% |
| Intensive (100/day) | ~3,000 | ~4,500 | **Exceeds budget** | **Exceeds budget** |

Unlike previous case studies where build time dominated, openai-node makes the API call duration the variable. A fast model response (GPT-4o mini, ~5s) costs far fewer minutes than a slow one (o3-mini with reasoning, ~60s).

---

## 4. Rate Limits

OpenAI enforces rate limits at multiple levels. The SDK handles 429 (rate limit) responses with automatic retry and exponential backoff, but the limits constrain throughput.

| Limit Type | Typical Value | Fabric Impact |
|-----------|--------------|---------------|
| **Requests per minute (RPM)** | 500–10,000 (varies by tier) | Not a constraint for typical Fabric usage (1 request per invocation) |
| **Tokens per minute (TPM)** | 30,000–10,000,000 (varies by tier) | Constrains complex prompts with large context |
| **Tokens per day (TPD)** | Varies by tier | Hard ceiling on daily intelligence usage |
| **Requests per day** | Varies by organization | Hard ceiling on daily invocations |

### SDK Retry Behavior

When rate-limited, the SDK:

1. Receives `429 Too Many Requests` with `Retry-After` header.
2. Waits the indicated duration (or exponential backoff).
3. Retries the request (up to `maxRetries`, default 2).
4. If all retries fail, throws `RateLimitError`.

The Fabric must handle the case where retries are exhausted:

```typescript
try {
  const response = await client.responses.create({ /* ... */ });
} catch (error) {
  if (error instanceof OpenAI.RateLimitError) {
    // Commit rate-limited state; retry in next invocation
  }
}
```

---

## 5. Bundle and Storage Impact

| Metric | Value |
|--------|-------|
| **npm package size** | ~2 MB (published) |
| **Installed size** | ~8 MB in `node_modules/` (not committed to git) |
| **Git impact** | Zero — `node_modules/` is gitignored |
| **package.json impact** | One line: `"openai": "6.27.0"` |
| **Lock file impact** | ~50–100 lines in lock file (one package, zero transitive deps) |
| **Type declarations** | ~2 MB of `.d.ts` files (used at build time, not committed) |

The storage impact is negligible. openai-node has zero runtime dependencies, which means:
- No transitive dependency tree bloat
- No version conflict risk with other Fabric dependencies
- No supply-chain attack surface beyond the single package

---

## 6. Cost Optimization Strategies

| Strategy | Savings | Tradeoff |
|----------|---------|----------|
| **Use GPT-4o mini or GPT-4.1 nano for routine tasks** | 10–20× cheaper than GPT-4o | Lower reasoning capability for complex tasks |
| **Cache common responses** | Eliminates redundant API calls | Stale results for dynamic content |
| **Minimize prompt context** | Fewer input tokens per call | Less context for the model to reason about |
| **Use streaming for long responses** | Detect errors early, abort incomplete calls | Slightly more complex handling |
| **Set aggressive timeouts** | Prevents runaway API calls from consuming minutes | May abort legitimate slow responses |
| **Batch related operations** | Fewer API calls, shared context | Delayed processing |
| **Use embeddings for search** | One-time embedding cost, fast local search | Requires embedding storage |
| **Pin model version** | Predictable cost and behavior | Miss improvements in newer versions |

### The Model Selection Matrix

| Task Complexity | Recommended Model | Approximate Cost per Call |
|-----------------|-------------------|--------------------------|
| Simple (summarize, classify, format) | GPT-4.1 nano / GPT-4o mini | < $0.001 |
| Moderate (code review, analysis) | GPT-4o mini / GPT-4.1 mini | $0.001–0.005 |
| Complex (architecture decisions, multi-step reasoning) | GPT-4o / GPT-4.1 | $0.01–0.05 |
| Advanced reasoning | o3-mini | $0.005–0.02 |

---

## 7. Comparison with Previous Case Studies

| Cost Dimension | NanoClaw | OpenClaw | openai-node |
|---------------|----------|----------|-------------|
| **Primary cost** | Actions minutes (build + run) | Actions minutes (complex build) | API tokens (per-call metering) |
| **Build overhead** | ~45s cold, ~15s warm | Minutes (multi-stage build) | ~15–30s (`npm ci`) |
| **Runtime cost** | LLM API (bundled with agent) | LLM API (bundled with gateway) | LLM API (the SDK *is* the API interface) |
| **Storage cost** | Group memory in git | Gateway state in git | Negligible — SDK not committed |
| **Dependency risk** | 6 deps | 70+ deps | 0 deps (+ 2 optional peers) |
| **Update cost** | Git pull + rebuild | Selective merge + rebuild | Version bump in `package.json` |
| **Minimum viable cost** | ~$0 (free tier minutes) | ~$0 (free tier minutes) | **Depends on API tier** — free tier is limited |

The critical difference: NanoClaw and OpenClaw had *optional* API costs (you could self-host the LLM). openai-node's cost is *inherent* — the SDK exists to call a paid API. The Fabric cannot use openai-node for free unless it points `baseURL` at a free-tier or self-hosted endpoint.

---

## 8. Summary

| Constraint | Value | Impact |
|-----------|-------|--------|
| API cost per invocation | $0.001–$0.05 (model-dependent) | Primary cost at scale — choose models deliberately |
| Actions minutes per invocation | ~1–2 min | Secondary — dominated by API call latency |
| Rate limits | 500–10,000 RPM (tier-dependent) | Rarely hit in typical Fabric usage |
| Bundle size | ~8 MB installed, 0 committed | Negligible storage impact |
| Dependency count | 0 runtime + 2 optional peers | Lowest supply-chain risk of any Fabric dependency |
| Monthly cost at moderate usage | $0.60–$10 (model-dependent) | Affordable for individual developers |
| Monthly cost at heavy usage | $5–$100 (model-dependent) | Requires budgeting and model selection strategy |

openai-node introduces the Fabric's first **externally metered cost**. Previous constraints (Actions minutes, git storage) are platform costs controlled by GitHub's tiers. API token cost is controlled by OpenAI's pricing — a variable the Fabric cannot influence. The governance response is model selection (use the cheapest model that provides adequate intelligence), context minimization (send only what the model needs), and budget monitoring (track token usage across invocations).

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

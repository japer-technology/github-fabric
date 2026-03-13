# Model Marketplace and Governance

> [Kilocode Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> Kilocode offers 500+ AI models through a unified interface — any provider, any model, switchable at any time. The Fabric pins a single model per committed configuration. When the agent is a marketplace and the Fabric is a governor, the question is: who decides which model thinks?

---

## 1. The Marketplace Model

Kilocode's model access is layered:

```
User selects model
  → Kilo Gateway (OAuth + credits + routing)
    → OpenRouter (aggregation of 300+ models)
      → Provider API (OpenAI, Anthropic, Google, etc.)

        — OR —

  → Direct provider API (BYOK — Bring Your Own Key)
    → @ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google, etc.
```

The Vercel AI SDK provides the unified interface. It abstracts provider-specific APIs — chat completions, tool calling, streaming, token counting — behind a common TypeScript interface. Kilocode wraps this with:

- **Kilo Gateway** — OAuth authentication, credits management, provider routing, rate limiting
- **Model discovery** — Auto-detection of tool-capable models, capability introspection
- **Dynamic switching** — Users can change models mid-conversation
- **Cost tracking** — Per-token cost reporting for every provider

This is a **marketplace** — not a fixed provider relationship. The user browses 500+ models, picks one, and the platform routes the request through the appropriate provider. Credits are deducted transparently, matching provider rates.

---

## 2. The Fabric's Model Discipline

The Fabric takes the opposite approach. Model selection is not a runtime choice — it is a **committed configuration**:

```yaml
# .github-fabric/config.yml
model: anthropic/claude-sonnet-4-20250514
thinking: medium
temperature: 0.0
```

The model is pinned. Every issue processed by the Fabric uses the same model, specified in committed configuration. Changing the model requires a commit, which requires a PR, which requires review. The model is not just a parameter — it is an **auditable decision**.

This discipline exists because the Fabric's governance model requires **reproducibility**. If the same issue is processed twice with the same committed state, the same model should be used. Non-determinism in LLM outputs is already a governance challenge; adding model variability would make reproducibility impossible.

---

## 3. The Tension

Kilocode's marketplace and the Fabric's discipline represent opposing design philosophies:

| Dimension | Kilocode Marketplace | Fabric Discipline |
|-----------|---------------------|-------------------|
| **Model selection** | Runtime choice | Committed configuration |
| **Provider** | Any of 500+ | Pinned in config |
| **Switching** | Mid-conversation | Requires PR review |
| **Authentication** | OAuth + credits or BYOK | Secrets in repo settings |
| **Cost visibility** | Real-time per-token | Post-run metadata committed |
| **Responsibility** | User decides | Configuration decides |

The tension is not technical — both systems can call the same LLM APIs. The tension is **governance**: who decides which model reasons about the repository?

In Kilocode's marketplace, the user decides. In the Fabric, the committed configuration decides. These represent different trust models:

- **Kilocode:** Trust the user to choose appropriately. Provide choice. Let them experiment.
- **Fabric:** Trust the configuration. Model choice is a team decision, audited in the commit history. No experiments in production.

---

## 4. Composition: Governed Marketplace

The resolution is not to choose one approach but to compose them:

```yaml
# .github-fabric/config.yml
model:
  primary: anthropic/claude-sonnet-4-20250514
  fallback: openai/gpt-4o
  provider: kilo-gateway  # Route through Kilo's infrastructure
  
  # Marketplace constraints (from Fabric governance)
  allowed_providers:
    - anthropic
    - openai
    - google
  max_cost_per_issue: 2.00
  require_tool_support: true
```

In this composed model:

1. **The Fabric governs the model selection** — The primary model is committed. Fallback rules are committed. Allowed providers are committed. Cost limits are committed.
2. **Kilocode provides the routing** — The Kilo Gateway handles authentication, provider negotiation, rate limiting, and cost tracking. The Vercel AI SDK handles the API abstraction.
3. **The configuration is auditable** — Any change to model selection appears in the commit history. The team can review why the model changed, when, and by whom.

This gives the Fabric the benefits of Kilocode's marketplace (provider abstraction, fallback routing, cost tracking) while maintaining the Fabric's governance requirements (committed configuration, auditability, reproducibility).

---

## 5. The Gateway Question

The Kilo Gateway adds a layer between the Fabric and the LLM providers:

```
Fabric Action → Kilo Gateway → Provider API
              ↑
       OAuth + credits + routing
```

This layer provides convenience (no per-provider API keys needed, single authentication, credits-based billing) but introduces governance concerns:

| Concern | Description | Mitigation |
|---------|-------------|------------|
| **Third-party dependency** | The Fabric depends on Kilo's infrastructure for model access | Fallback to direct provider APIs (BYOK) |
| **Credential routing** | The Gateway sees all prompts and responses | Use direct API keys for sensitive repositories |
| **Cost opacity** | Credits pricing may not match raw provider pricing | Kilo commits to transparent, matching rates |
| **Availability** | Gateway downtime blocks the Fabric | Committed fallback configuration |
| **Data retention** | Gateway may log or retain request data | Review Kilo's data policy; use BYOK for sensitive work |

The Fabric's governance model requires that every dependency is explicit and auditable. If the Kilo Gateway is used, the configuration must declare it. If it is bypassed for sensitive repositories, the configuration must declare that too.

---

## 6. Provider Abstraction vs. Provider Governance

Kilocode's Vercel AI SDK integration abstracts 20+ provider APIs into a single interface:

```typescript
// Same code, any provider
const response = await generateText({
  model: openai("gpt-4o"),        // or anthropic("claude-sonnet-4-20250514")
  messages: [...],                  // or google("gemini-2.5-pro")
  tools: [...],
});
```

This abstraction is powerful — it means provider-specific quirks (API formats, auth methods, streaming protocols, tool calling conventions) are handled by the SDK. The Fabric's agent code does not need to know which provider it is talking to.

But abstraction and governance serve different purposes:

| Purpose | Provider Abstraction (AI SDK) | Provider Governance (Fabric) |
|---------|------------------------------|------------------------------|
| **Hides** | API differences | Nothing — everything is visible |
| **Enables** | Seamless model switching | Auditable model selection |
| **Enforces** | Uniform interface | Committed configuration |
| **Tracks** | Token usage, cost | Token usage, cost, model identity, provider identity |

The Fabric should use the abstraction while adding governance on top. The AI SDK makes it easy to switch models; the Fabric's committed configuration makes it deliberate. The composition is: **easy to switch, hard to switch silently**.

---

## 7. Cost Implications

Model choice has direct cost implications. Kilocode's marketplace exposes this explicitly:

| Model | Provider | Input Cost (per 1M tokens) | Output Cost (per 1M tokens) |
|-------|----------|---------------------------|----------------------------|
| Claude Sonnet 4 | Anthropic | $3.00 | $15.00 |
| GPT-4o | OpenAI | $2.50 | $10.00 |
| Gemini 2.5 Pro | Google | $1.25 | $10.00 |
| Claude Haiku 3.5 | Anthropic | $0.80 | $4.00 |

The Fabric's governance should include cost governance. A committed model configuration implicitly commits to a cost profile. Changing to a more expensive model should be a deliberate decision, visible in the commit history:

```
commit abc123 — "Upgrade model to claude-sonnet-4 for improved code generation"
commit def456 — "Switch to haiku-3.5 for triage labels to reduce costs"
```

This cost governance is something Kilocode's marketplace enables (via per-token tracking) but does not enforce. The Fabric adds the enforcement layer.

---

## 8. Summary

| Dimension | Kilocode (Marketplace) | Fabric (Governed) | Composed |
|-----------|----------------------|-------------------|----------|
| **Model selection** | 500+ models, user chooses | Committed configuration | Governed selection from marketplace |
| **Switching** | Instant, mid-conversation | Requires commit + review | Easy to switch, hard to switch silently |
| **Provider routing** | Kilo Gateway + OpenRouter | Direct or gateway (configured) | Gateway as optional, auditable layer |
| **Cost tracking** | Real-time per-token | Committed metadata | Cost governance through configuration |
| **Authentication** | OAuth + credits or BYOK | Secrets in repo settings | Committed auth method selection |
| **Fallback** | Provider failover | Committed fallback chain | Governed failover with priority order |
| **Reproducibility** | Model can vary per request | Model pinned per config | Auditable model history |

The marketplace and the governor are complementary. Kilocode provides the breadth — access to every model from every provider. The Fabric provides the depth — deliberate, auditable, governed model selection. Together, they produce **accountable model access**: the agent can use any model, but which model it uses is a committed, reviewable, reversible decision.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

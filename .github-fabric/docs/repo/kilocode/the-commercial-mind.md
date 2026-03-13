# The Commercial Mind

> [Kilocode Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [How Much?](../../question-how-much.md)

> Kilocode has its own economy: credits, gateway fees, telemetry, analytics. The Fabric has no economy — it has governance. When the agent is a business and the Fabric is a governor, the question is whether commercial incentives and governance requirements can coexist without corruption.

---

## 1. The Kilo Economy

Kilocode operates a commercial layer on top of open-source code:

```
User (free or paid)
  → Kilo Gateway (OAuth device flow)
    → Credits system (transparent pricing matching provider rates)
      → OpenRouter or direct provider API
        → LLM response
          → PostHog analytics event
            → OpenTelemetry trace span
```

The economy has several components:

### 1.1. Credits

Users purchase Kilo credits and spend them on model usage. The pricing is transparent: Kilo credits match the underlying provider rates (e.g., if Claude Sonnet costs $3/$15 per million tokens input/output, Kilo charges the same). Revenue comes from volume, not markup.

### 1.2. Gateway Authentication

The Kilo Gateway provides OAuth device flow authentication. Users authenticate via their browser, receive a device token, and the CLI/extension uses this token for all subsequent requests. This eliminates the need for users to manage individual provider API keys.

### 1.3. Telemetry Pipeline

Kilocode collects analytics via PostHog (product analytics) and OpenTelemetry (distributed tracing). The telemetry tracks:

- Session events (create, prompt, response)
- Model usage (which models, how many tokens)
- Tool usage (which tools, how often)
- Error events (failures, timeouts)
- Feature usage (which modes, which clients)

### 1.4. The Revenue Model

The business model is straightforward: users pay for AI model access through Kilo credits. The platform is free. The VS Code extension is free. The CLI is free. Revenue comes from the credits passthrough.

---

## 2. The Fabric's Governance Economy

The Fabric has no revenue model. Its economy is measured in different units:

| Currency | What It Measures |
|----------|-----------------|
| **Actions minutes** | Compute time consumed per issue |
| **Tokens** | LLM reasoning consumed per issue |
| **Commits** | State mutations recorded per issue |
| **Storage** | Repository size (code + session state + metadata) |
| **Review time** | Human hours spent reviewing agent output |

The Fabric's "cost" is borne by whoever owns the repository — through GitHub's billing for Actions, the LLM provider's billing for tokens, and the team's time for review. There is no intermediary, no gateway, no credits system.

---

## 3. The Tension

When Kilocode operates inside the Fabric, two economies collide:

| Dimension | Kilo Economy | Fabric Economy |
|-----------|-------------|---------------|
| **Who pays** | Individual user (credits) | Repository owner (Actions + tokens) |
| **What is metered** | Tokens through gateway | Actions minutes + tokens + storage |
| **Who benefits** | Kilo, Inc. (revenue) | The team (resolved issues) |
| **Incentive alignment** | More usage → more revenue | Efficient resolution → lower cost |
| **Transparency** | Credit balance visible to user | Actions billing visible to repo owner |
| **Governance** | Terms of service | Committed configuration |

The deepest tension is **incentive alignment**. Kilocode (as a business) benefits from more usage — more tokens, more sessions, more models. The Fabric benefits from **efficient** usage — fewer tokens per resolved issue, faster resolution, lower cost.

This is not necessarily a conflict. If Kilocode's platform makes agents more effective (better tool calling, smarter model routing, fewer wasted tokens), then more usage of Kilocode produces more efficient issue resolution. But the Fabric must verify this — it cannot take it on faith.

---

## 4. Telemetry and Governance

Kilocode's telemetry pipeline presents a specific governance question: **what data leaves the repository?**

### 4.1. What PostHog Collects

PostHog is a product analytics platform. Kilocode sends events including:
- Session creation and usage
- Model selection and token counts
- Tool invocations and outcomes
- Error events and stack traces
- Feature flags and experiments

### 4.2. The Governance Concern

The Fabric's model assumes that the repository is the canonical source of truth. Data about agent behavior should be in the commit history — not in an external analytics platform. If PostHog knows which models the agent uses, which tools it calls, and what errors it encounters, then there is a shadow record of agent behavior outside the repository.

### 4.3. Resolution

The Fabric should govern telemetry through committed configuration:

```yaml
# .github-fabric/config.yml
telemetry:
  posthog: disabled        # No external analytics
  opentelemetry: disabled  # No external tracing
  
  # Fabric-native telemetry (committed to repo)
  fabric_telemetry:
    enabled: true
    record_tokens: true
    record_cost: true
    record_model: true
    record_tools: true
    commit_metadata: true  # Write telemetry as committed JSON
```

If the Fabric disables external telemetry and records its own telemetry as committed metadata, the governance requirement is satisfied: all data about agent behavior lives in the repository. Kilocode's code still runs — it just does not phone home.

---

## 5. The Gateway as Trust Boundary

The Kilo Gateway sits between the agent and the LLM providers. Every prompt and every response passes through it. This creates a trust boundary:

```
Repository (committed state)
  → Actions runner
    → Kilocode agent
      → Kilo Gateway ← TRUST BOUNDARY
        → Provider API
          → LLM response
```

Across this boundary:
- **Outbound:** The agent's prompt (which may contain repository code, issue descriptions, user data)
- **Inbound:** The LLM's response (which contains reasoning about the repository)

The Fabric must decide whether to trust this boundary. The options:

| Approach | Trust Level | Trade-off |
|----------|-----------|-----------|
| **Use Kilo Gateway** | High trust in Kilo | Convenience (no API keys), credits system, cost tracking |
| **Use direct API (BYOK)** | Trust only the provider | More setup, no credits, no aggregation |
| **Use both** | Tiered trust | Gateway for non-sensitive repos, BYOK for sensitive ones |

The committed configuration should declare which approach is used:

```yaml
# .github-fabric/config.yml
provider:
  mode: byok                    # or "kilo-gateway"
  api_key_secret: ANTHROPIC_KEY # GitHub secret name
```

---

## 6. Open Source and Commercial Coexistence

Kilocode is MIT licensed. The code is fully open. But the platform includes commercial components:

| Component | License | Commercial? |
|-----------|---------|------------|
| Core agent (`@kilocode/cli`) | MIT | No |
| VS Code extension (`kilo-code`) | MIT | No |
| SDK (`@kilocode/sdk`) | MIT | No |
| UI components (`@kilocode/kilo-ui`) | MIT | No |
| Gateway (`@kilocode/kilo-gateway`) | MIT | **Yes** (connects to Kilo's servers) |
| Telemetry (`@kilocode/kilo-telemetry`) | MIT | **Yes** (sends data to PostHog) |
| Documentation (`@kilocode/kilo-docs`) | MIT | No |

The commercial components are **optional**. A user (or the Fabric) can use the core agent without the gateway or telemetry. The MIT license permits this explicitly.

For the Fabric, this means:
- **The agent is free.** The core reasoning loop, tool system, and session management have no commercial dependency.
- **The platform is optional.** The gateway and telemetry can be disabled or replaced.
- **The governance is independent.** The Fabric's governance does not depend on Kilo's commercial infrastructure.

---

## 7. Cost Profile: Kilocode in the Fabric

Running Kilocode inside a Fabric GitHub Action has a specific cost profile:

| Cost Component | Source | Estimate per Issue |
|----------------|--------|-------------------|
| **Actions minutes** | GitHub billing | 2-10 min ($0.008/min Linux) = $0.016–$0.08 |
| **Bun install** | Download + cache | ~30s (cached) to ~2min (cold) |
| **LLM tokens** | Provider or Kilo credits | 10K-100K tokens = $0.03–$1.50 (model-dependent) |
| **Git storage** | Repository size increase | Negligible per issue |
| **Kilo Gateway** | Optional intermediary | $0 (matching rates) or $0 (BYOK) |

The dominant cost is **LLM tokens** — the same as every other Fabric agent. The Kilocode-specific overhead (Bun install, server startup) is small relative to the reasoning cost.

Cost governance follows the same pattern as model governance:

```yaml
# .github-fabric/config.yml
cost:
  max_tokens_per_issue: 100000
  max_cost_per_issue: 2.00
  budget_period: monthly
  budget_limit: 100.00
  alert_threshold: 0.80  # Alert at 80% of budget
```

---

## 8. Summary

| Dimension | Kilo Economy | Fabric Governance | Composed |
|-----------|-------------|-------------------|----------|
| **Revenue** | Credits passthrough | None | Fabric uses Kilo's models, governs cost |
| **Telemetry** | PostHog + OTel | Committed metadata | External telemetry disabled; Fabric records own |
| **Authentication** | OAuth + device flow | GitHub secrets | Committed auth method selection |
| **Trust boundary** | Kilo Gateway | Repository boundary | Governed gateway usage or BYOK |
| **Cost tracking** | Real-time credits | Committed cost metadata | Budget limits in committed config |
| **Incentive** | More usage | Efficient usage | Governance constrains usage to efficient levels |
| **Open source** | MIT (code) + commercial (platform) | MIT (governance) | Agent is free; platform is optional |

The commercial mind and the governed mind are not incompatible. The Fabric can use Kilocode's open-source agent while declining its commercial platform. Or it can use the commercial platform while governing the boundary through committed configuration. The key insight: **commercialism is not the enemy of governance — opacity is.** As long as every commercial interaction is declared, configured, and auditable, the Fabric's governance model holds.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

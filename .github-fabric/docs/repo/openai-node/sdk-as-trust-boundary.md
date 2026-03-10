# The SDK as Trust Boundary

> [OpenAI Node Index](./index.md) · [The Four Laws of AI](../../docs/the-four-laws-of-ai.md) · [Governance Alignment](./governance-alignment.md)

> openai-node is the membrane between the Fabric's repository-sovereign world and OpenAI's cloud-hosted inference. Every secret, every prompt, every token crosses this boundary. The Fabric controls everything on one side. OpenAI controls everything on the other. The SDK is the line between.

---

## 1. The Boundary

The Fabric's security model assumes repository-scoped isolation. State lives in git. Secrets live in GitHub encrypted secrets. Execution happens in ephemeral runners. The repository owner controls the entire surface.

openai-node punches a hole through this isolation. Every API call sends data from the repository's controlled environment to OpenAI's servers — and receives data back. The SDK is the membrane through which this exchange occurs.

```
┌─────────────────────────────────────────────┐
│  FABRIC SOVEREIGN ZONE                       │
│                                              │
│  Repository ─── Secrets ─── Runner           │
│      │              │           │            │
│      ▼              ▼           ▼            │
│  ┌──────────────────────────────────┐        │
│  │  openai-node SDK                 │        │
│  │  ┌────────────────────────────┐  │        │
│  │  │ API Key (from secret)      │  │        │
│  │  │ Prompt (from agent logic)  │──┼────►   │
│  │  │ Parameters (model, temp)   │  │   HTTPS│
│  │  └────────────────────────────┘  │        │
│  └──────────────────────────────────┘        │
│                                              │
└──────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  VENDOR ZONE (OpenAI)                        │
│                                              │
│  API Gateway ─── Inference ─── Logging       │
│                                              │
└─────────────────────────────────────────────┘
```

Everything above the line is under repository governance. Everything below is under vendor governance. The SDK is the line.

---

## 2. What Crosses the Boundary

### 2.1 Outbound (Fabric → OpenAI)

| Data Type | Example | Sensitivity |
|-----------|---------|-------------|
| **API key** | `sk-proj-...` | Critical — grants billing access and API usage |
| **Prompts** | System instructions, user messages, agent persona | High — may contain proprietary logic or personal data |
| **File content** | Uploaded files for fine-tuning, vision input, audio | High — may contain sensitive documents |
| **Function definitions** | Tool schemas with parameter descriptions | Medium — reveals agent capabilities |
| **Conversation history** | Multi-turn message arrays | High — accumulates context over interactions |
| **Model selection** | `gpt-5.2`, `o3-mini`, `gpt-realtime` | Low — but reveals capability requirements |
| **Metadata** | Organization ID, project ID, user tracking | Medium — operational telemetry |

### 2.2 Inbound (OpenAI → Fabric)

| Data Type | Example | Sensitivity |
|-----------|---------|-------------|
| **Completions** | Generated text, structured output | Medium — may be committed to git |
| **Streaming events** | SSE chunks during generation | Medium — transient but may be logged |
| **Embeddings** | Float vectors | Low — derivative of input |
| **Error responses** | Rate limit errors, content filter results | Low — but may reveal usage patterns |
| **Usage metadata** | Token counts, processing time | Low — but accumulates to cost information |
| **Webhook payloads** | Async completion notifications | Medium — triggers Fabric actions |

### 2.3 The Critical Observation

The most sensitive data flows **outbound**. The Fabric sends its secrets (API keys), its reasoning (prompts), and its context (conversation history) to the vendor. The vendor returns generated content — important, but replaceable. If the Fabric loses access to OpenAI, it loses the ability to generate new responses. But the prompts, the reasoning patterns, and the accumulated context remain in the repository.

This asymmetry matters: **the Fabric gives more than it gets.** The intelligence it receives is stateless and ephemeral. The context it sends may contain the repository's most sensitive content.

---

## 3. Credential Management

### 3.1 How the SDK Handles Keys

openai-node loads the API key through a defined precedence:

| Source | Priority | Fabric Expression |
|--------|----------|-------------------|
| Constructor argument (`apiKey: '...'`) | Highest | Explicit in code — **never do this** |
| Environment variable (`OPENAI_API_KEY`) | Default | GitHub encrypted secret → workflow env |
| Azure AD token provider | Azure only | Azure identity integration |

The SDK also supports organization and project scoping:

```typescript
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,     // from GitHub secret
  organization: process.env.OPENAI_ORG,   // optional scoping
  project: process.env.OPENAI_PROJECT,    // optional scoping
});
```

### 3.2 Fabric Governance for Credentials

| Requirement | Implementation |
|------------|----------------|
| Keys never in code | Use `${{ secrets.OPENAI_API_KEY }}` in workflow files |
| Keys never in logs | openai-node redacts auth headers in debug logging |
| Keys scoped to minimum privilege | Use project-scoped keys, not organization-wide |
| Keys rotatable without code change | Environment variable injection — rotate the secret, not the code |
| Keys auditable | GitHub audit log records secret access |

The SDK's credential handling aligns well with the Fabric's model. The key risk is **accidental logging**: if a Fabric module logs the client configuration or raw request headers, the API key could appear in Actions logs. openai-node mitigates this by redacting sensitive headers in its debug output, but the Fabric must ensure its own logging respects the same boundary.

---

## 4. Prompt Sensitivity

The prompts a Fabric module sends through openai-node may contain:

| Content Category | Example | Risk |
|-----------------|---------|------|
| **Agent persona** | "You are a coding assistant for the github-fabric repository" | Low — public repository |
| **Repository context** | File contents, issue text, PR diffs | Varies — may include proprietary code |
| **User instructions** | Issue body from a human user | Medium — may contain personal information |
| **Accumulated memory** | Previous interaction summaries from git history | Medium — contextual but potentially sensitive |
| **Configuration** | DEFCON level, governance rules, behavioral constraints | Low — but reveals security posture |

The Fabric has no mechanism to filter or redact prompts before they cross the SDK boundary. Every call to `client.responses.create()` or `client.chat.completions.create()` sends the full prompt to OpenAI's servers. The governance response is **classification and routing**:

| Classification | Action |
|---------------|--------|
| Public repository content | Route through openai-node — low sensitivity |
| Private repository content | Route through openai-node with awareness — or route to local inference |
| Personal user data | Evaluate necessity — minimize context sent |
| Security-sensitive content | Never include in prompts — use separate channels |

---

## 5. Webhook Verification

openai-node includes webhook signature verification — the reverse trust boundary:

```typescript
const event = client.webhooks.unwrap(body, headers);
// or
client.webhooks.verifySignature(body, headers);
```

This is the only point where OpenAI sends unsolicited data *to* the Fabric. Webhook verification ensures that incoming payloads were actually sent by OpenAI, preventing injection attacks where a third party impersonates the vendor.

| Webhook Security | openai-node Mechanism | Fabric Expression |
|-----------------|----------------------|-------------------|
| Signature verification | HMAC signature check on raw body | Mandatory — reject unverified webhooks |
| Secret management | `OPENAI_WEBHOOK_SECRET` env var | GitHub encrypted secret |
| Payload integrity | Raw body verified before parsing | Never parse before verifying |
| Replay protection | Timestamp validation (implementation-dependent) | Additional layer if needed |

---

## 6. The Logging Boundary

openai-node supports configurable log levels (`debug`, `info`, `warn`, `error`, `off`) and custom loggers. At `debug` level, the SDK logs full HTTP requests and responses, including headers and bodies.

| Log Level | What Is Logged | Risk in Fabric |
|-----------|---------------|----------------|
| `off` | Nothing | Safe — but blind to errors |
| `error` | Error responses only | Safe — minimal exposure |
| `warn` | Warnings + errors | Safe — default level |
| `info` | Request metadata | Low risk — URLs and status codes |
| `debug` | Full request/response bodies | **High risk** — prompts, completions, and potentially secrets appear in logs |

The Fabric must ensure that Actions workflow logs do not capture debug-level SDK output. GitHub Actions logs are visible to repository collaborators and may be retained. The governance rule: **never run the SDK at debug level in production workflows.**

---

## 7. Summary

| Boundary Concern | Risk | Mitigation |
|-----------------|------|------------|
| API key exposure | Critical — grants billing access | GitHub encrypted secrets; never in code; rotatable |
| Prompt leakage | High — sends repository context to vendor | Classify prompts; minimize sensitive context; consider local inference for private data |
| Logging exposure | High at debug level | Never use debug logging in production workflows |
| Webhook injection | Medium — unsolicited inbound data | Mandatory signature verification before processing |
| Response integrity | Low — generated content is the output | Validate structured output with Zod schemas |
| Network interception | Low — HTTPS by default | Standard TLS protections apply |
| Vendor data retention | Medium — governed by OpenAI's policies | Understand and document the vendor's data handling policies |

The SDK is not a vulnerability. It is a **governed boundary** — a point where the Fabric's security model must explicitly account for the transition from sovereign to vendor-controlled space. Every API call is a deliberate crossing of this boundary, and the Fabric's governance must ensure that each crossing is intentional, minimal, and auditable.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

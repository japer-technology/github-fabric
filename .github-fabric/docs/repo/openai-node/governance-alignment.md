# Governance Alignment

> [OpenAI Node Index](./index.md) · [The Four Laws of AI](../../docs/the-four-laws-of-ai.md) · [The SDK as Trust Boundary](./sdk-as-trust-boundary.md)

> openai-node is not an agent governed by the Four Laws. It is a dependency through which governed agents access intelligence. The governance question is not "how does the SDK behave?" but "how does the Fabric govern what crosses the SDK boundary?"

---

## 1. Two Governance Models

### The Fabric's Model

The Fabric governs agent behavior through three interlocking mechanisms:

1. **The Four Laws of AI** — behavioral hierarchy: Zeroth (protect humanity), First (do no harm), Second (obey the human), Third (preserve integrity).
2. **DEFCON Readiness Levels** — five operational states constraining what the agent can do based on risk posture.
3. **GitHub's Native Controls** — collaborator permissions, branch protection, CODEOWNERS, encrypted secrets, audit logs.

### The SDK's Model

openai-node has no governance model of its own. It is a stateless HTTP client. Its "behavior" is entirely determined by the parameters the caller provides and the responses the API returns. The SDK does not:

- Make decisions about what to send
- Filter or redact outbound content
- Refuse to call certain endpoints
- Enforce rate limits (it retries on 429, but does not throttle proactively)
- Log selectively based on data sensitivity

The SDK is a **transparent conduit**. Governance must be applied by the caller (the Fabric module) and the receiver (OpenAI's API), not by the conduit itself.

---

## 2. The Four Laws Applied

### Zeroth Law: Protect Humanity

> No single entity shall monopolize or gatekeep access to AI tools.

| Concern | Assessment |
|---------|-----------|
| Does openai-node create monopolistic dependency? | Yes, partially — it binds the Fabric to OpenAI's API protocol. Mitigated by `baseURL` override and the adapter pattern (see [Vendor Lock-In](./vendor-lock-in-as-governance.md)). |
| Is the SDK open source? | Yes — Apache-2.0. The code is fully inspectable and forkable. |
| Does the SDK enable surveillance? | No — the SDK sends what the caller sends. Surveillance risk is in the caller's prompt construction, not the SDK. |
| Does the SDK support interoperability? | Partially — `baseURL` allows alternative endpoints. The type system is OpenAI-specific. |

**Verdict:** The Zeroth Law tension exists at the *service* level (OpenAI's API), not at the *SDK* level. openai-node is open and inspectable. The vendor dependency is a governance concern addressed through architecture (adapter pattern), not through SDK modification.

### First Law: Do No Harm

> The agent must never cause harm to humans or their communities.

| Concern | Assessment |
|---------|-----------|
| Can the SDK leak sensitive data? | Yes — it sends whatever the caller provides. The SDK does not filter prompts. |
| Can the SDK expose credentials? | Mitigated — debug logging redacts auth headers. But accidental logging of the client config object could expose keys. |
| Can the SDK be used to generate harmful content? | The SDK relays the API's content filter decisions. OpenAI's moderation applies server-side. |
| Can the SDK be exploited? | Low risk — zero runtime dependencies, minimal attack surface. |

**Verdict:** The First Law applies to the **caller**, not the SDK. The Fabric module that constructs prompts must ensure it does not send harmful instructions or sensitive data unnecessarily. The SDK itself is neutral — it transmits what it is given.

### Second Law: Obey the Human

> The agent must faithfully execute the human operator's intentions.

| Concern | Assessment |
|---------|-----------|
| Does the SDK faithfully transmit the caller's request? | Yes — it serializes parameters to HTTP and returns the response. No transformation or interpretation. |
| Does the SDK substitute its own judgment? | No — it has no judgment. It is a typed HTTP client. |
| Does the SDK provide transparent behavior? | Yes — configurable logging, typed errors, raw response access. |

**Verdict:** The Second Law is trivially satisfied. The SDK does exactly what it is told. The governance question is upstream: does the *Fabric module* faithfully interpret the human's issue or command before constructing the API call?

### Third Law: Preserve Integrity

> The agent must maintain platform security and trustworthiness.

| Concern | Assessment |
|---------|-----------|
| Does the SDK protect secrets? | Partially — redacts auth headers in logs, but does not prevent accidental exposure by callers. |
| Does the SDK support audit? | Yes — every API call can be logged (at info or debug level). |
| Does the SDK handle errors gracefully? | Yes — typed error hierarchy (`APIError`, `AuthenticationError`, `RateLimitError`, `InternalServerError`). |
| Does the SDK preserve availability? | Yes — automatic retries with exponential backoff on transient errors. |
| Does the SDK resist tampering? | Standard HTTPS — TLS protects the wire. No additional signing. |

**Verdict:** The SDK provides the *mechanisms* for integrity (logging, error handling, retries, TLS). The Fabric must *use* these mechanisms correctly — configure appropriate log levels, catch and commit error states, set timeouts and retry limits.

---

## 3. DEFCON Levels and SDK Usage

The Fabric's DEFCON levels constrain agent behavior based on risk posture. Applied to SDK usage:

| DEFCON Level | State | SDK Usage Constraint |
|-------------|-------|---------------------|
| **DEFCON 5** | Routine | Full SDK access — all endpoints, streaming, structured output |
| **DEFCON 4** | Elevated Awareness | Normal usage with enhanced logging — log all API calls at info level |
| **DEFCON 3** | Increased Readiness | Restrict to essential endpoints only — completions and responses, no file uploads or fine-tuning |
| **DEFCON 2** | High Alert | Read-only operations only — no model modifications, no file creation, no fine-tuning jobs |
| **DEFCON 1** | Maximum Readiness | SDK disabled — no API calls. The agent operates from cached/committed state only. |

### DEFCON 1: Offline Mode

At DEFCON 1, the Fabric module cannot call the API at all. This means:

- No new completions or responses
- No new embeddings
- No webhook processing
- The agent can still read repository state, process issues, and commit responses based on pre-computed or cached results
- Intelligence is limited to what was previously committed

This is the most extreme expression of sovereignty: at DEFCON 1, the repository-mind operates without external intelligence. It is limited but fully sovereign.

---

## 4. Credential Governance

| Governance Layer | Mechanism | Owner |
|-----------------|-----------|-------|
| **Secret storage** | GitHub encrypted secrets | Repository owner |
| **Secret injection** | Workflow `env:` directive | Workflow author |
| **Secret consumption** | `process.env.OPENAI_API_KEY` | SDK client constructor |
| **Secret protection** | SDK redacts auth headers in logs | SDK (automatic) |
| **Secret rotation** | Update GitHub secret; no code change | Repository owner |
| **Secret scope** | Project-scoped API key recommended | Repository owner + OpenAI dashboard |
| **Secret audit** | GitHub audit log records secret access events | GitHub platform |

### Key Rotation Procedure

1. Generate new API key in OpenAI dashboard (project-scoped).
2. Update GitHub encrypted secret (`OPENAI_API_KEY`).
3. Old key continues working until explicitly revoked.
4. Revoke old key in OpenAI dashboard.
5. No code changes required — env var injection is transparent.

---

## 5. Data Flow Governance

The Fabric must govern what data crosses the SDK boundary. This is a caller responsibility, not an SDK responsibility.

| Data Category | Governance Rule | Implementation |
|--------------|-----------------|----------------|
| **Public repository content** | Permitted — low sensitivity | Send directly via SDK |
| **Agent persona and instructions** | Permitted — part of the agent's identity | Include in system/developer message |
| **Issue content** | Evaluate — may contain personal information | Sanitize before including in prompts |
| **Private repository content** | Restricted — consider local inference | Route to self-hosted model or minimize context |
| **Secrets and credentials** | Prohibited — never include in prompts | Validate prompt content before API call |
| **Security-sensitive content** | Prohibited — DEFCON constraint | Enforce at DEFCON 3+ |
| **Other users' personal data** | Restricted — minimize collection | Include only what is necessary for the task |

---

## 6. Composed Governance Model

| Layer | Mechanism | What It Governs |
|-------|-----------|----------------|
| **1. The Four Laws** | Behavioral hierarchy | What the agent *should* do — ethical constraints |
| **2. DEFCON Levels** | Operational states | What the agent *can* do — capability constraints |
| **3. GitHub Controls** | Platform permissions | Who can trigger the agent — access constraints |
| **4. Fabric Configuration** | Committed YAML/JSON | How the agent is configured — behavioral tuning |
| **5. SDK Configuration** | Client constructor params | How the intelligence conduit operates — retry, timeout, logging |
| **6. API Terms of Service** | Vendor contract | What the vendor permits — external constraints |
| **7. API Rate Limits** | Vendor enforcement | How much the agent can do per unit time — throughput constraints |

The governance stack has seven layers. The Fabric controls layers 1–5. The vendor controls layers 6–7. The SDK (layer 5) is the last Fabric-controlled layer before data enters vendor space.

---

## 7. Summary

| Governance Dimension | Responsibility | Status |
|---------------------|---------------|--------|
| Ethical behavior (Four Laws) | Fabric module (caller) | The SDK is neutral — governance applies to what the module sends, not the SDK itself |
| Operational state (DEFCON) | Fabric workflow | DEFCON levels constrain SDK usage from full access (5) to disabled (1) |
| Credential security | Shared — Fabric stores, SDK consumes | GitHub secrets → env vars → SDK constructor. Rotation is transparent. |
| Data sensitivity | Fabric module (caller) | The SDK transmits everything. The module must classify and filter. |
| Error resilience | SDK (automatic) | Retries, backoff, typed errors. Fabric sets limits. |
| Audit trail | Shared — SDK logs, Fabric commits | Info-level logging + committed API responses = full audit |
| Replaceability | Fabric architecture | Adapter pattern ensures the SDK is a swappable component |

openai-node does not need to be governed. It needs to be **governed through** — the Fabric's governance must extend from the repository, through the SDK configuration, to the boundary where data exits the sovereign zone. The SDK is not a governance subject. It is a governance surface.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

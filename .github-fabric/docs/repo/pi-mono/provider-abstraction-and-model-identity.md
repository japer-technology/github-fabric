# Provider Abstraction and Model Identity

> [Pi-Mono Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [How Much?](../../question-how-much.md)

> Pi-ai abstracts twenty-plus LLM providers behind a single interface. The Fabric pins a single model in a configuration file. These are not contradictions — one is a capability, the other is a discipline.

---

## 1. What Pi-ai Abstracts

Pi-ai is the foundation package. It provides a unified API for interacting with LLMs regardless of provider:

```typescript
import { getModel, stream, complete } from '@mariozechner/pi-ai';

const model = getModel('anthropic', 'claude-sonnet-4-20250514');
const response = await complete(model, context);
```

The same code works for any of twenty-plus providers:

| Provider | API Style | Authentication |
|----------|-----------|----------------|
| OpenAI | Chat Completions / Responses | API key |
| Anthropic | Messages | API key or OAuth |
| Google | GenerativeLanguage | API key |
| Vertex AI | Vertex API | OAuth |
| Azure OpenAI | Responses | API key |
| Amazon Bedrock | Converse Stream | IAM credentials |
| Mistral | Chat Completions | API key |
| Groq | Chat Completions | API key |
| Cerebras | Chat Completions | API key |
| xAI | Chat Completions | API key |
| OpenRouter | Chat Completions | API key |
| GitHub Copilot | Chat Completions | OAuth |
| MiniMax | Chat Completions | API key |
| Any OpenAI-compatible | Chat Completions | API key |

Behind this interface, pi-ai handles:

- **Model discovery** — auto-discovers available models per provider, filtering for tool-calling capability
- **Message transformation** — converts between the provider's message format and pi-ai's unified format
- **Token counting and cost tracking** — tracks input/output tokens and computes cost per request
- **Cross-provider handoffs** — serializes context so a conversation can continue on a different provider
- **Streaming with partial JSON** — parses tool call arguments as they stream, enabling progressive UI
- **Thinking/reasoning modes** — normalizes thinking APIs across providers (budget tokens, effort levels)
- **Error handling and abort** — standardized error types and cancellation across all providers

---

## 2. The Fabric's Model Discipline

The Fabric takes a different approach. The model is a **configuration value** committed to the repository:

```json
{
  "model": "claude-sonnet-4-20250514",
  "provider": "anthropic",
  "thinking_level": "medium"
}
```

This configuration is:

- **Committed** — the model choice is part of the repository state
- **Versioned** — changing the model requires a commit with a diff
- **Reviewable** — model changes can require PR approval
- **Reproducible** — any past invocation can be traced to its exact model configuration

Where pi-ai says "the model is a runtime parameter," the Fabric says "the model is a committed decision."

---

## 3. The Composition: Abstraction Governed by Discipline

These approaches compose naturally. Pi-ai provides the **capability** to talk to any provider. The Fabric provides the **discipline** to pin the choice:

```
Committed config (Fabric)     →  "Use anthropic/claude-sonnet-4-20250514"
                                       ↓
Provider abstraction (pi-ai)  →  getModel('anthropic', 'claude-sonnet-4-20250514')
                                       ↓
API call (pi-ai internals)    →  Anthropic Messages API with correct auth, format, streaming
                                       ↓
Response (pi-ai)              →  Standardized AssistantMessage with usage tracking
                                       ↓
Committed result (Fabric)     →  Token count, cost, and model ID recorded in commit metadata
```

The Fabric benefits from pi-ai in several ways:

1. **Provider migration is a config change.** If the Fabric needs to switch from Anthropic to OpenAI, the change is a single committed line. Pi-ai handles the API difference.
2. **Cost tracking is automatic.** Pi-ai reports token counts and costs. The Fabric can commit this data, building a permanent cost history.
3. **Cross-provider handoffs are possible.** If a task exceeds one model's capability, the context can be serialized and handed to a different model — all through pi-ai's context serialization.
4. **Model discovery is up-to-date.** Pi-ai maintains lists of available models per provider. The Fabric can query this to present model options.

---

## 4. Model Identity and the Reproducibility Question

The deepest tension is about **model identity**. When the Fabric commits "use claude-sonnet-4-20250514," what does that commit mean six months later?

LLM providers regularly update, deprecate, and rename models. A model ID that works today may not work tomorrow. The same model ID may behave differently after a provider-side update. Pi-ai addresses this pragmatically — it maintains a model list that updates with each release — but it does not solve the philosophical problem.

The Fabric's commit graph assumes that committed state is **durable**. A configuration committed today should be meaningful in the future. For model IDs, this is only partially true:

| Property | Durable? | Notes |
|----------|----------|-------|
| Provider name | Yes | Anthropic, OpenAI, etc. are stable identifiers |
| Model ID | Partially | Dated IDs (e.g., `claude-sonnet-4-20250514`) are more stable than aliases |
| Model behavior | No | Same ID may produce different outputs over time |
| Model availability | No | Models are deprecated and removed |
| API format | Mostly | Breaking changes are rare but possible |
| Pricing | No | Token costs change |

The implication is that the Fabric's reproducibility has a **horizon**. A committed model configuration is reproducible as long as the model exists and behaves consistently. Beyond that horizon, the commit records what was intended, not what can be reproduced.

Pi-ai's dated model IDs (e.g., `claude-sonnet-4-20250514` rather than `claude-sonnet`) help extend this horizon. The Fabric should prefer dated model IDs in its configuration to maximize the reproducibility window.

---

## 5. The Multi-Model Question

Pi-coding-agent supports model cycling — the user can switch models mid-session with Ctrl+L or Ctrl+P. Pi-ai supports cross-provider handoffs — serializing the context and continuing on a different model. These capabilities raise a question for the Fabric: **should a single invocation use multiple models?**

Scenarios where multi-model is useful:

| Scenario | First Model | Second Model | Reason |
|----------|-------------|--------------|--------|
| **Cost optimization** | Expensive (deep reasoning) | Cheap (simple summary) | Use the expensive model for hard parts only |
| **Capability fallback** | Primary model | Fallback model | If primary fails or times out |
| **Specialized routing** | General model | Code-specialized model | Route coding tasks to a coding model |
| **Context overflow** | Current model | Larger-context model | If the task exceeds the primary model's window |

The Fabric's current model is single-model-per-invocation. Pi-ai's architecture supports multi-model-per-invocation. The Fabric could adopt this pattern by committing a **model hierarchy** rather than a single model:

```json
{
  "primary": { "provider": "anthropic", "model": "claude-sonnet-4-20250514" },
  "fallback": { "provider": "openai", "model": "gpt-4o" },
  "summarizer": { "provider": "anthropic", "model": "claude-haiku-3-20240307" }
}
```

Each model in the hierarchy is committed, versioned, and reviewable. The runtime (pi-agent-core) handles the routing. The governance (Fabric) ensures every model choice is auditable.

---

## 6. Provider Authentication in the Fabric

Pi-ai supports multiple authentication methods: API keys, OAuth tokens, IAM credentials. In pi-coding-agent, the user runs `/login` to authenticate interactively. In the Fabric, authentication must happen non-interactively in an Actions runner.

The mapping:

| Pi-ai Auth Method | Fabric Equivalent |
|-------------------|-------------------|
| Environment variable (e.g., `ANTHROPIC_API_KEY`) | GitHub Actions secret |
| OAuth login (`/login`) | Not applicable (no browser in Actions) |
| Saved auth file (`~/.pi/agent/auth.json`) | Not applicable (ephemeral runner) |
| IAM credentials (Bedrock) | GitHub OIDC + AWS role assumption |

The Fabric's authentication model is simpler but more constrained. API keys as GitHub secrets are the standard pattern. OAuth providers (GitHub Copilot, Anthropic Pro, Google Gemini CLI) require alternative approaches — either pre-generated tokens stored as secrets, or GitHub OIDC federation for cloud providers.

Pi-ai's `getApiKey` callback (a function that returns an API key at runtime) composes well with the Fabric: the callback reads from the runner's environment, which is populated from GitHub secrets. No code change is needed — only configuration.

---

## 7. Summary

| Dimension | Pi-ai (Native) | Fabric (Governed) | Composed |
|-----------|----------------|-------------------|----------|
| **Model selection** | Runtime parameter | Committed config | Config drives runtime |
| **Provider abstraction** | 20+ providers | Uses pi-ai | Full provider support |
| **Model identity** | Model ID string | Committed model ID with SHA | Reproducible within horizon |
| **Cost tracking** | In-memory per request | Committed per invocation | Permanent cost history |
| **Authentication** | API key, OAuth, IAM | GitHub secrets, OIDC | Secrets populate pi-ai config |
| **Multi-model** | Cross-provider handoffs | Single model per invocation | Committed model hierarchy (proposed) |
| **Model discovery** | Automatic per provider | Not applicable | Pi-ai provides, Fabric consumes |
| **Reproducibility** | Not a concern | Core requirement | Dated model IDs extend the horizon |

Pi-ai is the voice box. The Fabric decides what to say, to whom, and records the conversation. The provider abstraction is a capability; the committed configuration is a discipline. Together, they produce an agent that can speak to any model but is accountable for which one it chose.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

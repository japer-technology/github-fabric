# Vendor Lock-In as Governance Question

> [OpenAI Node Index](./index.md) · [The Four Laws of AI](../../docs/the-four-laws-of-ai.md) · [The SDK as Trust Boundary](./sdk-as-trust-boundary.md)

> The Zeroth Law says no single entity shall monopolize access to AI tools. openai-node binds the Fabric to one vendor's API, pricing, rate limits, and terms of service. This is not a technical problem. It is a governance problem — and the Fabric must answer it.

---

## 1. The Zeroth Law Tension

The Fabric's Zeroth Law — Protecting Humanity — includes a specific prohibition:

> No single entity shall monopolize or gatekeep access to developer tools.

openai-node is the official SDK for a single vendor's API. When a Fabric module uses it, the module can only talk to OpenAI (or API-compatible endpoints). The intelligence provider is hardcoded into the dependency choice.

| Zeroth Law Principle | openai-node Reality |
|---------------------|---------------------|
| No monopolistic control | The SDK speaks only OpenAI's protocol |
| Open-source remains open | The SDK is Apache-2.0 — open source, but the API it calls is proprietary |
| Interoperability | Limited — Azure OpenAI is supported, but not arbitrary providers |
| Data sovereignty | Prompts and responses transit OpenAI's servers |

The tension is real but not absolute. The Zeroth Law does not prohibit *using* a vendor's tools. It prohibits *depending* on them in a way that creates lock-in. The question is whether the Fabric's use of openai-node creates lock-in — and if so, how to mitigate it.

---

## 2. The Lock-In Spectrum

Vendor lock-in exists on a spectrum. The Fabric's dependence on openai-node can be evaluated at each level:

| Lock-In Dimension | Severity | Explanation |
|-------------------|----------|-------------|
| **API protocol** | Moderate | OpenAI's REST API is widely imitated (many providers offer "OpenAI-compatible" endpoints), but not standardized |
| **SDK interface** | High | `client.chat.completions.create()` is openai-node-specific syntax. Switching SDKs means rewriting call sites |
| **Type definitions** | High | TypeScript types (`ChatCompletionMessage`, `ResponseCreateParams`) are SDK-specific |
| **Streaming protocol** | Moderate | SSE is standard, but the event schema is OpenAI-specific |
| **Structured output** | High | Zod integration with `zodResponseFormat()` is tightly coupled to OpenAI's response schema |
| **Model names** | High | `gpt-4o`, `gpt-5.2`, `o3-mini` are OpenAI model identifiers with no cross-vendor mapping |
| **Pricing** | Total | Per-token pricing is set unilaterally by OpenAI |
| **Rate limits** | Total | Request and token limits are set unilaterally by OpenAI |
| **Terms of service** | Total | Acceptable use, data retention, and audit rights are defined by OpenAI |
| **Realtime WebSocket** | High | The Realtime API protocol is proprietary to OpenAI |

The lower dimensions (protocol, streaming) have partial mitigation through the "OpenAI-compatible" ecosystem. The upper dimensions (pricing, terms, rate limits) have no mitigation at all — they are externally imposed constraints.

---

## 3. The Mitigation Strategies

### 3.1 The baseURL Escape Hatch

openai-node supports custom base URLs:

```typescript
const client = new OpenAI({
  baseURL: 'https://my-proxy.example.com/v1',
  apiKey: process.env.CUSTOM_API_KEY,
});
```

This allows the Fabric to point the SDK at any OpenAI-compatible API server: local inference (Ollama, vLLM, llama.cpp), proxy services (LiteLLM, OpenRouter), or alternative providers that implement the same REST contract.

| Mitigation | What It Solves | What It Does Not Solve |
|-----------|---------------|----------------------|
| Custom `baseURL` | Redirects traffic to any compatible endpoint | Does not change the SDK's type assumptions or model names |
| API proxy (LiteLLM) | Translates between providers | Adds a dependency; may not support all features |
| Local inference | Eliminates vendor dependency entirely | Requires hardware; model quality may differ |
| Alternative provider | Reduces single-vendor risk | Still locked to "OpenAI-compatible" protocol |

### 3.2 The Adapter Pattern

The Fabric can insulate itself from openai-node by introducing an **adapter layer** — a thin interface that Fabric modules call, which internally delegates to the SDK:

```
Fabric Module
    │
    ▼ calls
FabricIntelligence (adapter interface)
    │
    ▼ delegates to
openai-node (current implementation)
```

The adapter defines the Fabric's *own* contract for intelligence:

| Adapter Method | What It Abstracts |
|---------------|-------------------|
| `think(prompt, options)` | Model selection, API call, response parsing |
| `stream(prompt, options)` | Streaming protocol differences |
| `embed(text)` | Embedding model and dimension handling |
| `moderate(content)` | Content moderation API differences |

If the Fabric ever needs to switch providers, only the adapter implementation changes — not every module that calls the intelligence layer.

### 3.3 The Multi-Provider Strategy

The most robust mitigation is architectural: design the Fabric to support multiple intelligence providers simultaneously, with routing logic that selects the provider based on task, cost, or availability.

| Scenario | Provider | Rationale |
|----------|----------|-----------|
| Complex reasoning | OpenAI (GPT-5.2, o3) | Best-in-class for long-chain reasoning |
| Cost-sensitive tasks | Local inference (Ollama) | Zero per-token cost |
| Privacy-critical prompts | Self-hosted model | Data never leaves controlled infrastructure |
| Fallback on outage | Alternative provider | Continuity when primary is unavailable |

openai-node remains the adapter for the first scenario, but the Fabric is not *solely* dependent on it.

---

## 4. The Open-Source Paradox

openai-node is Apache-2.0 licensed. The code is open, inspectable, and modifiable. The Fabric can fork it, patch it, and redistribute it without restriction.

But the API it calls is not open. The models behind the API are not open. The pricing, rate limits, and terms of service are not open. The SDK is an open-source gateway to a proprietary service.

| Layer | Open? | Controllable? |
|-------|-------|--------------|
| SDK source code | Yes (Apache-2.0) | Yes — fork and modify |
| SDK distribution | Yes (npm, JSR) | Yes — publish your own fork |
| API protocol | Documented but proprietary | No — OpenAI defines it |
| Models | Proprietary (weights not released) | No — run on OpenAI's servers |
| Pricing | Published but unilateral | No — OpenAI sets prices |
| Data handling | Documented in privacy policy | No — governed by OpenAI's policies |

The Fabric must distinguish between **code openness** (which openai-node provides) and **service sovereignty** (which it does not). The Zeroth Law concerns the latter more than the former.

---

## 5. The Azure Precedent

openai-node includes first-class Azure OpenAI support via the `AzureOpenAI` subclass:

```typescript
import { AzureOpenAI } from 'openai';

const client = new AzureOpenAI({
  azureADTokenProvider,
  apiVersion: '2024-10-01-preview',
});
```

This is significant because it demonstrates that the SDK *already* supports multiple backends. The same TypeScript types and method signatures work against both OpenAI and Azure OpenAI infrastructure. The precedent suggests that the SDK's architecture can accommodate additional backends without fundamental changes.

For the Fabric, the Azure subclass is proof of concept for the adapter pattern: the SDK can be configured to talk to different intelligence endpoints while preserving the same developer interface.

---

## 6. What the Fabric Must Decide

The vendor lock-in question is ultimately a governance decision, not a technical one. The Fabric must choose:

| Decision | Conservative Position | Progressive Position |
|----------|---------------------|---------------------|
| **SDK dependency** | Use openai-node directly — accept vendor coupling for best type safety and feature coverage | Wrap in adapter — accept maintenance cost for replaceability |
| **Provider strategy** | Single provider (OpenAI) — simpler, more predictable | Multi-provider — resilient, but complex |
| **Version policy** | Pin exact version — stability over features | Range version — automatic access to new endpoints |
| **Data sensitivity** | Route all prompts through OpenAI — simplest | Classify prompts by sensitivity, route accordingly |
| **Fallback strategy** | Accept downtime when OpenAI is unavailable | Maintain alternative provider for continuity |

There is no right answer. The Zeroth Law provides the principle — no monopolistic control. The Fabric's implementation must balance that principle against pragmatism: OpenAI's models are, as of this writing, the intelligence layer that most Fabric modules need.

---

## 7. Summary

| Governance Dimension | Current State | Recommended Posture |
|---------------------|--------------|-------------------|
| Vendor dependency | Total — openai-node is the sole intelligence conduit | Mitigate — introduce adapter layer; support `baseURL` override |
| Code sovereignty | Full — Apache-2.0, can fork | Maintain — no action needed |
| Service sovereignty | None — pricing, limits, terms set by OpenAI | Accept with awareness — document the dependency explicitly |
| Replaceability | Moderate — `baseURL` escape hatch exists | Strengthen — design modules to be provider-agnostic above the adapter |
| Multi-provider | Not implemented | Plan — identify use cases for local and alternative providers |
| Zeroth Law compliance | Partial tension | Resolve through adapter pattern + explicit documentation of vendor dependency |

The Zeroth Law does not require the Fabric to avoid vendor SDKs. It requires the Fabric to avoid *irrevocable* vendor dependency. openai-node's `baseURL` configuration, the Azure precedent, and the adapter pattern provide the tools. The governance decision is to use them — to treat the intelligence provider as a swappable component, even when today there is only one provider in the slot.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

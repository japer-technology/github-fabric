# Transformation Map

> [OpenAI Node Index](./index.md) · [What OpenAI Node Teaches Fabric](./what-openai-node-teaches-fabric.md) · [Cost and Constraints](./cost-and-constraints.md)

> The Fabric does not transform openai-node into a module. It consumes it as a dependency. This is a new absorption pattern — the first case where the three-plane architecture (Source → Transformation → Execution) does not apply in the standard way.

---

## 1. Why the Standard Pattern Does Not Apply

Every previous Fabric case study followed the same pipeline:

```
Source Plane:         Clone upstream repo
                          │
Transformation Plane: Normalize, patch, wrap
                          │
Execution Plane:      Run as GitHub Actions workflow
```

openai-node cannot follow this pattern because:

| Standard Assumption | openai-node Reality |
|--------------------|---------------------|
| The upstream repo contains runtime code | The upstream repo contains *build* code — the runtime is the published npm package |
| The Fabric ingests source files | The Fabric installs a package from npm |
| Transformation normalizes the source | No transformation needed — the package is already normalized |
| The module runs inside the Fabric | The SDK is called from code that runs inside the Fabric |
| The upstream has state to manage | The SDK is stateless — it is a pure HTTP client |

openai-node is not a module the Fabric runs. It is a **library the Fabric's modules use.** This distinction changes every plane of the architecture.

---

## 2. The Dependency Ingestion Pattern

Instead of the three-plane architecture, openai-node introduces a new pattern:

```
Dependency Declaration:  package.json → "openai": "6.27.0"
                              │
Installation:            npm install (in Actions runner)
                              │
Consumption:             import OpenAI from 'openai'
                              │
Invocation:              client.responses.create({ ... })
                              │
Response:                LLM output → committed to repository
```

This is the **dependency ingestion pattern** — the Fabric's first instance of absorbing an upstream project not by cloning and transforming its source, but by declaring it as a dependency and consuming its published interface.

---

## 3. Source Plane: What Gets Tracked

The Fabric does not clone `openai/openai-node`. Instead, it tracks:

| Artifact | Location | Purpose |
|----------|----------|---------|
| **Version pin** | `package.json` (`"openai": "6.27.0"`) | Exact version control — no range, no drift |
| **Lock file** | `package-lock.json` or `yarn.lock` | Integrity hash for the exact artifact |
| **Type declarations** | `node_modules/openai/dist/index.d.ts` (not committed) | TypeScript interface at build time |
| **OpenAPI spec reference** | Documentation only | Track which API version the SDK targets |

### What Is Not Tracked

| Artifact | Why Not |
|----------|---------|
| openai-node source code | Not needed — the Fabric uses the published package, not the source |
| openai-node tests | Not the Fabric's responsibility — the vendor tests their own SDK |
| openai-node CI/CD | Not relevant — the Fabric does not build the SDK |
| Stainless configuration | Upstream implementation detail |

This is dramatically lighter than any previous source plane. NanoClaw required ingesting ~17 source files. OpenClaw required selective extraction from 500,000+ lines. openai-node requires a **single line in `package.json`.**

---

## 4. Transformation Plane: What Gets Wrapped

The Fabric does not transform openai-node's code. But it may wrap it — providing a Fabric-specific interface that insulates modules from SDK changes.

### 4.1 Minimal Wrapper (Recommended)

The lightest approach: a configuration module that instantiates the SDK client with Fabric-appropriate settings.

```typescript
// .github-fabric/lib/intelligence.ts
import OpenAI from 'openai';

export function createClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG,
    maxRetries: 3,
    timeout: 120_000,
  });
}
```

| What This Provides | Why It Matters |
|-------------------|----------------|
| Single configuration point | All modules use the same client settings |
| Secret injection | API key comes from GitHub encrypted secrets via env |
| Retry policy | Consistent retry behavior across all modules |
| Timeout policy | Prevents runaway API calls from consuming Actions minutes |
| Replaceability | If the Fabric ever switches providers, only this file changes |

### 4.2 Adapter Wrapper (For Multi-Provider)

If the Fabric implements the multi-provider strategy from the [Vendor Lock-In analysis](./vendor-lock-in-as-governance.md), the wrapper becomes an adapter:

```typescript
// .github-fabric/lib/intelligence.ts
export interface FabricIntelligence {
  think(prompt: string, options?: ThinkOptions): Promise<string>;
  stream(prompt: string, options?: StreamOptions): AsyncIterable<string>;
}

// OpenAI implementation
export class OpenAIIntelligence implements FabricIntelligence {
  private client: OpenAI;
  constructor() {
    this.client = new OpenAI({ /* ... */ });
  }
  async think(prompt, options) { /* ... */ }
  async *stream(prompt, options) { /* ... */ }
}
```

This is more complex but provides the replaceability the Zeroth Law recommends.

---

## 5. Execution Plane: How the SDK Is Used

In the Fabric's execution model, openai-node is invoked during GitHub Actions workflow runs:

```yaml
# .github/workflows/fabric-agent.yml
jobs:
  respond:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: node .github-fabric/agent/respond.js
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Execution Timeline

| Phase | Duration | What Happens |
|-------|----------|--------------|
| Runner setup | ~15s | Ubuntu runner initializes |
| Checkout | ~5s | Repository cloned to runner |
| Node.js setup | ~10s | Node 20 installed, npm cache restored |
| `npm ci` | ~15–30s | Dependencies installed (openai + any others) |
| Agent execution | ~30–120s | SDK calls OpenAI API; processes response |
| State commit | ~5–10s | Response committed to repository |
| **Total** | **~1.5–3 min** | Per invocation |

### SDK-Specific Execution Concerns

| Concern | SDK Behavior | Fabric Governance |
|---------|-------------|-------------------|
| **Retries** | Automatic retry on 429 (rate limit) and 5xx errors | Configure `maxRetries` to limit Actions minute consumption |
| **Timeouts** | Configurable per-request timeout | Set aggressive timeout to prevent runaway calls |
| **Streaming** | Incremental response via SSE | Use streaming for long responses to detect errors early |
| **Abort** | AbortController support | Implement timeout-based abort for cost control |
| **Error handling** | Typed error classes (`APIError`, `RateLimitError`, etc.) | Catch and log errors; commit error state for audit |

---

## 6. Comparison with Previous Case Studies

| Dimension | NanoClaw (Agent) | OpenClaw (Agent) | openai-node (SDK) |
|-----------|-----------------|-----------------|-------------------|
| **Source ingestion** | Clone ~17 files | Selective extraction | `npm install openai` |
| **Transformation** | Replace channels, config | Distill gateway, wrap modules | None (or thin wrapper) |
| **Build phase** | TypeScript compile + Docker | Complex multi-stage build | `npm ci` only |
| **Runtime** | Container inside runner | Wrapped process in runner | Function calls in runner |
| **State management** | SQLite → git serialization | Gateway state → git | Stateless — no state to manage |
| **Update mechanism** | Git pull + rebuild | Git pull + selective merge | `npm update openai` |
| **Governance surface** | Container + Fabric | Wrapped process + Fabric | SDK configuration + Fabric |

openai-node is the lightest transformation the Fabric has encountered — because there is effectively no transformation. The SDK is consumed as-is. The Fabric's contribution is governance (secrets, logging, error handling) and lifecycle (when to call the API, what to do with the response, how to commit the output).

---

## 7. The Update Lifecycle

| Event | Action |
|-------|--------|
| New minor release | Review CHANGELOG; update version in `package.json` if new features needed |
| New major release | Review MIGRATION.md; evaluate breaking changes; plan update PR |
| Security advisory | Immediate update — SDK vulnerabilities may expose API keys or allow request tampering |
| API deprecation | OpenAI deprecates endpoint → SDK marks methods as deprecated → Fabric modules must migrate |
| API addition | New endpoint available → update SDK → implement in Fabric modules as needed |

The update lifecycle is a PR process: change the version in `package.json`, run tests, review the diff in `package-lock.json`, merge. This is lighter than any agent update (no source code to re-ingest, no transformation to re-apply) but requires the same governance: CODEOWNERS approval, CI validation, and documented rationale.

---

## 8. Summary

| Transformation Property | openai-node |
|------------------------|-------------|
| Ingestion method | `npm install` — one line in `package.json` |
| Transformation effort | None — or thin configuration wrapper |
| Build overhead | ~15–30s `npm ci` (cached) |
| Runtime footprint | Zero runtime dependencies; ~200 KB bundled |
| State management | Stateless — nothing to serialize |
| Update mechanism | Version bump in `package.json` |
| Governance surface | Secrets, logging, error handling, timeout policy |

openai-node is the Fabric's simplest absorption. There is no source to clone, no code to transform, no process to wrap. The SDK is a dependency — declared, installed, called. The Fabric's contribution is not transformation but **governance**: ensuring that the intelligence conduit is configured correctly, credentialed securely, used efficiently, and replaceable if necessary.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

# The Gateway Pattern

> [Moltis Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> Moltis is a gateway — a persistent process that sits between users and LLM providers, routing requests, managing sessions, and orchestrating agents. The Fabric calls LLM providers directly from ephemeral Actions runners. These are two integration patterns — **persistent mediation vs. ephemeral invocation** — and the Fabric learns that a gateway provides capabilities that ephemeral invocation cannot: session continuity, provider abstraction, and cost aggregation.

---

## 1. The Gateway Architecture

Moltis's gateway (`moltis-gateway`, 36.1K LoC) is the largest crate in the workspace. It is the **central nervous system** of the entire platform:

```
                    External
┌───────────┐    ┌───────────┐    ┌───────────┐
│ Web UI    │    │ Telegram  │    │   API     │
│ (browser) │    │ (bot)     │    │ (REST/WS) │
└─────┬─────┘    └─────┬─────┘    └─────┬─────┘
      │                │                │
      └────────┬───────┴────────┬───────┘
               │                │
        ┌──────▼────────────────▼──────┐
        │      Gateway Server          │
        │  ┌──────────────────────┐    │
        │  │    Axum Router       │    │
        │  │  HTTP · WS · Auth    │    │
        │  └──────────┬───────────┘    │
        │             │                │
        │  ┌──────────▼───────────┐    │
        │  │    Chat Service      │    │
        │  │  routing · history   │    │
        │  │  agent orchestration │    │
        │  └──────────┬───────────┘    │
        │             │                │
        │  ┌──────────▼───────────┐    │
        │  │   Agent Runner       │    │
        │  │  prompt assembly     │    │
        │  │  streaming response  │    │
        │  │  tool execution      │    │
        │  └──────────┬───────────┘    │
        │             │                │
        │  ┌──────────▼───────────┐    │
        │  │  Provider Registry   │    │
        │  │  OpenAI · Copilot    │    │
        │  │  Local · Others      │    │
        │  └──────────────────────┘    │
        │                              │
        │  Sessions │ Memory │ Hooks   │
        └──────────────────────────────┘
                      │
              ┌───────▼───────┐
              │    Sandbox    │
              │ Docker/Apple  │
              └───────────────┘
```

The gateway is a **long-running process**. It starts when the user boots Moltis and stays alive until the user stops it. During its lifetime, it maintains:

- **Open WebSocket connections** to all active clients
- **Session state** in SQLite + JSONL
- **Memory indexes** with hybrid vector + full-text search
- **Provider connections** with connection pooling and retry logic
- **Hook registrations** with circuit breaker patterns
- **Authentication state** with rate limiting and session tokens

---

## 2. The Ephemeral Invocation Pattern

The Fabric does not have a gateway. It has **ephemeral invocation**:

```
GitHub Issue (trigger)
        │
        ▼
GitHub Actions Runner (ephemeral VM)
        │
        ├──▶ Read issue body
        ├──▶ Load committed configuration
        ├──▶ Call LLM provider API directly
        ├──▶ Execute tools
        ├──▶ Commit results to Git
        └──▶ Destroy runner
```

Every workflow run starts from scratch. There is no persistent connection, no session state carried between runs, no connection pooling, no accumulated memory. The runner provisions, executes, and dies.

| Dimension | Gateway (Moltis) | Ephemeral (Fabric) |
|-----------|-----------------|-------------------|
| **Process lifetime** | Hours/days/weeks | Minutes |
| **State persistence** | In-process + SQLite | None (must reload from Git) |
| **Connection model** | Persistent WebSocket + connection pool | Per-request HTTPS |
| **Session continuity** | Maintained across messages | Reconstructed per run |
| **Memory** | Accumulated, indexed, searchable | Committed to Git, reloaded per run |
| **Cost attribution** | Aggregated across sessions | Per-run (per-issue) |
| **Failure mode** | Process crash → restart from state | Runner failure → retry workflow |
| **Scaling** | Vertical (bigger machine) | Horizontal (more runners) |

---

## 3. What the Gateway Provides

### 3a. Session Continuity

When a user sends three messages in a Moltis conversation, the gateway maintains the full context window — previous messages, tool results, memory retrievals — in a single session object. The third message benefits from the context of the first two without any reconstruction.

In the Fabric, each issue is typically a separate workflow run. Context from previous issues must be explicitly loaded from Git history or committed memory files. There is no automatic session continuity. This is by design — each issue is an independent, auditable unit of work — but it means the Fabric must do more work to provide conversational coherence.

### 3b. Provider Abstraction and Routing

Moltis's `moltis-providers` crate (17.6K LoC) implements a provider registry that abstracts over multiple LLM providers:

| Provider | Protocol | Features |
|----------|----------|----------|
| OpenAI | REST API | Chat completion, function calling, streaming |
| GitHub Copilot | REST API | Chat completion, function calling |
| Local models | Library binding | No network dependency |
| Kimi Code | REST API | Code-specialized completion |
| OpenAI Codex | REST API | Long-running agent tasks |

The gateway can switch between providers per request based on configuration, cost, availability, or capability requirements. It handles authentication, rate limiting, retry logic, and streaming for each provider differently — and presents a uniform interface to the chat service.

The Fabric calls providers directly. Each workflow must handle authentication, rate limiting, and error handling independently. The committed configuration pins a specific provider and model, but the invocation logic is in the workflow definition.

The gateway pattern provides **operational resilience** that ephemeral invocation does not: if one provider is down, the gateway can failover to another. If rate limits are hit, the gateway can queue and retry. These capabilities require persistent state that ephemeral runners do not have.

### 3c. Cost Aggregation

The gateway tracks token usage across all sessions, all providers, and all users. It can enforce budgets, generate usage reports, and attribute costs to specific conversations or agents.

In the Fabric, cost tracking is per-workflow-run. There is no built-in aggregation across issues or over time. The Fabric can commit cost data to Git per run, but aggregation requires post-processing — reading committed cost records and summing them.

### 3d. Streaming Responses

The gateway streams LLM responses over WebSocket connections. The user sees tokens appear in real time. This is essential for interactive use — a 30-second response that streams token-by-token feels responsive; the same response that arrives as a block after 30 seconds feels broken.

The Fabric produces batch output. The workflow runs, the result is committed, the user reads the commit or PR. There is no streaming. This is acceptable for asynchronous workflows (code review, documentation generation) but unsuitable for interactive ones.

---

## 4. What Ephemeral Invocation Provides

### 4a. Zero State to Corrupt

An ephemeral runner starts clean and ends clean. There is no session state to corrupt, no database to lose, no process to crash. Every run is reproducible from the trigger (issue body) and configuration (committed files).

A gateway is stateful. Its SQLite database can corrupt. Its process can crash. Its WebSocket connections can drop. Recovery requires restart logic, state reconstruction, and data integrity checks. Moltis handles this with session persistence (JSONL files that can reconstruct state), but the complexity is real.

### 4b. Horizontal Scaling

GitHub Actions can run hundreds of workflows in parallel. Each gets its own runner. Scaling is horizontal and managed by the platform.

A Moltis gateway scales vertically — a bigger machine with more memory and more CPU. Horizontal scaling requires multiple Moltis instances, which introduces state synchronization challenges.

### 4c. Platform-Managed Security

An ephemeral runner inherits GitHub's security posture: network isolation, secret injection, log masking, VM destruction. The user does not manage the security of the runtime — GitHub does.

A Moltis gateway requires the user to manage TLS certificates, authentication, network filtering, and container sandboxing. Moltis provides the tools (TLS auto-generation, SSRF protection, container isolation), but the user must configure and maintain them.

---

## 5. The Composition: Gateway as Governed Service

The gateway and ephemeral patterns compose as a **governed service** model:

```
┌─────────────────────────────────────┐
│           GitHub Repository          │
│                                      │
│  gateway-config.yml (committed)      │
│  ┌─────────────────────────────┐     │
│  │ provider: openai            │     │
│  │ model: gpt-4o               │     │
│  │ fallback: github-copilot    │     │
│  │ max-tokens-per-session: 50K │     │
│  │ cost-limit-daily: $10       │     │
│  │ sandbox: docker             │     │
│  │ channels: [telegram, api]   │     │
│  └─────────────────────────────┘     │
│                                      │
│  Actions workflow (monitors config)  │
└──────────────┬───────────────────────┘
               │ governs
               ▼
┌─────────────────────────────────────┐
│         Moltis Gateway               │
│  (running on user hardware)          │
│                                      │
│  Reads config from repository        │
│  Routes to configured providers      │
│  Enforces committed cost limits      │
│  Enables only declared channels      │
│  Reports usage back to repository    │
└─────────────────────────────────────┘
```

In this model:

- **The repository governs** — provider selection, cost limits, channel activation, sandbox policy, and tool permissions are committed configuration. Changes require PR review.
- **The gateway executes** — Moltis runs on user hardware, maintains persistent connections, manages sessions, and routes to providers according to the committed configuration.
- **Synchronization is Git pull** — the gateway periodically pulls configuration from the repository, or a webhook triggers configuration reload on push.
- **Audit is bidirectional** — configuration changes are in Git history (who changed what); usage reports from the gateway are committed back to the repository (what the gateway did).

This is not Githubification (the gateway does not run on GitHub). It is not pure local-first (the configuration is not local — it is committed). It is **governed autonomy**: the gateway has the freedom to execute, but the rules it follows are committed, reviewed, and auditable.

---

## 6. The Agent Loop: 5K Lines of Mind

Moltis makes a specific claim: "The agent loop + provider model fits in ~5K lines." This is the cognitive core — `moltis-agents` (9.6K LoC) contains the agent runner, prompt assembly, and streaming logic, while the provider interface is in `moltis-providers`.

The 5K-line agent loop is the **minimal mind**: receive a prompt, assemble context (system prompt + memory + conversation history + tool results), call an LLM provider, parse the response, execute any tool calls, and loop until the task is complete or the budget is exhausted.

The Fabric's agent loop is simpler: read issue body → load config → call LLM → execute tools → commit result. The Fabric's loop is encoded in a GitHub Actions workflow, not a Rust binary. But the cognitive pattern is the same: prompt → completion → tool use → loop.

The difference is **where the loop runs**. In Moltis, it runs in a persistent process with in-memory state. In the Fabric, it runs in an ephemeral runner with Git as state. The Moltis loop is faster (no state reconstruction) but fragile (process death loses state). The Fabric loop is slower (state is reconstructed from Git) but durable (Git survives any process death).

---

## 7. What the Gateway Pattern Teaches Fabric

The gateway pattern teaches the Fabric that **not every AI interaction fits the issue-as-task model.** Some interactions are conversational (multi-turn, context-dependent). Some are real-time (streaming, voice). Some are cross-session (memory that spans conversations). The Fabric's ephemeral invocation pattern handles structured, asynchronous tasks well — but the world of AI interaction is broader than that.

The Fabric does not need to become a gateway. It needs to recognize that gateways exist, that they provide capabilities the Fabric cannot (streaming, session continuity, real-time interaction), and that the Fabric can govern a gateway without replacing it. The committed configuration is the governance interface. The gateway is the execution engine. The repository is the permanent record. Each component does what it does best.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

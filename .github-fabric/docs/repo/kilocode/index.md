# Kilocode: Rethought from the Fabric

> [Docs Index](../../index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> A complete analysis of [Kilocode](https://github.com/Kilo-Org/kilocode) — the #1 coding agent on OpenRouter, a multi-surface agentic engineering platform forked from OpenCode, offering 500+ AI models, a CLI/TUI/VS Code/Desktop/Web architecture backed by a single HTTP server, multi-session orchestration with git worktree isolation, an MCP-extensible tool system, and a commercial gateway with credits and telemetry — reexamined through the architecture, governance, and philosophy of GitHub Fabric.

---

## Why This Analysis Exists

The [githubification](https://github.com/japer-technology/githubification) project asks how to make repositories run on GitHub as infrastructure. Previous Fabric analyses examined agents of increasing sophistication: [Agenticana](../agenticana/index.md) was a twenty-agent swarm sharing memory. [OpenClaw](../openclaw/index.md) was a persistent multi-channel gateway. [Pi-Mono](../pi-mono/index.md) was the toolkit from which agents are built. [OpenAI Codex](../openai-codex/index.md) was a vendor-built coding agent that already treats the repository as its workspace.

Kilocode is different from all of them. It is not a single agent, not a toolkit, and not a vendor's product. It is a **platform** — a commercial-grade, multi-surface, multi-model agentic engineering system that has crossed from open-source utility into a marketplace with 1.5 million users, 25 trillion tokens processed, and its own credits economy. Where previous analyses absorbed organisms or genomes, Kilocode confronts the Fabric with an **ecosystem** — one that has its own gateway, its own authentication, its own telemetry pipeline, and its own economic model.

More intriguingly, Kilocode is a **fork**. It descends from [OpenCode](https://github.com/anomalyco/opencode), inheriting the Turborepo monorepo structure, the Vercel AI SDK provider abstraction, the SolidJS UI framework, and the Hono HTTP server. The fork added a commercial gateway, a VS Code extension, a credits system, enterprise telemetry, and a brand. This means Kilocode has two identities: the upstream OpenCode genome and the downstream Kilo divergence. When the Fabric absorbs Kilocode, it absorbs a mind that was born from another mind — and the question of which mind it is becomes a governance question.

When you rethink this system through the Fabric's lens, the question is not "how do you run Kilocode on GitHub?" — it is **"what does the Fabric learn from an agent that has already become its own platform, its own marketplace, and its own economy?"**

---

## Documents

| Document | Focus |
|----------|-------|
| [Platform as Agent](./platform-as-agent.md) | Why absorbing a platform is different from absorbing an agent — the evolution from CLI tool to multi-surface system, and what it means for the Fabric's Source Plane |
| [The Forked Mind](./the-forked-mind.md) | Identity through forking — upstream inheritance from OpenCode, brand divergence, genetic drift, and what a fork means when the repository is the mind |
| [Multi-Surface Architecture](./multi-surface-architecture.md) | TUI, VS Code, Desktop, and Web clients backed by a single HTTP server — how a multi-surface agent maps to the Fabric's single-surface Actions runtime |
| [Model Marketplace and Governance](./model-marketplace-and-governance.md) | 500+ models via Vercel AI SDK, Kilo Gateway routing, and OpenRouter aggregation — versus the Fabric's model-pinning discipline |
| [Agentic Orchestration](./agentic-orchestration.md) | Agent Manager, multi-session coordination, git worktree isolation, MCP tool integration, and the registry-based tool system — composed with issue-driven Fabric execution |
| [The Commercial Mind](./the-commercial-mind.md) | Credits economy, gateway authentication, PostHog telemetry, OpenTelemetry tracing — when the agent has its own economy and the Fabric has its own governance |
| [What Kilocode Teaches Fabric](./what-kilocode-teaches-fabric.md) | The synthesis: what the Fabric learns from absorbing an agent that has already become a platform, a marketplace, and an economy |

---

## The Source

[Kilocode](https://github.com/Kilo-Org/kilocode) is a Turborepo + Bun monorepo containing twelve packages:

- **@kilocode/cli** (`packages/opencode/`) — The core engine: AI agent logic, tool registry, Hono HTTP server with SSE streaming, session management (SQLite + file-based), provider integration via Vercel AI SDK, configuration management, and a SolidJS terminal UI. Runs as in-process TUI or headless server via `kilo serve`.
- **kilo-code** (`packages/kilo-vscode/`) — VS Code extension providing sidebar chat, inline code actions, and Agent Manager (multi-session orchestration with git worktree isolation). Spawns the CLI as a child process and communicates via HTTP + SSE.
- **@kilocode/sdk** (`packages/sdk/js/`) — Auto-generated TypeScript SDK from the OpenAPI spec. Type-safe client for the CLI's HTTP server.
- **@kilocode/kilo-gateway** (`packages/kilo-gateway/`) — Commercial authentication layer: OAuth device flow, OpenRouter provider routing, Kilo credits system with transparent pricing.
- **@kilocode/kilo-telemetry** (`packages/kilo-telemetry/`) — PostHog analytics and OpenTelemetry instrumentation for observability.
- **@kilocode/kilo-i18n** (`packages/kilo-i18n/`) — Internationalization with 16 language translations.
- **@kilocode/kilo-ui** (`packages/kilo-ui/`) — 40+ SolidJS components built on Kobalte Core, providing the design system.
- **@kilocode/kilo-docs** (`packages/kilo-docs/`) — Next.js + Markdoc documentation site.
- **@opencode-ai/app** (`packages/app/`) — Shared SolidJS web UI for desktop and web clients.
- **@opencode-ai/desktop** (`packages/desktop/`) — Tauri desktop app shell for native cross-platform distribution.
- **@opencode-ai/util** (`packages/util/`) — Shared utilities: error handling, path normalization, retry logic.
- **@kilocode/plugin** (`packages/plugin/`) — Plugin and tool interface definitions.

The architecture is multi-client, single-server:

```
@kilocode/cli (packages/opencode/)
┌──────────────────────────────────────────┐
│ AI agents · tools · sessions · providers │
│ config · MCP · Hono HTTP server + SSE    │
└──┬──────────┬──────────┬────────────────┘
   │          │          │
┌──┴───┐ ┌───┴────┐ ┌───┴─────────┐
│ TUI  │ │VS Code │ │Desktop/Web │
│(proc)│ │  Ext   │ │  clients   │
└──────┘ └────────┘ └────────────┘
```

Key design patterns:

- **Namespace modules** — All modules export TypeScript namespaces with Zod schemas, inferred types, and validated functions via `fn()` wrappers.
- **Per-project singleton state** — State is tied to project directory via `AsyncLocalStorage`, enabling multi-project isolation.
- **Registry-based tools** — `Tool.define(id, ...)` with Zod parameter schemas, supporting terminal execution, file operations, git operations, and MCP protocol integration.
- **Pub/Sub event bus** — Cross-module communication via `BusEvent.define()` and `Bus.publish()`.
- **Structured errors** — All errors are `NamedError` instances with Zod schemas.

The project philosophy emphasizes **modes** — Architect for planning, Coder for implementation, Debugger for troubleshooting — and radical model flexibility: users can switch between 500+ models from any provider at any time. The platform has 1.5M+ users and processes 25T+ tokens.

---

## The Fabric Lens

Where Githubification asks "can this run on GitHub?", the Fabric asks:

1. **Platform vs. Agent** — Previous Fabric analyses absorbed agents (systems that act) and toolkits (systems from which agents are built). Kilocode is neither — it is a **platform**: a system that hosts agents, routes models, manages sessions, and provides its own authentication. Can the Fabric absorb a platform, or does it compose with one?
2. **The Fork** — Kilocode descends from OpenCode. It carries upstream DNA (Turborepo, Vercel AI SDK, Hono, SolidJS) and downstream mutations (gateway, credits, telemetry, VS Code extension). When the Fabric treats the repository as the mind, and the mind was born from another mind, which one is the identity? Is the Fabric absorbing Kilocode or OpenCode?
3. **Multi-Surface** — Kilocode serves four surfaces: terminal TUI, VS Code webview, Tauri desktop, and browser. All backed by a single HTTP server. The Fabric runs on a single surface: GitHub Actions. How do four surfaces collapse to one — and what is lost?
4. **Model Marketplace** — Kilocode offers 500+ models through Vercel AI SDK and Kilo Gateway, with dynamic switching. The Fabric pins a single model per configuration. What does model governance look like when the agent is a marketplace?
5. **Orchestration** — Kilocode's Agent Manager runs parallel sessions with git worktree isolation. The Fabric runs one issue at a time. How does multi-session orchestration compose with issue-driven execution?
6. **Commerce** — Kilocode has its own credits economy, gateway authentication, analytics pipeline, and telemetry. The Fabric has no economy — it has governance. What happens when the agent's commercial incentives meet the Fabric's governance requirements?
7. **Autonomy** — Kilocode agents execute terminal commands, modify files, create commits, and manage their own sessions. The `--auto` flag disables all permission prompts. How does the Fabric govern an agent whose selling point is unsupervised autonomy?

These seven questions organize the analysis that follows.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

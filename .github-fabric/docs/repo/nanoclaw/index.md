# NanoClaw: Rethought from the Fabric

> [Docs Index](../../docs/index.md) · [The Repo Is the Mind](../../docs/the-repo-is-the-mind.md) · [The Four Laws](../../docs/the-four-laws-of-ai.md)

> A complete analysis of [NanoClaw](https://github.com/qwibitai/nanoclaw) — a minimalist personal AI assistant built on the Claude Agent SDK with container-isolated agents, skill-based code transformation, and a codebase designed to fit inside an AI's context window — reexamined through the architecture, governance, and philosophy of GitHub Fabric.

---

## Why This Analysis Exists

The [githubification](https://github.com/japer-technology/githubification) project asked a practical question: *how do you make NanoClaw run on GitHub?* That question produced a thorough [lesson document](https://github.com/japer-technology/githubification/blob/main/.githubification/lesson-from-nanoclaw.md) examining the clean mapping between NanoClaw's single-process architecture and GitHub primitives, and the discovery that NanoClaw is the easiest agent to Githubify — because it was designed to be understood by an AI. The [OpenClaw analysis](../openclaw/index.md) positioned its 500,000-line parent as the Fabric's stress test. NanoClaw is the opposite case: the agent built by stripping everything away.

This analysis asks a different question: *what does NanoClaw mean when the repository is the mind?*

NanoClaw is not a framework, a platform, or a monorepo. It is a **personal AI assistant that fits inside a context window** — one process, a handful of source files, six runtime dependencies, and a philosophy that treats code modification as the unit of customization. It runs Claude agents inside Linux containers with OS-level isolation, routes messages from WhatsApp, Telegram, Discord, Slack, and Gmail, and maintains per-group memory backed by SQLite. It was built as an explicit rejection of OpenClaw's complexity — the creator states he "wouldn't have been able to sleep" giving complex software full access to his life.

When you rethink this system through the Fabric's lens — where the repository is the execution environment, where memory is the commit graph, where governance inherits from GitHub — the questions are fundamentally different from the OpenClaw case. The challenge is not absorbing a 500 MB monorepo (that was OpenClaw). The challenge is understanding what happens when the agent is **already almost a Fabric module** — and what the last mile of transformation reveals about both systems.

---

## Documents

| Document | Focus |
|----------|-------|
| [What NanoClaw Teaches Fabric](./what-nanoclaw-teaches-fabric.md) | The core analysis: what a minimalist, AI-legible assistant reveals about the Fabric's complexity budget and growth axis |
| [Smallness as Architecture](./smallness-as-architecture.md) | The "35k tokens" philosophy — code that fits inside a context window — and what it means for a system where the repository is the mind |
| [Container Isolation as Governance](./container-isolation-as-governance.md) | NanoClaw's OS-level container isolation vs. the Fabric's repository-scoped governance — and how they compose into something stronger than either alone |
| [Skills as Code Transformation](./skills-as-code-transformation.md) | NanoClaw's revolutionary skills model — where Claude Code modifies your fork — and the Fabric's committed-configuration model as two expressions of the same idea |
| [Transformation Map](./transformation-map.md) | The concrete Source → Transformation → Execution plan for absorbing NanoClaw into a Fabric module |
| [Governance Alignment](./governance-alignment.md) | Container isolation, mount security, credential proxy, sender allowlists, and the Four Laws composed |
| [Cost and Constraints](./cost-and-constraints.md) | Actions minutes, token budgets, storage growth, and the economics of a minimal-footprint agent on GitHub |

---

## The Source

[NanoClaw](https://github.com/qwibitai/nanoclaw) is a personal AI assistant containing:

- **Single Node.js process** — one orchestrator (`src/index.ts`) managing state, message loop, and agent invocation — no microservices, no message queues, no abstraction layers
- **Container-isolated agents** — Claude Agent SDK running inside Docker or Apple Container with filesystem isolation, non-root execution, and ephemeral containers per invocation
- **Multi-channel messaging** — WhatsApp, Telegram, Discord, Slack, Gmail added via skills that self-register at startup through a channel registry (`src/channels/registry.ts`)
- **Per-group memory** — each conversation group has its own `CLAUDE.md`, isolated filesystem, and runs in its own container sandbox with only that filesystem mounted
- **SQLite persistence** — messages, groups, sessions, task state, and run history stored in a single database
- **Skill-based customization** — 20+ Claude Code skills (`.claude/skills/`) that transform the codebase: `/setup`, `/add-whatsapp`, `/add-telegram`, `/add-discord`, `/add-gmail`, `/customize`, `/debug`
- **Credential proxy** — real API keys never enter containers; a host-side HTTP proxy injects authentication headers transparently
- **Agent swarms** — teams of specialized agents that collaborate on complex tasks
- **Task scheduler** — recurring and one-time jobs that run Claude in containerized group context with IPC for messaging
- **Mount security** — external allowlist at `~/.config/nanoclaw/mount-allowlist.json`, symlink resolution, blocked patterns for credentials, read-only project root
- **Six runtime dependencies** — `better-sqlite3`, `cron-parser`, `pino`, `pino-pretty`, `yaml`, `zod`

The [githubification analysis](https://github.com/japer-technology/githubification/blob/main/.githubification/lesson-from-nanoclaw.md) classified this as a **Type 1 — AI Agent Repo** and noted the defining insight: "The best agent to Githubify is one that was already designed to be understood by an AI."

---

## The Fabric Lens

Where Githubification asks "can this run on GitHub?", the Fabric asks:

1. **Anti-Complexity** — NanoClaw was built as a reaction to OpenClaw's complexity. The Fabric absorbs both. What does that reveal about the relationship between source complexity and Fabric expression?
2. **AI-Legibility** — NanoClaw's entire codebase fits inside a context window (~35k tokens). When the Fabric ingests it, does the agent fully comprehend itself? What does self-comprehension mean for a repository-native mind?
3. **Container vs. Repository** — NanoClaw isolates agents in Linux containers. The Fabric isolates them in ephemeral runners. These are two expressions of the same security principle. How do they compose?
4. **Skills as Committed Mutations** — NanoClaw's skills are Claude Code instructions that modify source code. Fabric configuration is committed YAML and JSON. Both treat the repository as the source of truth. Are they the same pattern?
5. **The Last Mile** — NanoClaw is closer to a Fabric module than any previous case study. What remains in the gap? And what does closing that gap teach us?
6. **Governance** — How does NanoClaw's container isolation, mount security, credential proxy, and sender allowlists compose with the Four Laws and DEFCON levels?
7. **Cost** — NanoClaw is the lightest agent the Fabric has analyzed. What does minimal footprint mean for the economics of always-available AI?

These seven questions organize the analysis that follows.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

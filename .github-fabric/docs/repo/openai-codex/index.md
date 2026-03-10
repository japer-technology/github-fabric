# OpenAI Codex: Rethought from the Fabric

> [Docs Index](../../docs/index.md) · [The Repo Is the Mind](../../docs/the-repo-is-the-mind.md) · [The Four Laws](../../docs/the-four-laws-of-ai.md)

> A complete analysis of [OpenAI Codex](https://github.com/openai/codex) — a terminal-native coding agent from OpenAI with OS-level sandboxing, graduated approval modes, hierarchical AGENTS.md memory, multi-provider support, and a Rust rewrite that compiles to a single binary — reexamined through the architecture, governance, and philosophy of GitHub Fabric.

---

## Why This Analysis Exists

The [githubification](https://github.com/japer-technology/githubification) project asks a practical question about every repository it examines: *how do you make this run on GitHub?* For OpenAI Codex, that question has a peculiar edge — because Codex already runs *on* repositories. It reads your code, modifies your files, and commits changes. It already uses GitHub Actions in CI mode. It already reads `AGENTS.md` from the repository root. It already sandboxes execution inside containers.

Codex is not an agent that needs to be taught about repositories. It is an agent that was **built to operate inside them.** The gap between "Codex as a local CLI tool" and "Codex as a Fabric module" is narrower than any previous case study — and yet the remaining distance reveals something profound about both systems.

Previous Fabric analyses examined agents from the outside: [Agenticana](../agenticana/index.md) challenged the Fabric with plurality (twenty agents). [OpenClaw](../openclaw/index.md) challenged it with persistence (an always-on gateway). [NanoClaw](../nanoclaw/index.md) challenged it with minimalism (an agent small enough to read itself). Codex challenges the Fabric with **provenance** — this is a coding agent built by OpenAI, the company that supplies the reasoning engine the Fabric itself depends on. When the maker of the mind builds a body for it, what does the Fabric — which claims the repository is the natural body — have to say?

This analysis asks: *what does OpenAI Codex mean when the repository is the mind?*

---

## Documents

| Document | Focus |
|----------|-------|
| [What Codex Teaches Fabric](./what-codex-teaches-fabric.md) | The core analysis: what a terminal-native coding agent from the LLM provider itself reveals about the Fabric's assumptions, strengths, and blind spots |
| [Sandbox as Governance](./sandbox-as-governance.md) | Codex's Seatbelt/Docker sandbox vs. the Fabric's repository-scoped governance — and how they compose into defense-in-depth |
| [Approval Modes as DEFCON](./approval-modes-as-defcon.md) | Suggest, Auto Edit, and Full Auto mapped to DEFCON readiness levels — graduated autonomy as a shared pattern |
| [AGENTS.md as Committed Memory](./agents-md-as-committed-memory.md) | Codex's hierarchical AGENTS.md loading and the Fabric's committed-configuration model as two expressions of the same principle |
| [Transformation Map](./transformation-map.md) | The concrete Source → Transformation → Execution plan for absorbing Codex into a Fabric module |
| [Governance Alignment](./governance-alignment.md) | Sandbox composition, approval-mode mapping, trust model alignment, and the Four Laws applied to a coding agent |
| [Cost and Constraints](./cost-and-constraints.md) | Actions minutes, token budgets, Rust binary economics, build overhead, and the cost profile of a compiled coding agent on GitHub |

---

## The Source

[OpenAI Codex](https://github.com/openai/codex) is a coding agent containing:

- **Rust core** (`codex-rs/`) — the primary implementation, a Cargo workspace with crates for `core` (agent loop, sandbox, config, prompts), `exec` (command execution and sandboxing), `tui` (terminal UI via ratatui), `linux-sandbox`, `macos-sandbox`, `app-server`, `app-server-protocol`, and supporting utilities
- **Legacy TypeScript CLI** (`codex-cli/`) — the original Node.js implementation, now superseded by the Rust version but still distributed via `npm i -g @openai/codex`
- **TypeScript SDK** (`sdk/typescript/`) — a programmatic API (`@openai/codex-sdk`) for building on top of Codex
- **Shell Tool MCP** (`shell-tool-mcp/`) — an MCP (Model Context Protocol) server that exposes Codex's shell execution as a tool for other agents
- **OS-level sandboxing** — Apple Seatbelt on macOS (read-only jail, network blocked), Docker containers on Linux (custom iptables firewall, directory-scoped mounts)
- **Three approval modes** — Suggest (read-only, ask for everything), Auto Edit (auto-apply patches, ask for shell), Full Auto (execute everything, network-disabled, directory-sandboxed)
- **Hierarchical AGENTS.md** — memory loaded from `~/.codex/AGENTS.md` (global), `AGENTS.md` (repo root), and `AGENTS.md` (current directory), merged top-down
- **Multi-provider support** — OpenAI (default), OpenRouter, Azure, Gemini, Ollama, Mistral, DeepSeek, xAI, Groq, and any OpenAI-compatible API
- **Non-interactive CI mode** — `codex -q --approval-mode full-auto "task"` for headless pipeline execution
- **Bazel + Cargo dual build** — `MODULE.bazel` for hermetic builds alongside `Cargo.toml` workspaces
- **Apache 2.0 license** — open source with CLA requirement

The [githubification](https://github.com/japer-technology/githubification) project classifies this as a **Type 2 — Developer Tool Repo** — software that operates on repositories rather than providing a standalone service. The defining characteristic: Codex already treats the repository as its workspace. The Fabric treats the repository as the mind. The distance between workspace and mind is the subject of this analysis.

---

## The Fabric Lens

Where Githubification asks "can this run on GitHub?", the Fabric asks:

1. **Provenance** — Codex is built by the company that provides the reasoning engine. When the LLM vendor builds the agent body, what does that mean for a framework that claims the repository — not the vendor — should be the seat of intelligence?
2. **Sandbox vs. Repository** — Codex isolates execution with OS-level sandboxes (Seatbelt, Docker, landlock). The Fabric isolates with repository-scoped governance. These are two approaches to the same problem. How do they compose?
3. **Approval Modes vs. DEFCON** — Codex graduates autonomy through Suggest → Auto Edit → Full Auto. The Fabric graduates through DEFCON 1–5. Are these the same pattern expressed differently?
4. **AGENTS.md vs. Committed Configuration** — Codex loads behavioral instructions from hierarchical markdown files in the repository. The Fabric stores agent identity in committed configuration. Both treat the repository as the source of truth for agent behavior. Is the pattern identical?
5. **Terminal vs. Issue** — Codex's native interface is a terminal REPL. The Fabric's native interface is a GitHub Issue. What is lost and gained in this channel transformation?
6. **Rust Binary vs. Node.js Runtime** — Codex is a compiled Rust binary (~15 MB). Previous Fabric modules used interpreted runtimes. What does compilation mean for the Fabric's build economics?
7. **Cost** — Codex is free to run locally (you pay only for API tokens). On the Fabric, you pay for Actions minutes, git storage, and build time. What are the economics of a Rust coding agent on GitHub infrastructure?

These seven questions organize the analysis that follows.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

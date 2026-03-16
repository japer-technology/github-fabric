# Moltis: Rethought from the Fabric

> [Docs Index](../../index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> A complete analysis of [Moltis](https://github.com/moltis-org/moltis) — a local-first AI gateway written in Rust, 46 modular crates compiled into a single binary, zero `unsafe` code with 3,100+ tests, multi-channel communication (Web UI, Telegram, Discord, WhatsApp, MS Teams, Slack), Docker and Apple Container sandboxing, an encrypted vault (XChaCha20-Poly1305 + Argon2id), MCP server support, voice I/O, memory with hybrid vector + full-text search, and a hook-based lifecycle system — reexamined through the architecture, governance, and philosophy of GitHub Fabric.

---

## Why This Analysis Exists

The [githubification](https://github.com/japer-technology/githubification) project asks how to make repositories run on GitHub as infrastructure. Previous Fabric analyses examined systems along a spectrum: [Agenticana](../agenticana/index.md) was a twenty-agent swarm. [OpenClaw](../openclaw/index.md) was a persistent multi-channel gateway. [Pi-Mono](../pi-mono/index.md) was the toolkit from which agents are built. [OpenAI Codex](../openai-codex/index.md) was a vendor-built coding agent. [Kilocode](../kilocode/index.md) was a commercial platform that had become its own marketplace and economy.

Moltis is different from all of them in one fundamental way: it is **local-first by conviction**. Where every previous subject either ran on a cloud service, assumed a cloud relay, or delegated to a vendor API through a thin client, Moltis insists that the intelligence sits on **your hardware**. Your keys never leave your machine. Every command runs in a sandboxed container, never on your host. The 44 MB binary needs no Node.js, no npm, no runtime — just the machine you own.

This is the philosophical opposite of Githubification. The Fabric says: "GitHub is the runtime, GitHub is the future." Moltis says: "Your hardware is the runtime, sovereignty is the future." When you rethink a system built on local sovereignty through the lens of a system built on platform governance, the collision is not incidental — it is **structural**. Every architectural decision in Moltis — from the encrypted vault to the feature-gated crates to the container sandbox — exists to ensure that the owner retains control. Every architectural decision in the Fabric — from GitHub Actions as compute to Git as memory to Issues as the interface — exists to ensure that the repository retains legibility.

The question this analysis asks is not "how do you run Moltis on GitHub?" — it is **"what does the Fabric learn from a system that was built to make GitHub unnecessary?"**

---

## Documents

| Document | Focus |
|----------|-------|
| [Local-First vs. GitHub-First](./local-first-vs-github-first.md) | The foundational tension — Moltis runs on your hardware, the Fabric runs on GitHub. What happens when sovereignty meets governance, and why neither alone is sufficient |
| [The Rust Fortress](./the-rust-fortress.md) | 46 crates, zero `unsafe` code, workspace-wide deny, 3,100+ tests — Moltis's security-through-language vs. the Fabric's security-through-governance, and what defense-in-depth means for an AI gateway |
| [Channels as Surfaces](./channels-as-surfaces.md) | Telegram, Discord, WhatsApp, MS Teams, Slack, Web UI, API — seven communication channels vs. the Fabric's single surface (GitHub Issues). How multi-channel collapses, what is lost, and what is gained |
| [The Modular Crate Architecture](./the-modular-crate-architecture.md) | Feature-gated compilation, optional crates, lightweight mode for Raspberry Pi — how 46 crates compose into one binary and what selective composition means for the Fabric |
| [Vault and Secrets](./vault-and-secrets.md) | XChaCha20-Poly1305 encryption, Argon2id key derivation, passkey authentication — local secret management vs. GitHub Secrets, and where trust boundaries live |
| [The Gateway Pattern](./the-gateway-pattern.md) | Moltis as a local AI gateway between users and LLM providers — multi-provider routing, streaming, agent loop with sub-agent delegation. How the gateway pattern compares to the Fabric's direct provider model |
| [What Moltis Teaches Fabric](./what-moltis-teaches-fabric.md) | The synthesis: what the Fabric learns from a system that was built to make cloud relays unnecessary — sovereignty as a design value, the binary as a trust boundary, and governance that can coexist with independence |

---

## The Source

[Moltis](https://github.com/moltis-org/moltis) is a Rust workspace containing 46+ modular crates compiled into a single binary:

**Core** (always compiled):

| Crate | LoC | Role |
|-------|-----|------|
| `moltis` (cli) | 4.0K | Entry point, CLI commands |
| `moltis-agents` | 9.6K | Agent loop, streaming, prompt assembly |
| `moltis-providers` | 17.6K | LLM provider implementations |
| `moltis-gateway` | 36.1K | HTTP/WS server, RPC, auth |
| `moltis-chat` | 11.5K | Chat engine, agent orchestration |
| `moltis-tools` | 21.9K | Tool execution, sandbox |
| `moltis-config` | 7.0K | Configuration, validation |
| `moltis-sessions` | 3.8K | Session persistence |
| `moltis-plugins` | 1.9K | Hook dispatch, plugin formats |
| `moltis-service-traits` | 1.3K | Shared service interfaces |
| `moltis-common` | 1.1K | Shared utilities |
| `moltis-protocol` | 0.8K | Wire protocol types |

**Optional** (feature-gated or additive):

| Category | Crates | Combined LoC |
|----------|--------|-------------|
| Web UI | `moltis-web` | 4.5K |
| GraphQL | `moltis-graphql` | 4.8K |
| Voice | `moltis-voice` | 6.0K |
| Memory | `moltis-memory`, `moltis-qmd` | 5.9K |
| Channels | `moltis-telegram`, `moltis-whatsapp`, `moltis-discord`, `moltis-msteams`, `moltis-slack`, `moltis-channels` | 14.9K |
| Browser | `moltis-browser` | 5.1K |
| Scheduling | `moltis-cron`, `moltis-caldav` | 5.2K |
| Extensibility | `moltis-mcp`, `moltis-skills`, `moltis-wasm-tools` | 9.1K |
| Auth & Security | `moltis-auth`, `moltis-oauth`, `moltis-onboarding`, `moltis-vault` | 6.6K |
| Networking | `moltis-network-filter`, `moltis-tls`, `moltis-tailscale` | 3.5K |
| Provider setup | `moltis-provider-setup` | 4.3K |
| Import | `moltis-openclaw-import` | 7.6K |
| Apple native | `moltis-swift-bridge` | 2.1K |
| Metrics | `moltis-metrics` | 1.7K |

The architecture is a local AI gateway:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Web UI    │  │  Telegram   │  │  Discord    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────┬───────┴────────┬───────┘
                │   WebSocket    │
                ▼                ▼
        ┌─────────────────────────────────┐
        │          Gateway Server         │
        │   (Axum · HTTP · WS · Auth)     │
        ├─────────────────────────────────┤
        │        Chat Service             │
        │  ┌───────────┐ ┌─────────────┐  │
        │  │   Agent   │ │    Tool     │  │
        │  │   Runner  │◄┤   Registry  │  │
        │  └─────┬─────┘ └─────────────┘  │
        │        │                        │
        │  ┌─────▼─────────────────────┐  │
        │  │    Provider Registry      │  │
        │  │  Multiple providers       │  │
        │  │  (Codex · Copilot · Local)│  │
        │  └───────────────────────────┘  │
        ├─────────────────────────────────┤
        │  Sessions  │ Memory  │  Hooks   │
        │  (JSONL)   │ (SQLite)│ (events) │
        └─────────────────────────────────┘
                       │
               ┌───────▼───────┐
               │    Sandbox    │
               │ Docker/Apple  │
               │  Container    │
               └───────────────┘
```

Key design patterns:

- **Workspace-wide `unsafe` deny** — `unsafe_code = "deny"` in workspace lints, with only opt-in FFI wrappers behind the `local-embeddings` feature flag.
- **Feature-gated compilation** — `--no-default-features --features lightweight` produces a minimal binary for constrained devices.
- **Container sandbox** — Docker and Apple Container isolation per session, with SSRF protection, DNS resolution blocking, and loopback/private/link-local prevention.
- **Encrypted vault** — XChaCha20-Poly1305 + Argon2id for secrets at rest, `secrecy::Secret` with zeroed-on-drop for secrets in memory.
- **Hook lifecycle** — 15 event types with circuit breaker, including `BeforeToolCall` hooks that can inspect and block any tool invocation.
- **OpenClaw import** — A dedicated `moltis-openclaw-import` crate for migrating from OpenClaw, revealing the competitive lineage.

The project philosophy emphasizes **sovereignty**: your keys never leave your machine, every command runs in a sandboxed container, and the single binary needs no external runtime. Moltis recently reached the front page of Hacker News and is actively positioned against cloud-dependent alternatives.

---

## The Fabric Lens

Where Githubification asks "can this run on GitHub?", the Fabric asks:

1. **Local-First vs. GitHub-First** — Moltis is built on a conviction that your hardware is the only trustworthy runtime. The Fabric is built on a conviction that GitHub is the only legible runtime. These are not the same conviction — but they share a root: **the belief that where intelligence runs determines who governs it.** Can governance survive a change of venue?
2. **The Rust Fortress** — Moltis uses Rust's ownership model, workspace-wide `unsafe` deny, and 3,100+ tests to guarantee memory safety and behavioral correctness. The Fabric uses committed configuration, PR review, and DEFCON levels to guarantee governance correctness. These are two different security models — one linguistic, one procedural. Can they compose?
3. **Channels as Surfaces** — Moltis communicates through seven channels: Web UI, Telegram, Discord, WhatsApp, MS Teams, Slack, and API. The Fabric communicates through one: GitHub Issues. When seven channels collapse to one, what disappears and what concentrates?
4. **The Modular Crate Architecture** — 46 crates, feature-gated into a single binary, with a lightweight mode for Raspberry Pi. The Fabric has no modular compilation — it has configuration files. Can the Fabric selectively compose with a system designed for selective compilation?
5. **Vault and Secrets** — Moltis encrypts secrets locally with XChaCha20-Poly1305, derives keys with Argon2id, and authenticates with passkeys. The Fabric stores secrets in GitHub Secrets, references them by name, and trusts GitHub's infrastructure. These are two trust models. Where is the boundary?
6. **The Gateway Pattern** — Moltis is a gateway — a process that sits between users and LLM providers, routing requests, managing sessions, and orchestrating agents. The Fabric calls providers directly from Actions. What does the Fabric gain from a gateway, and what does it lose?
7. **Sovereignty and Governance** — Moltis's entire architecture serves one goal: the owner retains control. The Fabric's entire architecture serves one goal: the repository retains legibility. These goals are not opposed — but they are not identical. What does the Fabric learn from a system that treats sovereignty, not legibility, as the primary design value?

These seven questions organize the analysis that follows.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

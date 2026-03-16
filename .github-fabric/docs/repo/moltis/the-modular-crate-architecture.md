# The Modular Crate Architecture

> [Moltis Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> Moltis is 46 crates that compile into one binary. The Fabric is configuration files that commit into one repository. Both are modular — but Moltis's modularity is **compiled** while the Fabric's modularity is **declared**. What the Fabric learns is that selective composition — choosing which capabilities to include — is a governance decision, not just a build decision.

---

## 1. The Crate as a Governance Unit

In Moltis's architecture, each crate is:

- **Separately compilable** — can be built and tested in isolation
- **Explicitly dependent** — Cargo.toml declares every dependency
- **Independently auditable** — bounded scope, defined interface
- **Feature-gatable** — can be included or excluded by feature flag

This means the crate is a natural **governance boundary**. The question "should this Moltis instance have voice capability?" is answered by whether `moltis-voice` is included in the feature set. The question "should this instance support Telegram?" is answered by whether `moltis-telegram` is compiled in.

The Fabric has no equivalent to compilation-level feature gating. Its modularity is configuration: which model to use, which tools to allow, which DEFCON level to set. But the analogy holds: **both systems use selection to define capability boundaries.**

| Selection Type | Moltis | Fabric |
|---------------|--------|--------|
| What capabilities exist | Feature flags in Cargo.toml | Tool allowlists in committed config |
| What providers are available | Provider feature flags | Model configuration in committed config |
| What channels are active | Channel crate inclusion | Channel list in committed config (N/A currently) |
| What security layers apply | Auth/vault/TLS crate inclusion | DEFCON level, review gates |
| What runs on constrained hardware | `--features lightweight` | Not applicable (GitHub runs on GitHub) |

---

## 2. The Lightweight Mode Pattern

Moltis supports constrained devices through compilation flags:

```bash
cargo build --no-default-features --features lightweight
```

This excludes heavy optional crates (voice, browser, WASM tools, multiple channels) and produces a binary suitable for a Raspberry Pi or similar device. The same codebase serves both a fully-featured Mac Pro installation and a minimal edge device.

The Fabric has no analogous constraint — GitHub Actions runners are standardized — but the pattern is instructive. It demonstrates that **a system can be maximally capable and minimally deployed from the same source**. The governance question is not "what can the system do?" but "what should this particular instance do?"

The Fabric could adopt this pattern for agent configuration: a full-capability agent definition with selective activation per repository. One repository might enable code review + testing. Another might enable only documentation generation. The same agent source, different committed configurations.

---

## 3. The Core/Optional Boundary

Moltis draws a clear line between core crates (always compiled) and optional crates (feature-gated):

**Core** — 12 crates, ~117K LoC: the minimum required for a functioning AI gateway. Agent loop, provider registry, chat engine, gateway server, sessions, configuration, tools, plugins, protocol, service traits, common utilities, and the CLI entry point.

**Optional** — 34+ crates, ~97K LoC: everything else. Voice, memory with embeddings, browser automation, all messaging channels, scheduling, MCP, skills, WASM tools, vault, auth, OAuth, metrics, network filtering, TLS, Tailscale, provider setup, OpenClaw import, Apple native bridge, and the web UI.

This means the agent's cognitive core — the ability to receive a request, route it to an LLM provider, execute tools, and return a response — is distinct from its peripheral capabilities. The peripherals are additive. Removing voice does not affect reasoning. Removing Telegram does not affect code execution.

The Fabric should recognize this pattern: **the agent's mind (reasoning, tool use) is separable from the agent's body (channels, UI, auth, scheduling).** When the Fabric composes with Moltis, it needs the mind — not necessarily the body. The gateway, agents, providers, chat, and tools are the essential interface. The channels, voice, browser, and scheduling are optional enrichments.

---

## 4. The Dependency Graph as Risk Map

Moltis's `Cargo.toml` declares 100+ external dependencies. Each is pinned to a specific version range. The workspace uses `resolver = "2"` for proper feature unification.

The dependency graph is also a **risk map**. Each external dependency is a potential supply chain vector:

| Risk Category | Dependencies | Mitigation |
|--------------|-------------|------------|
| **Cryptography** | `chacha20poly1305`, `argon2`, `sha2`, `hmac`, `p256` | Well-audited crates, no custom crypto |
| **Networking** | `reqwest`, `hyper`, `axum`, `tokio-tungstenite` | Established ecosystem crates |
| **Serialization** | `serde`, `serde_json`, `postcard`, `toml` | Foundational Rust ecosystem |
| **LLM providers** | `async-openai`, `genai` | Version-pinned, replaceable |
| **Platform SDKs** | `teloxide`, `serenity`, `slack-morphism`, `whatsapp-rust` | Each isolated in its own crate |
| **Database** | `sqlx` (SQLite) | Single database dependency |
| **WASM** | `wasmtime`, `wit-bindgen` | Mozilla-maintained runtime |

The Fabric's equivalent risk map is its model provider and tool dependencies. But where Moltis manages risk through compilation boundaries (a vulnerability in `teloxide` cannot affect `moltis-vault` because they share no code path), the Fabric manages risk through configuration boundaries (a compromised model provider is replaced by changing the committed configuration).

The composition: Moltis provides **compile-time dependency isolation**. The Fabric provides **governance-time dependency declaration**. Both are necessary — the first prevents technical compromise, the second prevents organizational blind spots.

---

## 5. The OpenClaw Import Crate

One of Moltis's 46 crates deserves special attention: `moltis-openclaw-import` (7.6K LoC). This is a dedicated migration crate for importing data from OpenClaw — the multi-channel personal AI assistant that the Fabric [previously analyzed](../openclaw/index.md).

The existence of this crate reveals several things:

1. **Competitive positioning** — Moltis positions itself as the successor to OpenClaw, providing a migration path for existing users.
2. **Data portability** — The import crate demonstrates that conversation history, configuration, and skills can be transferred between AI platforms.
3. **Ecosystem awareness** — Moltis acknowledges its predecessors and provides tooling to absorb their users.

For the Fabric, this crate is a reminder that **AI assistant ecosystems are not islands**. Users migrate between platforms. Data portability is a governance concern. The Fabric should ensure that its committed configuration and audit trails are portable — not locked to a single agent implementation.

---

## 6. WASM as a Tool Boundary

Moltis includes three WASM tool crates (`wasm-tools/calc`, `wasm-tools/web-fetch`, `wasm-tools/web-search`) built on Wasmtime. These provide sandboxed tool execution using WebAssembly's capability-based security model:

- **Memory isolation** — WASM modules cannot access the host's memory
- **Capability grants** — Each module declares what it needs (network access, file access)
- **Deterministic execution** — Same input produces same output
- **Language independence** — Tools can be written in any WASM-targeting language

This is a more granular sandbox than Docker containers. Where Docker isolates at the process level, WASM isolates at the function level. A WASM tool that fetches a web page cannot also read local files — the capability is not granted.

The Fabric could use this pattern for tool governance: instead of "allow/deny tool X," the governance could specify **capability grants** per tool. "This tool may access the network but not the filesystem. This tool may read files but not execute commands." WASM provides the technical enforcement; the Fabric provides the policy declaration.

---

## 7. Selective Composition: The Governance Pattern

The deepest lesson from Moltis's crate architecture is that **composition is selection, and selection is governance.**

Every decision about which crates to include in a Moltis build is a governance decision:

| Decision | Governance Implication |
|----------|----------------------|
| Include `moltis-voice` | This instance can receive voice input — who can speak to the AI? |
| Include `moltis-telegram` | This instance is accessible from Telegram — who has the bot token? |
| Include `moltis-browser` | This instance can automate browsers — what sites can it visit? |
| Include `moltis-vault` | This instance encrypts secrets locally — where is the vault key? |
| Exclude `moltis-mcp` | This instance cannot connect to MCP servers — reducing attack surface |
| Use `--features lightweight` | This instance has minimal capabilities — appropriate for edge deployment |

The Fabric should model this pattern in committed configuration. A Fabric configuration file that declares which capabilities an agent may use is the governance equivalent of a Cargo.toml feature flag set. Both say: "this is what this instance is allowed to do." The Moltis version is enforced by the compiler. The Fabric version is enforced by the governance process.

The complete model: **Moltis selects capabilities at compile time. The Fabric governs which capabilities are appropriate at commit time. The result is a system where capability selection is both technically enforced and organizationally accountable.**

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

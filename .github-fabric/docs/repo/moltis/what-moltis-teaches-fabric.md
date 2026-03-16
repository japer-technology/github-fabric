# What Moltis Teaches Fabric

> [Moltis Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> Moltis is the first system the Fabric has analyzed that was **designed to make the Fabric unnecessary**. It runs on your hardware, encrypts your secrets locally, sandboxes its own execution, and needs no cloud infrastructure. What it teaches is not about a specific capability or architecture pattern, but about the **relationship between sovereignty and governance** — and why the Fabric remains valuable even when the runtime is sovereign.

---

## 1. The Sovereignty Lesson: Governance Does Not Require Hosting

Every previous Fabric analysis assumed that Githubification meant running the system on GitHub Actions. Agenticana's swarm would run as workflows. OpenClaw's gateway would be rebuilt as an Action. Pi-Mono's toolkit would compile into workflow steps. OpenAI Codex would execute through GitHub's Copilot integration. Kilocode would serve through its SDK from an Actions runner.

Moltis breaks this assumption. You cannot meaningfully run a 44 MB Rust binary with Docker sandboxing, voice I/O, encrypted vault, and WebSocket streaming on a GitHub Actions runner — or rather, you could, but you would lose everything that makes Moltis valuable. The local-first design is not an accident; it is the **product's identity**.

The lesson: **the Fabric does not need to host the runtime to govern it.** The repository is the configuration source, the audit destination, and the governance authority. The binary runs wherever the sovereign decides — Mac Mini, Raspberry Pi, cloud VM, Docker container. The Fabric's value is not execution; it is accountability.

This is a conceptual expansion. The Fabric moves from "GitHub as runtime" to **"Git as governance, wherever the runtime."** The repository is still the mind. The binary is still the body. But the body can live far from GitHub, as long as it reports back to the repository.

---

## 2. The Binary Lesson: The Binary Is a Trust Boundary

Moltis distributes as a single compiled binary. There is no Node.js to install, no npm packages to download, no Python dependencies to resolve. The binary is the **complete, auditable, verifiable artifact**:

- **Sigstore keyless signing** — Every release is cryptographically signed, proving it was built by the Moltis GitHub Actions workflow
- **SBOM attached** — Software Bill of Materials for dependency verification
- **SLSA provenance** — Attestation of the build environment and process
- **Checksums** — SHA-256 and SHA-512 hashes for integrity verification

The Fabric currently has no equivalent concept of "the artifact." Its output is code committed to Git — source files, configuration, documentation. The binary is someone else's problem (the CI pipeline, the deployment tool, the package manager).

The lesson: **when the Fabric governs a local runtime, the binary itself becomes a governance concern.** Which version of Moltis is this instance running? Was it built from a signed release? Does its SBOM match the expected dependency set? Has it been tampered with?

The Fabric should extend its governance to include **artifact provenance**: committed references to specific, verified binary versions. Not "use Moltis" but "use Moltis v0.1.0, SHA-256 `abc123...`, Sigstore-verified, built from commit `def456...`." This is the same pattern the Fabric uses for model pinning — extended to the runtime itself.

---

## 3. The Hook Lesson: Lifecycle Governance Is Event-Driven

Moltis's plugin system provides 15 lifecycle event types with circuit breaker patterns:

| Event | Purpose |
|-------|---------|
| `BeforeToolCall` | Inspect and optionally block any tool invocation |
| `AfterToolCall` | Process tool results, log, or transform output |
| `BeforeModelCall` | Inspect and optionally modify the prompt before sending |
| `AfterModelCall` | Process model response before it reaches the user |
| `OnSessionStart` | Initialize session-specific state |
| `OnSessionEnd` | Clean up, persist, or archive session data |
| Other events | Message receipt, error handling, scheduling triggers, etc. |

The `BeforeToolCall` hook is particularly significant for governance: it allows **runtime policy enforcement**. A hook can inspect the tool name, the arguments, and the context, and decide whether to allow or block the call. This is runtime governance — not just committed configuration, but active enforcement during execution.

The Fabric's governance is currently **pre-execution**: configuration is committed before the agent runs, and the audit trail is examined after. Moltis's hooks provide **during-execution** governance. The composition adds a third temporal layer:

| When | Governance | Provider |
|------|-----------|----------|
| **Before** | Committed configuration, PR review, DEFCON levels | Fabric |
| **During** | Hook-based policy enforcement, circuit breakers | Moltis |
| **After** | Audit trail, cost accounting, decision review | Fabric |

The lesson: governance is not a single checkpoint. It is a **lifecycle**. The Fabric provides the before and after. Moltis provides the during. Together, they cover the complete temporal surface.

---

## 4. The Memory Lesson: Memory Needs Both Persistence and Search

Moltis's memory system combines three storage mechanisms:

| Mechanism | Purpose |
|-----------|---------|
| SQLite | Structured data, session metadata, conversation records |
| Full-text search (FTS) | Keyword-based retrieval across conversation history |
| Vector embeddings | Semantic similarity search for long-term memory |

This hybrid approach means Moltis can find relevant context through both exact matches (FTS: "the user mentioned Kubernetes on Tuesday") and semantic similarity (vectors: "conversations about container orchestration").

The Fabric's memory is Git. Every commit is permanent, every file is searchable (through `git grep`), and every change is attributable. But Git provides neither full-text search indexes nor semantic vector search. The Fabric's memory is **complete but unindexed** — everything is there, but finding the right thing requires knowing where to look.

The lesson: **governance-grade memory needs both persistence (Git provides this) and retrieval (Git does not).** A composed system would commit memory artifacts to the repository (persistence, auditability) while maintaining local indexes for efficient retrieval (search, relevance). The repository is the archive; the local index is the working memory.

---

## 5. The Competition Lesson: The Fabric's Value Is Orthogonal

Moltis positions itself against cloud-dependent alternatives:

| Dimension | Moltis | Cloud-Dependent Alternatives |
|-----------|--------|------------------------------|
| Runtime | Your hardware | Vendor's cloud |
| Secret storage | Local vault | Vendor-managed |
| Data residency | Your jurisdiction | Vendor's jurisdiction |
| Dependency | Single binary | npm/Node.js/runtime |
| Safety | Zero `unsafe`, 3,100+ tests | Varies |

This competitive framing reveals something important: **the Fabric is not a competitor to Moltis.** The Fabric does not provide a runtime. It does not store secrets. It does not manage data residency. It does not execute agent loops. The Fabric provides governance — and governance is orthogonal to all of Moltis's competitive dimensions.

A Moltis user who adopts the Fabric does not switch from Moltis to the Fabric. They **add governance to their existing Moltis deployment.** Configuration becomes committed. Changes become reviewable. Decisions become auditable. Trust boundaries become declared. The Moltis binary is unchanged; what changes is the accountability around it.

This orthogonality is the Fabric's strongest position with sovereign systems: **the Fabric does not compete with sovereignty — it complements it.** You can run whatever you want, wherever you want, however you want. The Fabric just asks that the decisions be committed.

---

## 6. The OpenClaw Import Lesson: Ecosystems Are Fluid

Moltis includes `moltis-openclaw-import` — a 7.6K LoC crate dedicated to importing data from OpenClaw. This reveals that the AI assistant ecosystem is not static. Users migrate. Platforms rise and fall. Data portability is a real operational concern.

The Fabric previously analyzed [OpenClaw](../openclaw/index.md). Now it encounters a system that can **absorb** OpenClaw's data. The ecosystem is fluid: today's governed system (OpenClaw under Fabric governance) might migrate to tomorrow's sovereign system (Moltis). The governance must survive the migration.

The lesson: **the Fabric's governance artifacts — committed configuration, audit trails, trust declarations — must be portable.** If a team migrates from OpenClaw to Moltis, the governance history should not be lost. The repository preserves it: the Git history still shows what was configured, who approved it, and when it changed. The governance is in the repository, not in the runtime. When the runtime changes, the governance persists.

---

## 7. The Synthesis: Sovereignty + Governance = Accountable Independence

Moltis teaches the Fabric that sovereignty and governance are not opposites. They are complementary design values that serve different needs:

| Need | Sovereignty (Moltis) | Governance (Fabric) |
|------|---------------------|---------------------|
| Who controls the runtime? | The user | The repository |
| Where do secrets live? | On user hardware | Declared in committed config |
| How is the agent configured? | Local config files | Committed, reviewed config files |
| Who audits decisions? | The user (local logs) | The team (Git history) |
| What survives hardware failure? | Backups (user responsibility) | Git (platform responsibility) |
| What survives team changes? | Nothing (single-user) | Everything (repository persists) |

The composed system provides both:

- **The user controls the runtime** — Moltis runs on their hardware, with their keys, in their jurisdiction.
- **The repository governs the behavior** — Configuration, model selection, tool permissions, cost limits, and trust declarations are committed, reviewed, and auditable.
- **The audit trail is bidirectional** — Configuration changes flow from repository to runtime. Usage reports flow from runtime to repository.
- **The binary is verified** — The specific Moltis version is declared in committed configuration with Sigstore verification.

This is **accountable independence**: the freedom to run your own AI gateway, governed by a shared, auditable, committed configuration. Moltis provides the independence. The Fabric provides the accountability. Neither diminishes the other.

---

## 8. Summary: The Seven Lessons

| # | Lesson | Source | Implication |
|---|--------|--------|-------------|
| 1 | Governance does not require hosting | Local-First vs. GitHub-First | The Fabric governs runtimes it does not host — "Git as governance, wherever the runtime" |
| 2 | The binary is a trust boundary | The Rust Fortress | Extend governance to artifact provenance — version, signature, SBOM |
| 3 | Lifecycle governance is event-driven | The Rust Fortress + Hooks | Add during-execution governance (hooks) to before/after governance (config/audit) |
| 4 | Memory needs persistence and search | The Gateway Pattern | Commit memory artifacts to Git, maintain local indexes for retrieval |
| 5 | The Fabric's value is orthogonal to sovereignty | Channels as Surfaces + All | Governance complements sovereignty — it does not compete with it |
| 6 | Ecosystems are fluid, governance must be portable | The Modular Crate Architecture | Repository-based governance survives runtime migration |
| 7 | Sovereignty + governance = accountable independence | All documents | Freedom to run independently, accountability through committed configuration |

Moltis is not a system the Fabric absorbs. It is not a system the Fabric runs on GitHub. It is the first system that forces the Fabric to articulate what it actually provides when the runtime is not GitHub: **governance**. Committed configuration. Auditable decisions. Reviewable changes. Portable accountability.

The Fabric is richer for understanding that its value does not depend on being the runtime. It depends on being the **record** — the place where decisions are committed, reviewed, and preserved. Moltis can be sovereign. The Fabric can be the governance. And the user — the human — can have both independence and accountability.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

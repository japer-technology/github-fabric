# Local-First vs. GitHub-First

> [Moltis Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> Moltis insists that intelligence runs on your hardware. The Fabric insists that intelligence runs on GitHub. This is not a feature comparison — it is a collision of design philosophies. What the Fabric learns from the collision is that **governance and sovereignty are two solutions to the same problem: who controls the AI?**

---

## 1. Two Convictions, One Root

Moltis and the Fabric start from the same fear: **unaccountable AI**. An AI that runs somewhere you cannot see, using data you cannot inspect, making decisions you cannot audit. Both systems exist because that fear is rational.

But the two systems reach opposite architectural conclusions:

| | Moltis | Fabric |
|---|--------|--------|
| **Runtime** | Your machine (Mac Mini, Raspberry Pi, any server you own) | GitHub Actions (ephemeral runners, managed infrastructure) |
| **Trust anchor** | The binary on your hardware | The repository on GitHub |
| **Secret store** | Encrypted vault on local disk (XChaCha20-Poly1305) | GitHub Secrets (platform-managed) |
| **Audit trail** | JSONL session files on local filesystem | Git history + PR review trail |
| **User interface** | Web UI, Telegram, Discord, WhatsApp, API | GitHub Issues |
| **Isolation model** | Docker/Apple Container per session | Ephemeral runner per workflow |
| **Persistence** | SQLite database, local config directory | Git commits, committed configuration |
| **Update model** | `brew upgrade` / `cargo install` / `docker pull` | PR → merge → Actions run |

The root is shared: **the belief that where intelligence runs determines who governs it.** Moltis chooses the machine. The Fabric chooses the repository. Neither is wrong — they serve different threat models.

---

## 2. The Threat Models Diverge

Moltis's threat model is **external dependency**. The system is designed so that no cloud provider, no SaaS relay, no third-party infrastructure sits between the user and the intelligence. Your API keys are encrypted locally. Your session data stays on your disk. Your container sandbox runs on your hardware. If every cloud service disappeared tomorrow, Moltis would still work — as long as you have an LLM provider's API endpoint.

The Fabric's threat model is **unaccountable behavior**. The system is designed so that every decision the AI makes is recorded in Git, reviewed through PRs, and visible to the team. The runtime is ephemeral and disposable. The intelligence is not owned — it is governed. If the AI produces wrong output, the audit trail shows what happened, who approved it, and how to reverse it.

These threat models create different architectures:

| Threat | Moltis Response | Fabric Response |
|--------|----------------|-----------------|
| Credential theft | Encrypt locally, never transmit | Store in GitHub Secrets, reference by name |
| Supply chain attack | Single binary, no npm, no Node.js, zero `unsafe` | Committed dependencies, PR review for changes |
| Unaudited AI actions | JSONL session logs, `BeforeToolCall` hooks | Git history, PR-gated merge, DEFCON levels |
| Data exfiltration | SSRF protection, network filter, container isolation | GitHub's network policies, Actions sandboxing |
| Provider lock-in | Multi-provider registry, local model support | Committed model configuration, provider abstraction |
| Unauthorized access | Password + passkey + API key auth | GitHub permissions, team-based access control |

The Fabric should notice something: Moltis's answers are **technical** (encrypt, sandbox, filter). The Fabric's answers are **procedural** (commit, review, approve). Both are valid defenses. Neither covers the full threat surface alone.

---

## 3. What Local-First Gets Right

Moltis's local-first architecture provides three capabilities that the Fabric currently lacks:

### 3a. Offline Operation

Moltis can operate without internet access if a local model is available. The Fabric cannot — it requires GitHub's infrastructure to be online, the Actions runner pool to be available, and the LLM provider's API to respond.

This is not an academic distinction. GitHub has outages. LLM providers have rate limits. Network partitions happen. A local-first system degrades gracefully; a cloud-first system fails completely.

### 3b. Latency Sovereignty

When Moltis runs on a Mac Mini on your desk, the latency between you and the agent is measured in milliseconds. When the Fabric runs on GitHub Actions, the latency includes: issue event delivery, runner provisioning, workflow startup, LLM API round-trip, commit + push, and PR creation. The Fabric's round-trip is measured in minutes.

For interactive workflows (voice, real-time chat, browser automation), this latency gap is disqualifying. Moltis supports voice I/O with 15+ providers precisely because the gateway is local. The Fabric cannot support voice — GitHub Issues are text-based and asynchronous.

### 3c. Data Residency

Moltis's data — sessions, memory, vault, configuration — lives on hardware the user physically controls. The user can point to the disk, the building, the jurisdiction. The Fabric's data lives on GitHub's infrastructure, subject to GitHub's terms of service, Microsoft's corporate policies, and the jurisdiction of GitHub's data centers.

For regulated industries, for classified work, for personal sovereignty — data residency is not a preference, it is a requirement. Moltis meets it structurally. The Fabric delegates it to GitHub.

---

## 4. What GitHub-First Gets Right

The Fabric's GitHub-first architecture provides three capabilities that Moltis currently lacks:

### 4a. Team Legibility

Moltis runs on one person's machine. When the AI makes a decision — chooses a model, executes a tool, modifies a file — that decision is recorded in local JSONL files. The team cannot see it unless the user shares the logs.

The Fabric records every decision in Git. The team sees the PR. The reviewer examines the diff. The audit trail is public to the repository's collaborators by default. **The Fabric makes AI behavior a team sport; Moltis makes it a solo practice.**

### 4b. Institutional Memory

When a Moltis user's machine fails, the session history, the memory database, and the vault are at risk. Backups are the user's responsibility. The institutional knowledge the AI accumulated lives on a single disk.

The Fabric's memory is Git. It survives hardware failures, team member departures, and organizational changes. The repository's history is the institution's memory. This is not just durability — it is **organizational continuity**.

### 4c. Governance by Default

Moltis has strong security features — vault encryption, container sandboxing, hook gating — but governance is opt-in. The user must configure hooks, set up authentication, and choose to enable sandboxing. A misconfigured Moltis instance is unprotected.

The Fabric's governance is structural. The repository requires commits. Commits require PRs. PRs require review. This is not a feature to enable — it is the platform's architecture. **Governance is the default, not the exception.**

---

## 5. The Composition: Sovereign Governance

The collision between local-first and GitHub-first resolves not in one winning over the other, but in a **composition**: sovereign governance.

```
┌──────────────────────────────────┐
│        GitHub Repository         │
│  (configuration · audit trail)   │
│  ┌────────────────────────────┐  │
│  │   Committed Configuration  │  │
│  │  model: gpt-4o            │  │
│  │  sandbox: docker           │  │
│  │  vault: enabled            │  │
│  │  channels: [telegram]      │  │
│  └────────────┬───────────────┘  │
│               │ governs          │
└───────────────┼──────────────────┘
                │
                ▼
┌──────────────────────────────────┐
│       Moltis Instance            │
│  (runtime · execution · data)    │
│  ┌────────────────────────────┐  │
│  │   Local Execution          │  │
│  │  keys: encrypted vault     │  │
│  │  sandbox: Docker container │  │
│  │  memory: SQLite + vector   │  │
│  │  sessions: JSONL on disk   │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

In this model:

- **Configuration lives in the repository** — model selection, sandbox policy, channel configuration, cost limits, tool allowlists. These are committed, reviewed, and versioned. The Fabric provides the governance layer.
- **Execution lives on the user's hardware** — the Moltis binary runs locally, secrets stay in the vault, sessions persist on disk, containers sandbox tool execution. Moltis provides the sovereignty layer.
- **Synchronization is Git** — the Moltis instance pulls its configuration from the repository. Configuration changes require PRs. The audit trail is the repository's history. Sovereignty and governance share a single source of truth.

This is not Githubification — Moltis does not run on GitHub Actions. It is something the Fabric has not encountered before: **a governed sovereign system**. The intelligence runs on your machine, but the rules it follows are committed to your repository.

---

## 6. The Precedent: Config-as-Code for AI

The composition model described above has a precedent the Fabric already understands: **config-as-code**. Kubernetes clusters run on your infrastructure, but their configuration lives in Git repositories. Terraform manages cloud resources, but the state and plans are committed. Ansible provisions machines, but the playbooks are version-controlled.

Moltis extends this pattern to AI: the agent runs locally, but its behavior is governed by committed configuration. The Fabric does not need to run Moltis — it needs to **govern** Moltis. The repository becomes the control plane for a local runtime.

This is the pattern:

| Layer | Moltis | Fabric Equivalent |
|-------|--------|-------------------|
| Runtime | Single Rust binary on user hardware | Configuration committed to repository |
| Secrets | Encrypted vault on local disk | Secret references in committed config |
| Models | Multi-provider registry | Model pinned in committed config |
| Channels | Telegram, Discord, WhatsApp, etc. | Channel list in committed config |
| Tools | Tool registry with sandbox | Tool allowlist in committed config |
| Hooks | 15 event types with circuit breaker | Hook configuration in committed config |
| Memory | SQLite + FTS + vector on local disk | Memory policy in committed config |

Every decision Moltis makes at runtime can be traced back to a committed configuration. Every configuration change goes through PR review. The Fabric governs without hosting.

---

## 7. What Local-First Teaches GitHub-First

The deepest lesson is this: **the Fabric does not need to be the runtime to be the governor.** Previous analyses assumed that Githubification meant running the system on GitHub Actions. Moltis shows that a system can be sovereign — running on user hardware, managing its own secrets, providing its own isolation — while still being governed by a committed repository.

This expands the Fabric's model. It is not just "GitHub as infrastructure." It is "Git as governance, whatever the infrastructure." The repository is still the mind. The binary is just the body — and the body can live wherever the sovereign chooses.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

# The Rust Fortress

> [Moltis Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> Moltis uses Rust's ownership model and a workspace-wide `unsafe` deny to guarantee memory safety at compile time. The Fabric uses committed configuration and PR review to guarantee governance correctness at merge time. These are two security philosophies — **one that catches errors before the binary is built, and one that catches errors before the change is deployed.** Together, they form defense-in-depth.

---

## 1. Security Through Language

Moltis's `Cargo.toml` declares at the workspace level:

```toml
[workspace.lints.rust]
unsafe_code           = "deny"
unused_qualifications = "deny"

[workspace.lints.clippy]
expect_used = "deny"
unwrap_used = "deny"
```

This is not a guideline — it is a **compiler enforcement**. No crate in the workspace can use `unsafe`, `expect()`, or `unwrap()` without a lint override. The only exception is opt-in FFI wrappers behind the `local-embeddings` feature flag, which is not part of the core.

The implications are structural:

| Guarantee | Mechanism |
|-----------|-----------|
| No memory corruption | Rust ownership + borrow checker |
| No use-after-free | Lifetime enforcement |
| No data races | `Send` + `Sync` traits |
| No null pointer dereference | `Option<T>` instead of null |
| No panic in production paths | `unwrap_used = "deny"`, `expect_used = "deny"` |
| No undefined behavior | `unsafe_code = "deny"` workspace-wide |
| Secrets zeroed on drop | `secrecy::Secret<T>` + `zeroize` |

The Fabric has no equivalent. It does not control the language its agents are written in. It does not enforce memory safety. It does not prevent panics. The Fabric's security operates at a different layer — governance, not compilation.

---

## 2. Security Through Governance

The Fabric's security model is procedural, not linguistic:

| Guarantee | Mechanism |
|-----------|-----------|
| No unreviewed changes | PR-gated merge |
| No unauthorized model changes | Model pinned in committed config |
| No unaccounted costs | Token/dollar budgets in committed config |
| No unaudited AI actions | Git history as audit trail |
| No ungoverned autonomy | DEFCON levels, tool allowlists |
| No secret exposure | GitHub Secrets, referenced by name |
| Reversible decisions | Git revert on any commit |

This is a different kind of safety. Rust prevents the binary from corrupting memory. The Fabric prevents the team from deploying ungoverned changes. Neither alone covers the full threat surface of an AI system.

---

## 3. The 46-Crate Boundary Map

Moltis's 46 crates are not just a monorepo convenience — they are **security boundaries**. Each crate has explicit dependencies, and the Rust compiler enforces that crate A cannot access crate B's internals unless B exports them.

The core crates form a dependency hierarchy:

```
moltis-protocol (wire types)
    └── moltis-common (utilities)
        └── moltis-service-traits (interfaces)
            ├── moltis-config (validation)
            ├── moltis-sessions (persistence)
            ├── moltis-providers (LLM access)
            ├── moltis-agents (agent loop)
            ├── moltis-tools (sandbox execution)
            ├── moltis-plugins (hooks)
            └── moltis-chat (orchestration)
                └── moltis-gateway (HTTP/WS/auth)
                    └── moltis (CLI entry point)
```

Security-sensitive crates have limited dependency surfaces:

| Crate | Security Role | Key Dependencies |
|-------|--------------|------------------|
| `moltis-vault` | Secret encryption at rest | `chacha20poly1305`, `argon2`, `secrecy`, `zeroize` |
| `moltis-auth` | Authentication (password + passkey) | `argon2`, `webauthn-rs`, `secrecy` |
| `moltis-network-filter` | SSRF protection | `ipnet`, DNS resolution, loopback blocking |
| `moltis-tls` | TLS certificate management | `rustls`, `rcgen`, `tokio-rustls` |
| `moltis-tools` | Sandbox execution | Docker/Apple Container, command isolation |

Each of these crates can be audited independently. The ~196K lines of core code are not a monolith — they are a **federation of auditable modules**, each with a defined responsibility and a constrained dependency surface.

---

## 4. The Audit Surface Comparison

Moltis makes an explicit claim about auditability: "The agent loop + provider model fits in ~5K lines. The core is ~196K lines across 46 modular crates you can audit independently."

The Fabric makes a different auditability claim: every change is a Git commit, every commit is part of a PR, every PR is reviewable.

These are complementary audit surfaces:

| Dimension | Moltis Audit | Fabric Audit |
|-----------|-------------|-------------|
| **What** is audited | Source code, crate boundaries, dependency graph | Configuration, model selection, tool permissions |
| **When** is it audited | Before compilation (lint), at compile time (borrow checker), at test time (3,100+ tests) | Before merge (PR review), at deploy time (Actions), at runtime (audit log) |
| **Who** audits | The developer reading source, the Rust compiler, the CI pipeline | The reviewer reading the PR, the team reading the audit trail |
| **Depth** | Memory safety, type correctness, panic absence | Decision provenance, cost attribution, permission tracing |
| **Reversibility** | Rebuild from an earlier commit | Revert the Git commit |

The Fabric can learn from Moltis that **code-level auditability and governance-level auditability serve different audiences**. The developer needs to know the binary is safe. The team needs to know the AI's decisions are accountable. Both are necessary.

---

## 5. The 3,100+ Tests as Behavioral Contract

Moltis's test suite is not just a quality measure — it is a **behavioral contract**. With `unwrap_used = "deny"` and `expect_used = "deny"`, every error path must be explicitly handled. With `unsafe_code = "deny"`, every operation must go through safe abstractions. The tests verify not just happy paths but the entire error handling surface.

The Fabric's equivalent is its DEFCON system and committed configuration:

| Moltis Contract | Fabric Contract |
|----------------|-----------------|
| 3,100+ tests pass → binary is behaviorally correct | PR review + CI pass → configuration is governancially correct |
| `unsafe` deny → no undefined behavior at runtime | DEFCON levels → graduated autonomy matching readiness |
| `unwrap` deny → no panics in production | Tool allowlists → no unauthorized tool execution |
| Clippy lints → no common bug patterns | Committed config → no undocumented model/provider changes |

The composition is: Moltis guarantees the binary behaves correctly. The Fabric guarantees the binary is deployed with correct governance. The binary is the safe body; the repository is the accountable mind.

---

## 6. Container Sandbox as Defense Layer

Moltis adds a runtime defense layer on top of Rust's compile-time guarantees: Docker and Apple Container sandboxing with per-session isolation. Every tool command runs inside a container, not on the host:

- **SSRF protection** — DNS-resolved, blocks loopback/private/link-local addresses
- **Origin validation** — Rejects cross-origin WebSocket upgrades
- **Hook gating** — `BeforeToolCall` hooks can inspect and block any tool invocation
- **Network filtering** — Configurable egress rules per container

The Fabric's equivalent is GitHub Actions' ephemeral runner model: each workflow runs in a fresh virtual machine that is destroyed after completion. But the Fabric's sandbox is provided by the platform (GitHub), while Moltis's sandbox is provided by the binary itself.

| Sandbox Dimension | Moltis | Fabric (GitHub Actions) |
|-------------------|--------|------------------------|
| **Isolation granularity** | Per session (container) | Per workflow run (VM) |
| **Who provides it** | The Moltis binary | GitHub's infrastructure |
| **Configurable by user** | Yes (hook rules, network filters) | Limited (workflow permissions) |
| **Persistent between runs** | No (container destroyed) | No (VM destroyed) |
| **Local network access** | Blocked by default (SSRF protection) | Allowed (can reach external APIs) |

The lesson: Moltis provides **user-controlled sandboxing**. The Fabric provides **platform-controlled sandboxing**. A composed system would use both — the Moltis binary runs locally with its own container sandbox, governed by committed configuration from the Fabric that specifies sandbox policy.

---

## 7. Defense-in-Depth: The Composed Security Model

When the Rust Fortress and the Fabric Governance compose, the result is defense-in-depth:

| Layer | Defense | Provider |
|-------|---------|----------|
| **Language** | Memory safety, no undefined behavior, no panics | Rust compiler |
| **Compilation** | `unsafe` deny, `unwrap` deny, Clippy lints | Workspace configuration |
| **Testing** | 3,100+ tests, behavioral contracts | CI pipeline |
| **Runtime** | Container sandbox, SSRF protection, hook gating | Moltis binary |
| **Encryption** | XChaCha20-Poly1305 vault, Argon2id key derivation | `moltis-vault` |
| **Authentication** | Password + passkey + API key, rate limiting | `moltis-auth` |
| **Configuration** | Model pinning, tool allowlists, cost limits | Fabric committed config |
| **Review** | PR-gated changes, diff inspection | GitHub platform |
| **Audit** | Git history, session logs, decision provenance | Repository + local logs |
| **Recovery** | Git revert, version rollback | Repository |

No single layer is sufficient. Rust prevents memory bugs but does not prevent governance failures. The Fabric prevents governance failures but does not prevent memory bugs. Container sandboxing prevents escape but does not prevent misconfiguration. Together, they form a security stack that covers the full lifecycle — from compilation through deployment to audit.

The Fabric's lesson from the Rust Fortress: **governance is one layer of defense, not all layers.** A governed system that runs on an unsafe binary is still vulnerable. A safe binary that runs without governance is still unaccountable. The complete model needs both.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

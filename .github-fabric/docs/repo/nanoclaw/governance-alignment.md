# Governance Alignment

> [NanoClaw Index](./index.md) · [The Four Laws of AI](../../docs/the-four-laws-of-ai.md) · [Container Isolation as Governance](./container-isolation-as-governance.md)

> NanoClaw's security was designed for a different threat: untrusted messages arriving via WhatsApp from the open internet. The Fabric's governance was designed for repository-scoped operations. The two models are complementary — and their composition produces the Fabric's most layered governance architecture.

---

## 1. Two Security Traditions

### The NanoClaw Model

NanoClaw's security architecture addresses a personal assistant's threat surface:

1. **Container isolation** — agents run in Docker/Apple Container with filesystem isolation, non-root execution, and ephemeral lifetimes.
2. **Credential proxy** — real API keys never enter containers; a host-side proxy injects authentication headers.
3. **Mount security** — external allowlist, blocked patterns (`.ssh`, `.gnupg`, `.aws`, `.env`, `id_rsa`, etc.), symlink resolution, read-only project root.
4. **Sender allowlist** — configurable per-group sender verification.
5. **IPC authorization** — main group has admin privileges; non-main groups are isolated.
6. **Session isolation** — each group has separate Claude sessions; groups cannot see each other's history.
7. **Read-only project root** — the agent cannot modify host application code via its container mount.

### The Fabric Model

The Fabric's governance inherits from three sources:

1. **The Four Laws of AI** — behavioral constraint hierarchy (Zeroth through Third Law).
2. **GitHub's Native Controls** — collaborator permissions, branch protection, CODEOWNERS, encrypted secrets, audit logs.
3. **DEFCON Readiness Levels** — five operational states constraining agent behavior based on risk posture.

---

## 2. How They Compose

| Concern | NanoClaw Mechanism | Fabric Mechanism | Composed Behavior |
|---------|-------------------|-----------------|-------------------|
| **Who can invoke the agent?** | Sender allowlist + trigger word | Collaborator permissions on the repository | Only repository collaborators can open issues that trigger the agent |
| **Who can modify agent behavior?** | Code changes to fork (reviewed by user) | CODEOWNERS + branch protection | Config changes require PR review by code owners |
| **What can the agent do?** | Container mount restrictions | DEFCON levels + scoped commits | DEFCON constrains capabilities; mounts limit filesystem access |
| **Can the agent execute code?** | Safe — runs inside container, not on host | Safe — runs inside runner + container | Double isolation: container inside runner |
| **Can the agent access secrets?** | Never — credential proxy injects externally | GitHub encrypted secrets (never in logs) | Secrets injected at proxy level, not in container environment |
| **Can the agent modify itself?** | Cannot modify host code (read-only mount) | Scoped commits to `state/` only | Agent cannot modify workflows, config, or source code |
| **Is the agent auditable?** | SQLite logs (may be lost if disk fails) | Full git history with SHAs and diffs | Every action committed — permanent audit trail |
| **Can the agent be rolled back?** | Manual (restore database, restart process) | `git revert` any commit | One-command rollback of any interaction |
| **How is abuse detected?** | Sender allowlist blocks unknown senders | Collaborator-gated invocation + bot filtering | Both layers active; GitHub permissions prevent external abuse |
| **How is the agent disabled?** | Stop the process / unload launchd service | Delete sentinel file (`GITNANOCLAW-ENABLED.md`) | Instant disable via `git rm` + push |

---

## 3. The Four Laws Applied to NanoClaw

### Zeroth Law: Protect Humanity

> The agent must act in the interest of humanity as a whole.

**NanoClaw native:** MIT license, open-source, privacy-first (runs on your devices, data stays local). No telemetry, no cloud dependency beyond the LLM API. The creator's explicit motivation is personal agency — owning your AI assistant rather than renting it.

**Fabric expression:** The Fabric adds reproducibility and auditability. Every NanoClaw interaction on the Fabric is a committed artifact — reviewable, reproducible, and revertible. The repository is public record, not private state.

### First Law: Do No Harm

> The agent must not harm humans or, through inaction, allow harm.

**NanoClaw native:** Container isolation prevents the agent from accessing the host filesystem beyond explicit mounts. Blocked patterns prevent credential exposure. The credential proxy ensures API keys never enter the execution environment. Read-only project root prevents the agent from modifying its own code.

**Fabric expression:** Scoped commits prevent the agent from modifying anything outside `state/`. The sentinel file ensures the agent never runs unless explicitly enabled. DEFCON levels provide graduated response: at DEFCON 2, the agent can only advise; at DEFCON 1, it cannot execute.

**Composed:** The First Law is enforced at three levels — container boundaries (kernel), commit scope (git), and DEFCON state (configuration). An attacker must breach all three to cause harm.

### Second Law: Obey the Human

> The agent must obey human instructions, except where they conflict with higher laws.

**NanoClaw native:** The agent responds to trigger words from allowlisted senders. The main group has admin control over all groups. Users configure behavior through code changes (skills).

**Fabric expression:** Issue-driven invocation ensures every agent action is triggered by a human comment. Collaborator permissions ensure only authorized humans give instructions. The commit-review cycle keeps the human in the loop.

### Third Law: Preserve Your Integrity

> The agent must protect its own existence, except where it conflicts with higher laws.

**NanoClaw native:** Launchd/systemd auto-restart on crash. Container ephemerality ensures clean state on each invocation. The `/debug` skill provides self-diagnostic capability.

**Fabric expression:** Sentinel file protection, structural tests, preflight validation, and the push-retry loop for state persistence. The agent's integrity is maintained through committed configuration that cannot be silently changed.

---

## 4. DEFCON Levels for NanoClaw

| Level | Posture | NanoClaw Behavior |
|-------|---------|-------------------|
| **DEFCON 5** | Normal | Full capability. Agent reads issues, reasons, uses tools (web, browser, file ops), commits state, posts replies. Container spawned with standard mounts. |
| **DEFCON 4** | Above Normal | Full capability with confirmation. Agent posts planned actions as comment, waits for human approval before executing. Container spawned read-only. |
| **DEFCON 3** | Increased | Read-only. Agent analyzes issues and provides recommendations but cannot modify files, commit state, or use write tools. No container spawned. |
| **DEFCON 2** | High | Advisory only. Agent reads issue context and provides analysis. No tool use beyond reading. No container spawned. |
| **DEFCON 1** | Maximum | Full lockdown. Sentinel file removed. No workflows execute. Agent is inactive. |

### DEFCON Transitions

```bash
# Escalate to DEFCON 3
# Edit .GITNANOCLAW/config/settings.json → "defcon": 3
git commit -m "defcon: escalate to 3 — investigating anomalous behavior"
git push

# De-escalate to DEFCON 5
git commit -m "defcon: de-escalate to 5 — incident resolved"
git push
```

Every DEFCON change is committed, reviewable, and revertible. The commit message documents the reason. The diff shows exactly what changed.

---

## 5. NanoClaw's Trust Levels vs. Fabric Permissions

NanoClaw has a trust model based on group identity:

| Capability | Main Group | Non-Main Group |
|-----------|------------|----------------|
| Send message to own chat | ✓ | ✓ |
| Send message to other chats | ✓ | ✗ |
| Schedule task for self | ✓ | ✓ |
| Schedule task for others | ✓ | ✗ |
| View all tasks | ✓ | Own only |
| Manage other groups | ✓ | ✗ |
| Write global memory | ✓ | ✗ |
| Project root access | Read-only | None |
| Additional mounts | Configurable | Read-only unless allowed |

In the Fabric, this maps to repository permissions:

| NanoClaw Trust Level | Fabric Equivalent |
|---------------------|-------------------|
| Main group (admin) | Repository owner/admin collaborator |
| Non-main group (restricted) | Repository write collaborator (limited to own issues) |
| Unknown sender (blocked) | Non-collaborator (no access to trigger workflows) |

The Fabric's permission model is simpler but stronger: GitHub's authentication is cryptographically verified, role-based, and centrally managed. NanoClaw's trust model is more granular (per-group capabilities) but relies on application logic for enforcement.

---

## 6. Security Model Comparison

| Property | NanoClaw Native | Fabric Expression | Advantage |
|----------|----------------|-------------------|-----------|
| **Identity verification** | Sender allowlist (phone/username) | GitHub authentication (cryptographic) | Fabric |
| **Permission model** | Main/non-main group distinction | Collaborator roles + CODEOWNERS | Fabric |
| **Execution isolation** | Container (kernel-enforced) | Runner VM + container | Composed (both) |
| **Credential isolation** | Credential proxy (never in container) | GitHub Secrets + credential proxy | Composed (both) |
| **Audit trail** | SQLite logs (volatile) | Git commits (permanent) | Fabric |
| **Rollback** | Manual database restore | `git revert` | Fabric |
| **Config review** | Code changes (user reviews) | PR review + branch protection | Fabric |
| **Disable mechanism** | Stop process | Delete sentinel file | Comparable |
| **Blast radius** | Limited to container mounts | Scoped to `state/` directory | Composed (both) |
| **Network exposure** | Local process (loopback binding) | No network exposure (ephemeral runner) | Fabric |
| **Multi-group isolation** | Separate containers + sessions per group | Not applicable (single issue channel) | NanoClaw |
| **Mount security** | External allowlist + blocked patterns | Committed policy + blocked patterns | Composed (both) |

---

## 7. The Three-Layer Assurance

When NanoClaw's security and the Fabric's governance compose, the result is three layers of assurance:

| Layer | Source | What It Assures |
|-------|--------|----------------|
| **Authorization** | GitHub permissions + NanoClaw sender allowlist | Only authorized humans can trigger the agent |
| **Isolation** | Container boundaries + runner ephemerality + mount security | The agent can only access explicitly granted resources |
| **Attestation** | Git commits with SHAs + scoped writes + DEFCON state | Every action is permanently recorded, bounded, and reviewable |

Together, these provide:

- **Prevention** — unauthorized invocations are blocked before the agent starts.
- **Containment** — the agent's capabilities are bounded by container mounts, commit scope, and DEFCON level.
- **Accountability** — every action is committed, diffable, and revertible.

This is the Fabric's governance dividend applied to NanoClaw: the assistant becomes not just isolated, but **accountable** — every interaction traceable, every decision reviewable, every mistake correctable through `git revert`.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

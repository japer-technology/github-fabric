# Governance Alignment

> [OpenAI Codex Index](./index.md) · [The Four Laws of AI](../../docs/the-four-laws-of-ai.md) · [Sandbox as Governance](./sandbox-as-governance.md)

> Codex was designed for a developer at a terminal. The Fabric was designed for a repository-native AI. Both enforce constraints on what an agent may do — but from different directions. Codex constrains through sandboxing and approval modes. The Fabric constrains through the Four Laws, DEFCON levels, and repository-scoped governance. Their composition produces the most complete governance model the Fabric has evaluated.

---

## 1. Two Governance Traditions

### The Codex Model

Codex governs the agent through three mechanisms:

1. **Approval modes** — Suggest (human approves everything), Auto Edit (human approves shell commands), Full Auto (agent is autonomous within sandbox)
2. **OS-level sandbox** — Apple Seatbelt on macOS, Docker on Linux — kernel-enforced filesystem and network restrictions
3. **AGENTS.md** — behavioral instructions loaded from the repository, guiding the agent's approach to tasks

Codex's governance is **infrastructure-first**: the primary safety mechanism is the OS sandbox, not the agent's behavior. The sandbox prevents harm regardless of what the agent tries to do.

### The Fabric Model

The Fabric governs through three sources:

1. **The Four Laws of AI** — behavioral constraint hierarchy (Zeroth through Third Law)
2. **GitHub's native controls** — collaborator permissions, branch protection, CODEOWNERS, encrypted secrets, audit logs
3. **DEFCON readiness levels** — five operational states constraining agent behavior based on risk posture

The Fabric's governance is **policy-first**: the primary safety mechanism is committed configuration and behavioral constraints, reinforced by GitHub's infrastructure.

---

## 2. How They Compose

| Concern | Codex Mechanism | Fabric Mechanism | Composed Behavior |
|---------|----------------|-----------------|-------------------|
| **Who can invoke the agent?** | Whoever runs `codex` on their machine | Collaborator permissions on the repository | Only repository collaborators can open issues that trigger the agent |
| **Who can change agent behavior?** | Whoever edits AGENTS.md or config files | CODEOWNERS + branch protection | AGENTS.md and config changes require PR review by code owners |
| **What can the agent read?** | Anything in the sandbox's read scope | Anything in the checked-out repository | Repository contents (DEFCON may further restrict) |
| **What can the agent write?** | Working directory only (sandbox-enforced) | Scoped commits + DEFCON constraints | Writes restricted by both sandbox and commit scope |
| **Can the agent execute commands?** | Yes, inside sandbox (network-disabled, dir-scoped) | Yes, inside runner VM | Double isolation: sandbox inside runner |
| **Can the agent access the network?** | Blocked in Full Auto; API-only in other modes | Not restricted by default | Codex blocks; Fabric allows (for git push) — phased approach |
| **Can the agent access secrets?** | API key via environment variable | GitHub Secrets (encrypted, masked) | Secrets injected by workflow, never in sandbox environment |
| **Can the agent modify itself?** | Can modify files in working directory (including AGENTS.md) | Scoped commits restrict what can be pushed | Agent may draft changes; commit scope determines what persists |
| **Is every action auditable?** | No (terminal output is volatile) | Yes (git commits are permanent) | Yes — Fabric's audit trail covers everything |
| **Can the agent be rolled back?** | `git checkout` / `git stash` (manual) | `git revert` any commit | One-command rollback of any interaction |
| **How is the agent disabled?** | Don't run `codex` | Delete sentinel file (`GITCODEX-ENABLED.md`) | Instant disable via `git rm` + push |

---

## 3. The Four Laws Applied to Codex

### Zeroth Law: Protect Humanity

> The agent must act in the interest of humanity as a whole.

**Codex native:** Apache 2.0 license, open source, multi-provider support (not locked to OpenAI). OpenAI's Codex is designed as a general-purpose coding tool — it does not discriminate by language, framework, or project type. The open-source fund acknowledges dependencies.

**Fabric expression:** The Fabric adds reproducibility and auditability. Every Codex interaction on the Fabric is a committed artifact — reviewable by the team, reproducible from the commit history, and contributing to a shared body of knowledge rather than disappearing into a terminal session.

### First Law: Do No Harm

> The agent must not harm humans or, through inaction, allow harm.

**Codex native:** The sandbox is the primary safety mechanism. Network-disabled execution prevents data exfiltration. Directory-scoped writes prevent file system damage. The approval mode system ensures a human reviews potentially harmful actions (in Suggest and Auto Edit modes).

**Fabric expression:** Scoped commits prevent the agent from modifying governance configuration. The sentinel file ensures the agent never runs unless explicitly enabled. DEFCON levels provide graduated response: at DEFCON 2, the agent can only advise; at DEFCON 1, it cannot execute.

**Composed:** The First Law is enforced at four levels — sandbox boundaries (kernel), runner VM (infrastructure), commit scope (git), and DEFCON state (configuration). An attacker must breach all four to cause harm.

### Second Law: Obey the Human

> The agent must obey human instructions, except where they conflict with higher laws.

**Codex native:** The agent responds to prompts from the user at the terminal. AGENTS.md provides standing instructions. The approval mode determines which agent actions require real-time human confirmation.

**Fabric expression:** Issue-driven invocation ensures every agent action is triggered by a human comment. Collaborator permissions ensure only authorized humans give instructions. DEFCON 4 requires explicit human approval before execution.

### Third Law: Preserve Your Integrity

> The agent must protect its own existence, except where it conflicts with higher laws.

**Codex native:** The binary is statically compiled — no dependency rot, no version conflicts. The sandbox protects the agent from its own tool executions (a malicious command cannot corrupt the agent binary).

**Fabric expression:** Sentinel file protection, structural tests, preflight validation, and cached binary distribution. The agent's binary and configuration are committed and version-controlled — any corruption is detectable via git diff.

---

## 4. DEFCON Levels for Codex

| Level | Posture | Codex Behavior |
|-------|---------|----------------|
| **DEFCON 5** | Normal | Full capability. Codex runs in `--approval-mode full-auto --quiet`. Reads issues, reasons, executes commands (sandboxed), modifies files, commits state, posts replies. |
| **DEFCON 4** | Above Normal | Full capability with confirmation. Codex runs in `--approval-mode suggest`. Agent posts planned actions as a comment, waits for human to add an approval comment before proceeding. |
| **DEFCON 3** | Increased | Read-only. Codex runs in `--approval-mode suggest` with no execution step. Agent analyzes the issue and provides recommendations as a comment. No file modifications, no commands. |
| **DEFCON 2** | High | Advisory only. Agent reads issue context using a lightweight prompt (no Codex binary invocation). Provides high-level analysis. No tool use. |
| **DEFCON 1** | Maximum | Full lockdown. Sentinel file removed. No workflows execute. Agent is inactive. |

### DEFCON Transitions

```bash
# Escalate to DEFCON 3
# Edit .GITCODEX/config/settings.json → "defcon": 3
git commit -m "defcon: escalate to 3 — investigating anomalous behavior"
git push

# De-escalate to DEFCON 5
git commit -m "defcon: de-escalate to 5 — incident resolved"
git push
```

Every DEFCON change is committed, reviewable, and revertible. The commit message documents the reason. The diff shows exactly what changed.

---

## 5. Trust Model Comparison

| Property | Codex Native | Fabric Expression | Advantage |
|----------|-------------|-------------------|-----------|
| **Identity verification** | Local user (whoever has terminal access) | GitHub authentication (cryptographic) | Fabric |
| **Permission model** | Single user (the person at the keyboard) | Collaborator roles + CODEOWNERS | Fabric |
| **Execution isolation** | OS sandbox (Seatbelt/Docker/Landlock) | Runner VM + OS sandbox | Composed (both) |
| **Credential isolation** | API key in environment variable | GitHub Secrets (encrypted, masked) + env injection | Fabric |
| **Audit trail** | Terminal output (volatile) | Git commits (permanent) | Fabric |
| **Rollback** | Manual (`git checkout`) | `git revert` | Fabric |
| **Config review** | Personal choice (no enforcement) | PR review + branch protection | Fabric |
| **Disable mechanism** | Stop running `codex` | Delete sentinel file | Comparable |
| **Blast radius** | Scoped to sandbox-allowed directories | Scoped to repository + commit scope | Composed (both) |
| **Network exposure** | Fully blocked (Full Auto) | Runner has network (needed for git push) | Codex (more restrictive) |
| **Multi-provider** | 10+ providers supported | Any provider via configuration | Comparable |
| **Model selection** | Config file or CLI flag | Committed configuration | Fabric (auditable) |

---

## 6. The Governance Stack

When Codex runs as a Fabric module, the governance stack has five layers:

| Layer | Source | What It Assures |
|-------|--------|----------------|
| **The Four Laws** | Fabric philosophy | Behavioral boundaries that no configuration can override |
| **DEFCON Level** | Committed configuration | Operational posture constraining what the agent may attempt |
| **GitHub Permissions** | Platform infrastructure | Identity verification, role-based access, secret management |
| **Codex Approval Mode** | Tool configuration | What the agent may do without real-time human approval |
| **Codex Sandbox** | OS kernel | Physical boundaries on filesystem and network access |

Together, these provide:

- **Prevention** — unauthorized invocations are blocked by GitHub permissions before the agent starts
- **Behavioral constraint** — the Four Laws and DEFCON limit what the agent will attempt
- **Infrastructure constraint** — the sandbox limits what the agent can physically access
- **Accountability** — every action is committed, diffable, and revertible

This is the deepest governance stack the Fabric has produced. Previous modules had three layers (governance + infrastructure + audit). Codex adds two more (approval mode + OS sandbox) for a five-layer model where each layer is independent of the others and enforced by a different mechanism.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

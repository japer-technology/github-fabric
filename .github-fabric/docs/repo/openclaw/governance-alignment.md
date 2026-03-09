# Governance Alignment

> [OpenClaw Index](./index.md) · [The Four Laws of AI](../../docs/the-four-laws-of-ai.md) · [Channels as Sensory Organs](./channels-as-sensory-organs.md)

> OpenClaw's security model and the Fabric's governance framework are not competing systems. They are complementary layers — one designed for real-time channel safety, the other for repository-scoped accountability.

---

## 1. Two Governance Traditions

### The Fabric Model

The Fabric's governance inherits from two sources:

1. **The Four Laws of AI** — a behavioral constraint hierarchy (Zeroth through Third Law) operationalized through repository mechanics.
2. **GitHub's Native Controls** — collaborator permissions, branch protection, CODEOWNERS, pull request review, encrypted secrets, audit logs.
3. **DEFCON Readiness Levels** — five operational states (DEFCON 5 normal to DEFCON 1 full lockdown) that constrain agent behavior based on risk posture.

### The OpenClaw Model

OpenClaw's security model was designed for a different threat surface — real-time messaging with untrusted inbound DMs:

1. **DM Pairing** — unknown senders receive a pairing code; the bot does not process their message until approved.
2. **Allowlists** — per-channel lists of approved senders (`allowFrom` configuration).
3. **Trust Levels** — tiered permissions controlling what operations a sender can trigger.
4. **Elevated Bash** — toggled per-session permission for shell command execution.
5. **Loopback Binding** — Gateway binds to `127.0.0.1` by default, refusing external connections.
6. **Tailscale Integration** — Serve (tailnet-only) or Funnel (public with password auth) for remote access.
7. **Bot-Comment Filtering** — prevents infinite loops where the agent responds to its own messages.
8. **Operator Configuration** — all security settings are explicit YAML configuration, not implicit defaults.

---

## 2. How They Compose

The two governance models address different concerns. They compose as layers:

| Concern | OpenClaw Mechanism | Fabric Mechanism | Composed Behavior |
|---------|-------------------|-----------------|-------------------|
| **Who can invoke the agent?** | DM pairing + allowlists | Collaborator permissions on the repository | Only repository collaborators can open issues that trigger the agent |
| **Who can modify agent behavior?** | Operator YAML config | CODEOWNERS + branch protection | Config changes require PR review by code owners |
| **What can the agent do?** | Trust levels + tool gating | DEFCON levels + scoped commits | DEFCON level constrains tool availability; scoped commits limit blast radius |
| **Can the agent execute code?** | Elevated bash toggle | Workflow permissions + `actions: write` scope | Shell access available but bounded by runner constraints |
| **Can the agent access secrets?** | Environment variables in YAML | GitHub encrypted secrets (never in logs) | Secrets injected at workflow runtime, not committed |
| **Can the agent modify itself?** | No self-modification in OpenClaw | Scoped commits to `.GITOPENCLAW/state/` only | Agent cannot modify workflows, lifecycle scripts, or config |
| **Is the agent auditable?** | Logs (may rotate) | Full git history with SHAs and diffs | Every action committed — stronger than either system alone |
| **Can the agent be rolled back?** | Manual (restore config/state) | `git revert` any commit | One-command rollback of any interaction |
| **How is abuse detected?** | DM pairing blocks unknown senders | Collaborator-gated invocation + bot-comment filtering | Both layers active; GitHub permissions prevent external abuse |
| **How is the agent disabled?** | Stop the Gateway process | Delete sentinel file (`GITOPENCLAW-ENABLED.md`) | Instant disable via `git rm` + push |

---

## 3. The Four Laws Applied to OpenClaw

### Zeroth Law: Protect Humanity

> The agent must act in the interest of humanity as a whole.

**OpenClaw native:** MIT license, open-source, privacy-first (runs on your devices, not a cloud service). The project explicitly avoids commercial lock-in and agent-hierarchy frameworks.

**Fabric expression:** The Fabric adds reproducibility and auditability to this commitment. Every OpenClaw interaction on the Fabric is a committed artifact — reviewable by anyone with repo access, reproducible from any point in history, and revertible if harm is detected.

### First Law: Do No Harm

> The agent must not harm humans or, through inaction, allow harm.

**OpenClaw native:** DM pairing prevents the agent from processing messages from strangers. Loopback binding prevents external access. Trust levels gate dangerous operations.

**Fabric expression:** Scoped commits prevent the agent from modifying anything outside `.GITOPENCLAW/state/`. The fail-closed sentinel ensures the agent never runs unless explicitly enabled. DEFCON levels provide graduated response: at DEFCON 2, the agent can only advise; at DEFCON 1, it cannot execute at all.

### Second Law: Obey the Human

> The agent must obey human instructions, except where they conflict with higher laws.

**OpenClaw native:** The Gateway processes commands from approved senders. Operator configuration takes precedence over user requests.

**Fabric expression:** Issue-driven invocation ensures every agent action is triggered by a human comment on an issue. The collaborator check ensures only authorized humans can give instructions. The commit-review cycle (agent commits, human reviews) keeps the human in the loop.

### Third Law: Preserve Your Integrity

> The agent must protect its own existence, except where it conflicts with higher laws.

**OpenClaw native:** Health checks, doctor diagnostics, auto-restart via launchd/systemd.

**Fabric expression:** Sentinel file protection, structural tests (`tests/phase0.test.js`), preflight validation, and push-retry loop for state persistence. The agent's integrity is maintained through committed configuration that cannot be silently changed.

---

## 4. DEFCON Levels for OpenClaw

The Fabric's DEFCON levels apply uniformly to all modules, but their practical meaning for OpenClaw is worth mapping:

| Level | Posture | OpenClaw Behavior |
|-------|---------|-------------------|
| **DEFCON 5** | Normal | Full tool access. Agent reads issues, reasons, uses browser/web/file tools, commits state, posts replies. |
| **DEFCON 4** | Above Normal | Full capability but with explicit confirmation before writes. Agent explains planned changes and waits for human approval (in practice: agent posts plan as comment, human approves, agent executes). |
| **DEFCON 3** | Increased | Read-only. Agent can analyze issues, read code, search the web, but cannot modify files, commit state, or post substantive replies. It explains what it would do and awaits human directive. |
| **DEFCON 2** | High | Advisory only. Agent can be consulted but performs no actions. It reads the issue context and provides analysis in a comment, with no tool use beyond reading. |
| **DEFCON 1** | Maximum | Full lockdown. Sentinel file removed. No workflows execute. Agent is completely inactive. |

### Transitioning DEFCON Levels

In the Fabric, DEFCON transitions are **committed changes**:

```bash
# Escalate to DEFCON 3 (read-only)
# Edit .GITOPENCLAW/config/settings.json, set defcon: 3
git commit -m "defcon: escalate to level 3 — read-only pending investigation"
git push

# De-escalate to DEFCON 5 (normal)
git commit -m "defcon: de-escalate to level 5 — incident resolved"
git push
```

Every DEFCON change is a committed, reviewable, revertible decision. The commit message documents the reason. The diff shows exactly what changed. This is stronger governance than a runtime toggle — it creates a permanent record of every governance decision.

---

## 5. DM Pairing as Collaborator Permission

OpenClaw's DM pairing is its most distinctive security feature:

1. Unknown sender messages the bot.
2. Bot replies with a short pairing code.
3. Operator runs `openclaw pairing approve <channel> <code>`.
4. Sender is added to the allowlist.
5. Future messages from this sender are processed.

In the Fabric, this entire flow is replaced by **GitHub collaborator permissions**:

1. Non-collaborator opens an issue → workflow checks `github.event.issue.user.login` against collaborator list.
2. Non-collaborator's issue is ignored (or receives a polite "not authorized" response).
3. Collaborator's issue triggers the agent.

The pairing flow is unnecessary because GitHub has already solved identity verification. A GitHub user is authenticated, their permissions are explicit, and their identity is permanently linked to their actions. This is stronger than pairing codes, which can be shared or social-engineered.

**The Fabric replaces a custom authentication system with GitHub's native one.** This is a recurring theme: OpenClaw's security mechanisms were designed for environments without GitHub's access control. In the Fabric, GitHub's controls subsume them.

---

## 6. Security Model Comparison

| Property | OpenClaw Native | Fabric Expression | Winner |
|----------|----------------|-------------------|--------|
| **Identity verification** | DM pairing codes | GitHub authentication | Fabric (cryptographically verified identity) |
| **Permission model** | Allowlists + trust levels | Collaborator roles + CODEOWNERS | Fabric (native to platform) |
| **Audit trail** | Logs (rotation risk) | Git commits (permanent) | Fabric (immutable audit trail) |
| **Rollback** | Manual restore | `git revert` | Fabric (one-command rollback) |
| **Config review** | Local YAML | PR review + branch protection | Fabric (reviewed changes) |
| **Disable mechanism** | Stop process | Delete sentinel file | Comparable (both instant) |
| **Blast radius** | Unlimited (can access system) | Scoped to `.GITOPENCLAW/state/` | Fabric (contained scope) |
| **Network exposure** | Loopback + optional Tailscale | No network exposure (runner is ephemeral) | Fabric (no attack surface) |
| **Real-time threat response** | Block sender, rate limit | DEFCON escalation | Both (different time scales) |
| **Multi-channel DM safety** | Per-channel allowlists | Not applicable (single channel) | OpenClaw (broader surface coverage) |

**Summary:** The Fabric's governance is stronger for repository-scoped operations. OpenClaw's governance is richer for multi-channel, multi-device scenarios. The composed model takes the best of both.

---

## 7. The Three-Layer Assurance

When both systems compose, the governance model has three layers:

| Layer | Source | What It Assures |
|-------|--------|----------------|
| **Authorization** | GitHub permissions | Only authorized humans can trigger the agent |
| **Validation** | Fabric lifecycle (sentinel, preflight, DEFCON) | The agent only runs when conditions are met |
| **Attestation** | Git commits with SHAs and diffs | Every agent action is permanently recorded and reviewable |

No single layer is sufficient. Together, they provide:

- **Prevention** — unauthorized invocations are blocked before the agent starts.
- **Constraint** — the agent's capabilities are bounded by DEFCON level and scoped commits.
- **Accountability** — every action is committed, diffable, and revertible.

This is the Fabric's governance dividend applied to OpenClaw: the agent becomes not just capable, but **accountable** — every interaction traceable, every decision reviewable, every mistake correctable.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

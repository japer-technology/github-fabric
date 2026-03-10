# Approval Modes as DEFCON

> [OpenAI Codex Index](./index.md) · [DEFCON Levels](../../docs/transition-to-defcon-5.md) · [What Codex Teaches Fabric](./what-codex-teaches-fabric.md)

> Codex graduates autonomy through three approval modes. The Fabric graduates through five DEFCON levels. Both systems express the same insight: trust is not binary. An agent should operate at different autonomy levels depending on risk context. The mapping between them reveals a shared governance grammar.

---

## 1. Codex's Approval Modes

Codex offers three modes that govern what the agent may do without human confirmation:

| Mode | Agent May Do Autonomously | Requires Human Approval |
|------|--------------------------|------------------------|
| **Suggest** (default) | Read any file in the repo | All file writes, all patches, all shell commands |
| **Auto Edit** | Read files and apply patches | All shell commands |
| **Full Auto** | Read, write, and execute commands (sandboxed: network-disabled, directory-confined) | Nothing |

The progression is: **observe → modify → execute.** Each step grants the agent more autonomy while maintaining safety through different mechanisms:

- **Suggest** relies on the human for all decisions.
- **Auto Edit** trusts the model's file modifications but not its shell commands.
- **Full Auto** trusts the model completely but constrains its environment (no network, confined directory).

---

## 2. The Fabric's DEFCON Levels

The Fabric uses five readiness levels (modeled after the real DEFCON system):

| Level | Posture | Agent Behavior |
|-------|---------|----------------|
| **DEFCON 5** | Normal | Full capability. Read, reason, execute, commit, post replies. |
| **DEFCON 4** | Above Normal | Full capability with confirmation. Agent posts planned actions, waits for human approval before executing. |
| **DEFCON 3** | Increased | Read-only. Agent analyzes and recommends but cannot modify files, commit state, or execute. |
| **DEFCON 2** | High | Advisory only. Agent reads context and provides analysis. No tool use. |
| **DEFCON 1** | Maximum | Full lockdown. Sentinel file removed. No workflows execute. |

The progression is: **lockdown → advisory → read-only → supervised → autonomous.** Each step grants the agent more autonomy through committed configuration changes.

---

## 3. The Mapping

| Codex Mode | DEFCON Equivalent | What They Share | What Differs |
|------------|------------------|-----------------|-------------|
| **Suggest** | **DEFCON 3** (Increased) | Agent reads and analyzes; all modifications require human approval | Codex allows the agent to propose edits; DEFCON 3 is strictly read-only |
| **Auto Edit** | **DEFCON 4** (Above Normal) | Agent can modify files; shell execution requires human approval | Codex auto-applies patches; DEFCON 4 requires confirmation of planned actions |
| **Full Auto** | **DEFCON 5** (Normal) | Agent has full capability within its constraints | Codex relies on sandbox; DEFCON 5 relies on repository governance |
| *(none)* | **DEFCON 2** (High) | No Codex equivalent — Codex always allows reading | DEFCON 2 restricts even tool use; agent can only read and advise |
| *(none)* | **DEFCON 1** (Maximum) | No Codex equivalent — Codex must be running to exist | DEFCON 1 removes the sentinel file; agent ceases to exist |

### The Gap at Each End

Codex has no equivalent to DEFCON 2 or DEFCON 1. This is because Codex is a **tool** — it exists only when a human invokes it. The human's decision not to run `codex` is the equivalent of DEFCON 1. The Fabric, by contrast, is a **system** — it exists continuously in the repository, and must have mechanisms to constrain or disable itself without human intervention at the keyboard.

DEFCON 2 (advisory-only) and DEFCON 1 (full lockdown) represent governance states that only make sense for an always-available system. Codex does not need them because Codex is never "always available" — it runs when you type the command.

---

## 4. The Shared Pattern: Graduated Trust

Despite the structural differences, both systems encode the same insight:

> **Trust is a spectrum, not a switch.**

Both systems recognize three essential trust levels:

| Trust Level | Codex Expression | Fabric Expression |
|-------------|-----------------|-------------------|
| **Observe only** | Suggest mode | DEFCON 3 |
| **Modify with oversight** | Auto Edit mode | DEFCON 4 |
| **Autonomous within constraints** | Full Auto mode (sandboxed) | DEFCON 5 (governed) |

The constraints differ — Codex relies on OS-level sandboxing, the Fabric relies on repository-scoped governance — but the graduation is identical. This convergence suggests that **three levels of agent autonomy is the natural minimum** for any system that governs AI behavior.

---

## 5. Composition: Approval Mode Inside DEFCON

When Codex runs as a Fabric module, both systems apply simultaneously. The effective autonomy is the **intersection** (most restrictive) of the two:

| DEFCON Level | Codex Mode | Effective Behavior |
|-------------|-----------|-------------------|
| DEFCON 5 + Full Auto | Full capability + Full capability | Agent reads, writes, executes, commits — maximum autonomy within sandbox + governance |
| DEFCON 5 + Suggest | Full capability + Read-only agent | Agent reads but requires human approval for all writes — governance allows more than the agent takes |
| DEFCON 4 + Full Auto | Supervised + Full capability | Agent plans actions, posts them for review, then executes after approval — DEFCON constrains Codex |
| DEFCON 4 + Auto Edit | Supervised + Auto-modify | Agent auto-applies patches after posting plan; shell commands require approval at both levels |
| DEFCON 3 + Any | Read-only + Any | Agent can only read regardless of Codex mode — DEFCON overrides |
| DEFCON 2 + Any | Advisory + Any | Agent can only advise regardless of Codex mode — DEFCON overrides |
| DEFCON 1 + Any | Lockdown + Any | No execution — DEFCON overrides everything |

**The Fabric's DEFCON always takes precedence.** Codex's approval mode operates within the envelope that DEFCON permits. This is by design: the repository governance (committed, auditable, team-visible) should constrain the tool-level configuration (local, personal, ephemeral).

---

## 6. Configuration Mapping

In a Fabric module, Codex's approval mode would be set via committed configuration:

```json
{
  "defcon": 5,
  "codex": {
    "approvalMode": "full-auto",
    "model": "o4-mini",
    "sandbox": "docker"
  }
}
```

The DEFCON level determines what the Fabric allows. The `approvalMode` determines what Codex allows within that envelope. A team could run:

- **DEFCON 5 + Full Auto** for routine tasks (dependency updates, formatting, documentation)
- **DEFCON 4 + Auto Edit** for code changes (agent proposes, human reviews before execution)
- **DEFCON 3 + Suggest** for analysis tasks (agent reads and advises, no modifications)

All transitions are committed, reviewed, and revertible — the governance benefit the Fabric adds to Codex's approval-mode system.

---

## 7. Summary

| Insight | Detail |
|---------|--------|
| Codex and DEFCON encode the same pattern | Graduated trust: observe → modify → execute |
| DEFCON has two extra levels (1, 2) | Because the Fabric is always-available; Codex is invoked on-demand |
| The natural minimum is three autonomy levels | Observe only, modify with oversight, autonomous within constraints |
| Composition uses intersection semantics | The more restrictive system wins at each level |
| DEFCON always takes precedence | Repository governance constrains tool-level configuration |
| All transitions are committed | DEFCON changes are diffs; Codex mode changes are configuration |

Graduated autonomy is not a feature — it is a governance primitive. Codex and the Fabric discovered it independently. Their composition proves it is fundamental.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

# Sandbox as Governance

> [OpenAI Codex Index](./index.md) · [The Four Laws of AI](../../docs/the-four-laws-of-ai.md) · [Governance Alignment](./governance-alignment.md)

> Codex sandboxes at the kernel level. The Fabric sandboxes at the repository level. Both enforce the same principle — the agent must not escape its boundaries — but they operate on different attack surfaces. Their composition produces the Fabric's most rigorous isolation architecture.

---

## 1. Two Sandboxing Traditions

### The Codex Model

Codex's sandbox is OS-level, enforced by the kernel, not by the application:

| Platform | Mechanism | What It Restricts |
|----------|-----------|-------------------|
| **macOS 12+** | Apple Seatbelt (`sandbox-exec`) | Read-only jail for entire filesystem; explicit writable roots (`$PWD`, `$TMPDIR`, `~/.codex`); all outbound network blocked |
| **Linux** | Docker container + `iptables`/`ipset` firewall | Directory-scoped mounts (repo read/write at same path); all egress denied except OpenAI API; custom firewall script |
| **Linux (experimental)** | Landlock LSM | Kernel-level filesystem access control without Docker overhead |

Key properties:
- **Network is off by default.** In Full Auto mode, the agent cannot reach the internet. Even a `curl` inside a subprocess fails.
- **Filesystem is jailed.** The agent can only write to explicitly allowed directories. System files, other user directories, and credential stores are invisible.
- **Process isolation is kernel-enforced.** No application-level check can be bypassed by prompt injection or tool misuse. The sandbox is enforced by the OS, not by the agent.

### The Fabric Model

The Fabric's isolation inherits from GitHub's infrastructure:

| Layer | Mechanism | What It Restricts |
|-------|-----------|-------------------|
| **Runner VM** | GitHub-managed ephemeral virtual machine | Fresh VM per job; destroyed after completion; no persistent state on the runner |
| **Repository scope** | Git checkout + scoped commits | Agent operates only within the checked-out repository; commits scoped to `state/` directory |
| **Workflow permissions** | `permissions:` block in YAML | Token scopes limited to specific GitHub API operations |
| **Secrets management** | GitHub encrypted secrets | Secrets injected at runtime, never in logs, never in repository |
| **DEFCON levels** | Committed configuration | Graduated behavioral constraints independent of infrastructure |

---

## 2. How They Compare

| Concern | Codex Sandbox | Fabric Isolation | Advantage |
|---------|--------------|-----------------|-----------|
| **Filesystem access** | Kernel-level jail (Seatbelt/Docker) | Runner VM + git checkout scope | Codex (more restrictive) |
| **Network access** | Fully blocked (Full Auto) or API-only | Runner has network access (needed for API + git push) | Codex (more restrictive) |
| **Process escape** | Kernel-enforced (cannot bypass from userspace) | VM-enforced (cannot escape VM) | Comparable |
| **Credential exposure** | Blocked filesystem patterns; no credential access in jail | GitHub Secrets (encrypted, runtime-injected, masked in logs) | Comparable |
| **Multi-user isolation** | N/A (single-user tool) | Collaborator permissions, CODEOWNERS | Fabric (multi-user) |
| **Audit trail** | None (sandbox is invisible to the agent) | Full git history of every action | Fabric (complete audit) |
| **Rollback** | `git checkout`/`git stash` (manual) | `git revert` on committed state | Fabric (one-command) |
| **Persistence** | None (sandbox is ephemeral per command) | None (runner is ephemeral per job) | Comparable |

The critical distinction: **Codex sandboxes better but audits worse.** The Fabric audits everything but sandboxes less restrictively within the runner VM. Together, they cover both gaps.

---

## 3. Composition: Defense in Depth

When Codex runs inside a Fabric workflow, the agent is sandboxed at three levels:

```
┌─────────────────────────────────────────────┐
│  Layer 1: GitHub Runner VM                  │
│  • Ephemeral (destroyed after job)          │
│  • GitHub-managed (patched, isolated)       │
│  • No persistent storage across jobs        │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Layer 2: Codex Sandbox             │    │
│  │  • Docker container or Seatbelt     │    │
│  │  • Network disabled                 │    │
│  │  • Filesystem jailed to $PWD        │    │
│  │  • Kernel-enforced                  │    │
│  │                                     │    │
│  │  ┌─────────────────────────────┐    │    │
│  │  │  Layer 3: Fabric Governance │    │    │
│  │  │  • DEFCON level             │    │    │
│  │  │  • Scoped commits           │    │    │
│  │  │  • Collaborator permissions │    │    │
│  │  │  • Four Laws constraints    │    │    │
│  │  └─────────────────────────────┘    │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

An attacker must breach all three layers to cause harm:

1. **Escape the Codex sandbox** — bypass kernel-enforced filesystem and network restrictions
2. **Escape the runner VM** — break out of GitHub's managed virtual machine
3. **Bypass Fabric governance** — modify sentinel files, DEFCON configuration, or collaborator permissions

No previous Fabric module has had this triple-layer architecture. NanoClaw had container + runner isolation (two layers). OpenClaw had application-level + runner isolation (one and a half layers). Codex adds a kernel-enforced sandbox that is architecturally independent of both the application and the infrastructure.

---

## 4. The Network Question

Codex's most aggressive sandbox decision is **disabling the network entirely** in Full Auto mode. This is a governance statement: an autonomous agent should not be able to exfiltrate data, download malicious code, or communicate with external services.

On the Fabric, the network question is more nuanced:

| Capability | Codex Full Auto | Fabric Module | Tension |
|-----------|----------------|---------------|---------|
| LLM API calls | Allowed (API endpoint whitelisted) | Allowed (required for reasoning) | None |
| Git push | Not applicable (local tool) | Required (state must be committed and pushed) | Must allow |
| Package downloads | Blocked | Sometimes needed (dependency installation) | Must resolve |
| Web search/fetch | Blocked | Sometimes needed (agent tools) | Must resolve |

The Fabric cannot fully adopt Codex's network-disabled model because the Fabric requires network access for `git push` and sometimes for dependency installation. However, the Fabric can adopt Codex's principle: **network access should be explicitly allowed, not implicitly granted.**

### Recommended Composition

```yaml
# In the Fabric workflow
- name: Run Codex (network-disabled phase)
  run: codex --approval-mode full-auto "$TASK"
  env:
    CODEX_SANDBOX_NETWORK_DISABLED: "1"

- name: Commit and push (network-enabled phase)  
  run: |
    git add -A state/
    git diff --cached --quiet || git commit -m "state: issue #${{ github.event.issue.number }}"
    git push
```

This two-phase approach preserves Codex's network isolation during reasoning and execution, while allowing network access only for the commit phase — which is under the Fabric's control, not the agent's.

---

## 5. Sandbox Limitations on GitHub Actions

Codex's Seatbelt sandbox requires macOS runners. Its Docker sandbox requires Docker-in-Docker support. Both have implications for the Fabric:

| Sandbox Type | Runner Requirement | Availability | Cost |
|-------------|-------------------|-------------|------|
| Apple Seatbelt | `macos-latest` | Available (GitHub-hosted) | 10× Linux runner cost |
| Docker container | `ubuntu-latest` + Docker | Available (pre-installed) | Standard rate |
| Landlock LSM | `ubuntu-latest` (kernel 5.13+) | Available on newer runners | Standard rate |
| No sandbox | Any runner | Always available | Lowest |

**Recommendation:** Use Docker-based sandboxing on Linux runners for cost efficiency. Reserve Seatbelt for macOS-specific workflows. Landlock provides a lighter-weight alternative without Docker overhead but requires kernel support verification.

---

## 6. Summary

| Dimension | Codex Alone | Fabric Alone | Codex + Fabric |
|-----------|------------|-------------|---------------|
| **Filesystem isolation** | Kernel-enforced (Seatbelt/Docker) | VM-enforced (runner) | Both layers active |
| **Network isolation** | Fully blocked (Full Auto) | Not restricted within runner | Agent phase blocked; commit phase allowed |
| **Process isolation** | OS sandbox | VM boundary | Both layers active |
| **Audit trail** | None | Complete (git history) | Complete |
| **Rollback** | Manual (`git checkout`) | One-command (`git revert`) | One-command |
| **Multi-user governance** | None | Collaborator + CODEOWNERS | Full governance |
| **Attack surface** | 1 layer (sandbox) | 1 layer (VM) | 3 layers (sandbox + VM + governance) |

Codex's sandbox is the best the Fabric has encountered — not because it is the most innovative (container isolation is well-understood), but because it is the most **principled.** Network off. Filesystem jailed. Kernel-enforced. These are not features. They are governance decisions expressed in infrastructure. The Fabric's contribution is not a better sandbox — it is a better record of what happened inside the sandbox.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

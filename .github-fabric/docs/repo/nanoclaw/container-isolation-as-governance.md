# Container Isolation as Governance

> [NanoClaw Index](./index.md) · [The Four Laws of AI](../../docs/the-four-laws-of-ai.md) · [Governance Alignment](./governance-alignment.md)

> NanoClaw isolates agents in Linux containers. The Fabric isolates them in ephemeral runners. These are two expressions of the same security principle: the agent should only see what is explicitly given to it. Together, they compose into a governance model stronger than either alone.

---

## 1. NanoClaw's Isolation Model

NanoClaw's security architecture is built on a single principle: **isolation is at the OS level, not the application level.**

Every agent invocation spawns a fresh container:

| Property | Specification |
|----------|--------------|
| **Runtime** | Docker (cross-platform) or Apple Container (macOS) |
| **Lifetime** | Per-invocation (`--rm` flag — destroyed after completion) |
| **User** | Unprivileged `node` user (uid 1000) |
| **Filesystem** | Only explicitly mounted directories are visible |
| **Network** | Unrestricted egress (API calls, web access) |
| **Credentials** | Never inside the container — credential proxy injects headers |
| **Project root** | Read-only mount (agent cannot modify host code) |
| **Group folder** | Read-write mount (agent can modify its own memory) |

This is fundamentally different from application-level security:

| Approach | OpenClaw (Application-Level) | NanoClaw (OS-Level) |
|----------|------------------------------|---------------------|
| How isolation works | Allowlists, trust levels, permission checks in code | Container boundaries enforced by kernel |
| What can be bypassed | A bug in permission logic | A container escape (kernel vulnerability) |
| What the agent sees | Everything in the process's memory space | Only mounted paths |
| Credential exposure | Environment variables accessible to the process | Credentials never enter the container |
| Bash safety | Elevated bash toggle (application permission) | Commands run inside container, not on host |

NanoClaw's creator explains the motivation: application-level security means trusting that the permission code is correct. Container isolation means trusting the operating system. The attack surface of the Linux kernel is orders of magnitude smaller than the attack surface of a 500,000-line application.

---

## 2. The Fabric's Isolation Model

The Fabric isolates agents through a different mechanism: **ephemeral runners on GitHub Actions.**

| Property | Specification |
|----------|--------------|
| **Runtime** | GitHub-hosted runner (Ubuntu VM) |
| **Lifetime** | Per-workflow-run (destroyed after completion) |
| **User** | `runner` user with limited permissions |
| **Filesystem** | Fresh workspace, no persistent state |
| **Network** | Unrestricted egress |
| **Credentials** | GitHub Secrets injected as environment variables |
| **Repository** | Checked out at workflow start |
| **Commit scope** | Agent can only write to designated state directories |

The Fabric adds a governance layer that runners do not provide natively:

| Governance Layer | Mechanism |
|------------------|-----------|
| **Sentinel file** | Agent refuses to run unless an enable file exists |
| **DEFCON levels** | Committed configuration constraining agent capabilities |
| **Scoped commits** | Agent writes only to `state/` directory |
| **Preflight validation** | Structural checks before agent execution |
| **Bot-comment filtering** | Agent ignores its own comments to prevent loops |
| **Collaborator check** | Only repository collaborators can trigger the agent |

---

## 3. How They Compose

NanoClaw's container isolation and the Fabric's runner isolation operate at different levels. When composed, they create a **three-layer isolation model**:

| Layer | Mechanism | What It Prevents |
|-------|-----------|-----------------|
| **1. GitHub Permissions** | Collaborator check, encrypted secrets, audit log | Unauthorized invocation, credential exposure |
| **2. Runner Isolation** | Ephemeral VM, no persistent state, fresh workspace | Cross-run contamination, state leakage |
| **3. Container Isolation** | Docker/Apple Container inside the runner, mount restrictions | Agent access to host filesystem, credential theft, code modification |

In a Fabric expression of NanoClaw, the agent runs inside a container inside a runner. The runner provides the outer isolation boundary (no persistence between invocations). The container provides the inner isolation boundary (the agent cannot see the runner's filesystem beyond explicit mounts). GitHub permissions provide the authorization boundary (only collaborators can trigger the workflow).

### Practical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GITHUB PLATFORM                       │
│  • Collaborator authentication                          │
│  • Encrypted secrets management                         │
│  • Audit logging                                        │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  ACTIONS RUNNER (VM)                      │
│  • Ephemeral (destroyed after workflow)                  │
│  • Repository checkout                                   │
│  • Lifecycle scripts (preflight, postflight)             │
│  • Credential proxy on host network                     │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼ Explicit mounts only
┌─────────────────────────────────────────────────────────┐
│               CONTAINER (DOCKER)                         │
│  • Claude Agent SDK execution                            │
│  • Read-only project mount                               │
│  • Read-write group folder mount                         │
│  • No real credentials (proxy handles auth)             │
│  • Non-root user (uid 1000)                             │
└─────────────────────────────────────────────────────────┘
```

---

## 4. The Credential Proxy Composes Cleanly

NanoClaw's most elegant security mechanism is the **credential proxy**: real API keys never enter the container. Instead:

1. The host process starts an HTTP proxy on a local port.
2. The container receives `ANTHROPIC_BASE_URL=http://host.docker.internal:<port>` and `ANTHROPIC_API_KEY=placeholder`.
3. The SDK sends API requests to the proxy with the placeholder key.
4. The proxy strips the placeholder, injects real credentials, and forwards to `api.anthropic.com`.
5. The agent cannot discover real credentials — not in environment, stdin, files, or `/proc`.

In the Fabric, this composes with GitHub Secrets:

| Step | NanoClaw Native | Fabric Expression |
|------|----------------|-------------------|
| **Secret storage** | `.env` file on host | GitHub encrypted secrets |
| **Injection point** | Credential proxy process | Workflow `env:` or credential proxy |
| **Container visibility** | Placeholder only | Placeholder only (if proxy is used) |
| **Recovery if compromised** | Rotate key, restart process | Rotate key, re-run workflow |
| **Audit trail** | Host process logs | Git history + Actions logs |

The Fabric can adopt NanoClaw's credential proxy directly. The proxy runs on the Actions runner (host side), and the container inside the runner communicates through it. This adds an isolation layer that standard Fabric modules do not have: even if the agent's container is compromised, the real API key is on the host side of the proxy, not inside the container.

---

## 5. Mount Security as Committed Policy

NanoClaw's mount security system validates every directory mount before allowing it into a container:

| Security Feature | How It Works |
|-----------------|-------------|
| **External allowlist** | `~/.config/nanoclaw/mount-allowlist.json` — outside project root, never mounted |
| **Blocked patterns** | `.ssh`, `.gnupg`, `.aws`, `.env`, `id_rsa`, `private_key`, `.secret`, etc. |
| **Symlink resolution** | All paths resolved before validation (prevents traversal) |
| **Container path validation** | Rejects `..` and absolute paths |
| **Read-only project root** | Agent cannot modify host application code |
| **Non-main read-only** | Non-main groups get read-only mounts by default |

In the Fabric, mount policy becomes **committed configuration**:

```
.GITNANOCLAW/
  config/
    mount-policy.json        ← Allowed mounts (committed, reviewable)
    blocked-patterns.json    ← Blocked path patterns
  state/
    groups/                  ← Per-group memory (writable)
    sessions/                ← Session transcripts
```

The transformation: NanoClaw's mount allowlist lives outside the project root (for security). In the Fabric, it lives inside the repository (for governance). This works because the Fabric's commit-scoped model prevents the agent from modifying its own mount policy — the policy is in committed configuration, and the agent can only write to `state/`.

---

## 6. The Trust Inversion

NanoClaw and the Fabric have opposite trust models that compose into something stronger:

| Trust Question | NanoClaw Answer | Fabric Answer | Composed Answer |
|---------------|-----------------|---------------|-----------------|
| **Who is trusted?** | The container host (your machine) | The repository owner (collaborators) | Both — host isolation + repository governance |
| **What is untrusted?** | Everything inside the container | Everything outside the repository | Container contents AND external inputs |
| **Where is the boundary?** | Container wall (kernel-enforced) | Repository scope (git-enforced) | Both boundaries active simultaneously |
| **How is trust established?** | Mount permissions at container creation | Collaborator permissions on GitHub | Both checks must pass |
| **How is trust revoked?** | Unmount the directory | Remove collaborator access | Either revocation is sufficient |

The composed model is **defense in depth**: an attacker must compromise both the container boundary (kernel exploit) and the repository boundary (GitHub permissions) to achieve unauthorized access. Neither system alone provides this level of assurance.

---

## 7. Summary

| Isolation Layer | What It Provides | Source |
|----------------|-----------------|--------|
| **GitHub permissions** | Authorization: only collaborators invoke the agent | Fabric native |
| **Runner isolation** | Temporal: no state persists between invocations | Fabric native |
| **Container isolation** | Spatial: agent sees only mounted paths | NanoClaw native |
| **Credential proxy** | Secret isolation: real keys never enter the execution environment | NanoClaw native |
| **Mount security** | Policy: committed rules govern what the agent can access | NanoClaw native, Fabric-governed |
| **Scoped commits** | Integrity: agent can only write to designated directories | Fabric native |
| **DEFCON levels** | Operational: graduated capability constraints | Fabric native |

NanoClaw's container isolation is not competing with the Fabric's runner isolation. They are **complementary layers** — one providing spatial boundaries (what the agent can see), the other providing temporal boundaries (how long the agent exists), and both wrapped in GitHub's authorization layer. The composed model is the strongest isolation architecture the Fabric has encountered: defense in depth from the kernel to the repository to the platform.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

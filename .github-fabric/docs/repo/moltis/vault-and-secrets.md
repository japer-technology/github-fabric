# Vault and Secrets

> [Moltis Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> Moltis encrypts secrets locally with XChaCha20-Poly1305 and derives keys with Argon2id. The Fabric stores secrets in GitHub Secrets and references them by name. These are two trust models — one where the user **holds** the keys, and one where the platform **manages** the keys. The Fabric learns that trust is not a binary choice but a **spectrum**, and governance must declare where on the spectrum the system operates.

---

## 1. Two Trust Models

### The Local Vault Model (Moltis)

Moltis's `moltis-vault` crate implements encryption at rest:

| Component | Implementation |
|-----------|---------------|
| Encryption algorithm | XChaCha20-Poly1305 (authenticated encryption with 192-bit nonces) |
| Key derivation | Argon2id (memory-hard, resistant to GPU/ASIC attacks) |
| Secret handling in memory | `secrecy::Secret<T>` — values are never printed, logged, or serialized |
| Secret destruction | `zeroize` — memory is overwritten with zeros on drop |
| Authentication | Password + Passkey (WebAuthn) + API keys |
| Rate limiting | Per-IP throttle on authentication endpoints |

The user creates a password during first setup. Argon2id derives an encryption key from that password. All secrets (API keys, provider credentials, session tokens) are encrypted with XChaCha20-Poly1305 before being written to disk. When the user authenticates, the key is derived again and secrets are decrypted into `secrecy::Secret<T>` wrappers that prevent accidental exposure.

The trust model: **the user holds the only key.** If the user forgets the password, the secrets are unrecoverable. If the disk is stolen, the secrets are encrypted. If the process crashes, secrets in memory are zeroed. At no point does any external service — including LLM providers — have access to the vault's contents.

### The Platform Secrets Model (Fabric)

The Fabric stores secrets in GitHub Secrets:

| Component | Implementation |
|-----------|---------------|
| Encryption | GitHub-managed (Libsodium sealed box) |
| Key management | GitHub's infrastructure |
| Secret handling | Masked in logs, available as environment variables in Actions |
| Access control | Repository/organization/environment-scoped |
| Authentication | GitHub account (OAuth, SAML, passkey) |
| Audit | GitHub audit log |

The user sets a secret value through the GitHub UI or API. GitHub encrypts it at rest using Libsodium sealed-box encryption. During a workflow run, the secret is decrypted and injected as an environment variable. The value is masked in logs.

The trust model: **GitHub holds the key.** The user trusts GitHub's infrastructure to protect the secret. If GitHub's encryption is compromised, the secrets are exposed. If the user loses access to their GitHub account, the secrets are still accessible to other collaborators. The secret's lifecycle is managed by the platform, not the user.

---

## 2. The Trust Spectrum

These models are not opposites — they are points on a spectrum:

```
Full Local Control ◄────────────────────────────────────► Full Platform Trust
     │                                                           │
  Moltis Vault                                          GitHub Secrets
  (user holds key,                                     (platform holds key,
   local encryption,                                    cloud encryption,
   zero external trust)                                 trust delegated)
```

Between these poles are intermediate positions:

| Position | Description | Example |
|----------|-------------|---------|
| **Full local** | User holds all keys, no platform involvement | Moltis vault with local models |
| **Local + remote API** | User holds vault key, but sends requests to cloud LLM APIs | Moltis with OpenAI API key in vault |
| **Local + platform secrets** | Some secrets local, some in platform | Moltis config from repo, API keys in GitHub Secrets |
| **Full platform** | All secrets in platform, runtime in platform | Fabric with GitHub Secrets + Actions |

Most real deployments land in the middle. A Moltis user who calls OpenAI's API is already trusting OpenAI with their prompts and responses. A Fabric user who runs a self-hosted runner is already moving execution off GitHub's infrastructure. The question is not "local or platform?" but **"what is trusted to whom, and is that trust relationship declared?"**

---

## 3. The Governance of Trust Boundaries

The Fabric's contribution to the trust question is not technical — it is procedural. The Fabric can govern trust boundaries by requiring them to be **declared and reviewed**:

```yaml
# .github-fabric/trust-declaration.yml (conceptual)
trust:
  secret-store: local-vault    # or: github-secrets, hybrid
  api-keys:
    openai: local-vault         # encrypted locally
    github: github-secrets      # managed by platform
  data-residency: user-hardware # or: github-cloud, hybrid
  model-access: cloud-api       # or: local-model, hybrid
  session-storage: local-disk   # or: github-artifact, hybrid
```

This declaration does not change where secrets are stored — Moltis still encrypts locally, GitHub still manages platform secrets. What it changes is **visibility**: the team can see, review, and approve the trust model. A change from `local-vault` to `github-secrets` requires a PR review. The trust boundary is not implicit — it is committed.

---

## 4. Secret Lifecycle Comparison

The lifecycle of a secret differs significantly between the two models:

### Creation

| Phase | Moltis | Fabric |
|-------|--------|--------|
| User provides value | Terminal prompt or web UI setup wizard | GitHub UI or API |
| Key derivation | Argon2id from user password | GitHub-managed |
| Encryption | XChaCha20-Poly1305 to local file | Libsodium sealed box to GitHub storage |
| Confirmation | Decrypt + verify locally | Secret appears masked in UI |

### Usage

| Phase | Moltis | Fabric |
|-------|--------|--------|
| Authentication | Password or passkey | GitHub login (OAuth, SAML, passkey) |
| Decryption | In-process, Argon2id key derivation | By GitHub, injected as env var |
| In-memory handling | `secrecy::Secret<T>`, never logged | Environment variable, masked in logs |
| Scope | All agent sessions on this instance | Specific workflow run |

### Rotation

| Phase | Moltis | Fabric |
|-------|--------|--------|
| Trigger | User decision | User decision or policy |
| Process | Update vault entry locally | Update secret in GitHub UI/API |
| Propagation | Immediate (next decrypt) | Next workflow run |
| Audit | Local log (if configured) | GitHub audit log |

### Destruction

| Phase | Moltis | Fabric |
|-------|--------|--------|
| Trigger | User deletes entry or vault | User deletes secret |
| Memory | `zeroize` — overwritten with zeros | Process termination |
| Disk | Vault file overwritten | GitHub-managed deletion |
| Verification | User can verify locally | Trust GitHub's deletion |

The Fabric should notice: Moltis's lifecycle gives the user **verifiable control** at every step. The Fabric's lifecycle gives the user **delegated convenience** at every step. Neither is wrong — they serve different operational models.

---

## 5. The WebAuthn Dimension

Moltis supports passkey authentication via WebAuthn (`webauthn-rs`). This is the same FIDO2 standard that GitHub supports for account authentication. The convergence is notable: both systems have adopted the same modern authentication standard, but for different purposes.

| | Moltis Passkey | GitHub Passkey |
|---|---------------|---------------|
| **Protects** | Access to local Moltis instance | Access to GitHub account |
| **Scope** | Single device/instance | Cloud account across devices |
| **Fallback** | Password + API key | Password + 2FA |
| **What it governs** | Local AI gateway access | Repository access (and thus Fabric governance) |

In a composed system, a user might authenticate to GitHub with a passkey (to access the repository and committed configuration) and authenticate to Moltis with a passkey (to access the local AI gateway). Two passkeys, two trust domains, one user. The Fabric governs the configuration; Moltis governs the execution. The passkeys are the proof that the human authorized both.

---

## 6. The Redaction Problem

Both systems face the secret redaction problem: how do you prevent secrets from appearing in AI output?

Moltis's approach:
- `secrecy::Secret<T>` implements `Debug` and `Display` with `[REDACTED]`
- Tool output is sanitized before being returned to the agent
- Vault values never enter the prompt or tool results in cleartext

The Fabric's approach:
- GitHub Secrets are masked in workflow logs
- The agent should never receive the secret value directly
- Configuration references secrets by name (`${{ secrets.OPENAI_KEY }}`), not by value

Both approaches have the same vulnerability: if the AI is asked to "print the environment variable OPENAI_API_KEY," both systems must prevent the value from appearing in the response. Moltis handles this at the binary level (the `secrecy` crate makes accidental printing impossible). The Fabric handles this at the platform level (GitHub masks known secret values in logs).

The composed defense: **Moltis prevents the binary from leaking secrets through type-level enforcement. The Fabric prevents the workflow from leaking secrets through log masking. GitHub's platform prevents secrets from appearing in PR diffs through secret scanning.** Three layers, three enforcement points, one goal.

---

## 7. What Vault and Secrets Teach Fabric

The lesson is not that local vaults are better than platform secrets, or vice versa. The lesson is that **trust is a governance decision, and governance decisions must be declared.**

A system that uses local encryption does not automatically have better security — it has different trust properties. A system that uses platform secrets does not automatically have worse security — it has different operational properties. The Fabric's role is to make the trust model **explicit, reviewable, and auditable**:

- Where are secrets stored? (Local vault, GitHub Secrets, hybrid)
- Who can access them? (Single user, team, organization)
- How are they protected? (User password, platform encryption, both)
- What happens if the trust anchor fails? (User forgets password, GitHub has outage)
- Is the trust model appropriate for the data sensitivity? (API keys, PII, regulated data)

These questions have no universal correct answer. They have context-dependent correct answers that the Fabric ensures are **committed, reviewed, and revisitable**. The vault is the technical mechanism. The repository is the governance mechanism. Both serve the same goal: ensuring that secrets are handled with the care they deserve.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

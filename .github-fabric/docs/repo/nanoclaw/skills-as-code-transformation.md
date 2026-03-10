# Skills as Code Transformation

> [NanoClaw Index](./index.md) · [Smallness as Architecture](./smallness-as-architecture.md) · [Transformation Map](./transformation-map.md)

> NanoClaw's skills are not plugins. They are not configuration. They are Claude Code instructions that permanently modify your fork's source code. This is the most radical customization model the Fabric has encountered — and it is closer to the Fabric's own architecture than it first appears.

---

## 1. The Skills Model

NanoClaw has 20+ skills stored in `.claude/skills/`:

| Skill | Purpose |
|-------|---------|
| `/setup` | First-time installation, authentication, container setup, service configuration |
| `/customize` | Guided codebase modifications |
| `/debug` | Container issues, logs, troubleshooting |
| `/update-nanoclaw` | Merge upstream NanoClaw updates into a customized install |
| `/add-whatsapp` | Add WhatsApp as a messaging channel |
| `/add-telegram` | Add Telegram as a messaging channel |
| `/add-discord` | Add Discord as a messaging channel |
| `/add-slack` | Add Slack as a messaging channel |
| `/add-gmail` | Add Gmail as a messaging channel |
| `/add-image-vision` | Add image understanding capabilities |
| `/add-voice-transcription` | Add voice transcription support |
| `/add-reactions` | Add emoji reaction support |
| `/add-compact` | Add conversation compaction |
| `/add-parallel` | Add parallel agent execution |
| `/add-pdf-reader` | Add PDF reading capability |
| `/add-ollama-tool` | Add local model integration |
| `/add-telegram-swarm` | Add Telegram with agent swarm support |
| `/convert-to-apple-container` | Switch from Docker to Apple Container |
| `/use-local-whisper` | Switch to local Whisper for transcription |
| `/x-integration` | Add X/Twitter integration |

Each skill is a `SKILL.md` file — a natural-language instruction set that Claude Code reads and executes. When a user runs `/add-telegram`, Claude Code:

1. Reads `.claude/skills/add-telegram/SKILL.md`.
2. Understands the instructions (create channel file, register in registry, add dependencies).
3. Modifies the source code of the user's fork.
4. The changes are committed to the user's repository.

The result: every user's NanoClaw fork has **different source code** — customized to their exact needs, with no configuration files and no feature flags. A user who needs WhatsApp and Telegram has different code than a user who needs Discord and Gmail.

---

## 2. Why This Matters for the Fabric

NanoClaw's skills model embodies a principle the Fabric already holds but has not yet seen expressed this purely: **the repository is the single source of truth, and all customization is committed change.**

In traditional systems, customization happens through:
- Configuration files (YAML, JSON, TOML)
- Environment variables
- Feature flags
- Plugin registries
- Runtime parameters

NanoClaw rejects all of these. Customization is a code commit. The repository **is** the configuration.

The Fabric's module system uses committed configuration (JSON files in `.github-fabric/`). This is the governance-constrained version of the same principle. Both systems agree that:

1. The repository defines behavior.
2. Changes are committed (diffable, reviewable, revertible).
3. There is no runtime configuration that contradicts the committed state.

---

## 3. Skills vs. Fabric Modules: A Comparison

| Property | NanoClaw Skills | Fabric Modules |
|----------|----------------|----------------|
| **What they modify** | Source code (TypeScript files, imports, registrations) | Committed configuration (JSON/YAML) |
| **Who applies them** | Claude Code (AI-mediated) | Human or AI via PR |
| **Review process** | User reviews Claude Code's changes | PR review by collaborators |
| **Expressiveness** | Unlimited (can modify any source file) | Bounded (schema-constrained configuration) |
| **Safety boundary** | User trust in Claude Code + code review | Schema validation + PR review + CODEOWNERS |
| **Rollback** | `git revert` the skill application commit | `git revert` the config change commit |
| **Composability** | Skills can conflict (two skills modifying same file) | Modules designed for independent composition |
| **Audit trail** | Git commit with Claude Code attribution | Git commit with author attribution |

The key difference is the **safety boundary**. NanoClaw's skills can modify any file — they have full write access to the codebase. The Fabric's modules can only modify designated configuration files, and the agent's runtime writes are scoped to state directories. The Fabric trades expressiveness for governance.

---

## 4. The Convergence Point

Despite the surface difference, NanoClaw skills and Fabric modules converge on the same workflow:

```
User intent → AI mediator → Repository change → Git commit → New behavior
```

For NanoClaw:
```
"Add Telegram" → Claude Code reads SKILL.md → Modifies src/channels/ → Commits → Telegram works
```

For the Fabric:
```
"Enable browser tool" → Human/AI edits config → Modifies .github-fabric/ → Commits → Browser tool enabled
```

Both workflows produce the same artifact: a committed change to the repository that alters the agent's behavior. The difference is in scope (source code vs. configuration) and mediation (Claude Code vs. PR review).

---

## 5. Skills as Precedent for Fabric Evolution

NanoClaw's skills model suggests an evolution path for the Fabric that has not been explored:

### 5.1 Fabric Skills

What if the Fabric had skills — natural-language instruction sets that an AI mediator could execute to customize a Fabric module?

```
.github-fabric/
  skills/
    add-browser-tool/
      SKILL.md          ← "Enable browser automation for this module"
    add-memory-log/
      SKILL.md          ← "Add append-only memory logging"
    add-sub-agent/
      SKILL.md          ← "Configure sub-agent orchestration"
```

A user would run a command (or open an issue), and the Fabric's agent would:
1. Read the skill instruction.
2. Modify the committed configuration.
3. Commit the change via a PR for review.

This preserves the Fabric's governance boundary (all changes go through PR review) while adopting NanoClaw's AI-mediated customization model. The skill is the intent; the PR is the governance gate; the commit is the result.

### 5.2 The Governance Boundary

The critical difference between NanoClaw skills and hypothetical Fabric skills is **what can be modified**:

| System | Modifiable Scope | Governance Gate |
|--------|-----------------|-----------------|
| NanoClaw skills | Any source file | User reviews Claude Code output |
| Fabric skills (hypothetical) | Configuration files only | PR review by CODEOWNERS |
| Fabric agent runtime | State directory only | Automatic (scoped commits) |

The Fabric's three-tier model (configuration → PR review, state → scoped commits, source → never modified by agent) provides stronger governance than NanoClaw's single-tier model (everything → code review). But NanoClaw's model is more expressive — it can add entirely new capabilities, not just toggle existing ones.

---

## 6. The Update Problem

NanoClaw's skills model creates a unique challenge: **upstream drift.** When every fork has different source code, merging upstream updates becomes complex. NanoClaw addresses this with a dedicated skill:

`/update-nanoclaw` — merges upstream changes into a customized fork, resolving conflicts between base code and skill-applied modifications.

The Fabric does not have this problem in the same way, because Fabric modules modify configuration, not source code. Upstream updates to the source plane do not conflict with module configuration. But the underlying challenge is the same: how do you maintain customization while staying current with the upstream?

| Approach | NanoClaw | Fabric |
|----------|----------|--------|
| **Customization location** | Source code (interleaved with upstream) | Configuration (separate from source) |
| **Upstream update** | Git merge with conflict resolution via Claude Code | Source plane re-ingestion (no config conflicts) |
| **Conflict probability** | High (skills modify core files) | Low (config is orthogonal to source) |
| **Resolution method** | AI-mediated merge (`/update-nanoclaw` skill) | Automatic (config preserved, source replaced) |

The Fabric's separation of source and configuration is a governance advantage: it eliminates the merge problem that NanoClaw must solve with AI assistance. But NanoClaw's approach is more honest about what customization actually requires: sometimes you need to change the code, not just the config.

---

## 7. Contributing as Skill Submission

NanoClaw's contribution model is unusual: the project explicitly asks contributors not to add features as code, but to submit skills as instructions:

> "Don't add features. Add skills. If you want to add Telegram support, don't create a PR that adds Telegram alongside WhatsApp. Instead, contribute a skill file that teaches Claude Code how to transform a NanoClaw installation to use Telegram."

This is a fundamentally different contribution model. Traditional open source accumulates features in a shared codebase. NanoClaw accumulates **transformation instructions** that are applied per-fork.

The Fabric equivalent would be contributing module definitions — committed configuration templates that any Fabric installation can adopt. Both models share the principle: **contribute the pattern, not the implementation.** Each user gets a clean implementation generated from the pattern, rather than a shared codebase carrying every user's features.

---

## 8. Summary

| Insight | What It Means for the Fabric |
|---------|------------------------------|
| Skills are committed code changes | The Fabric's committed-config model is the governance-constrained version of the same principle |
| AI-mediated customization works | Claude Code applying skills = Fabric agent modifying config via PR — same workflow, different scope |
| Code-as-config eliminates config sprawl | When the codebase is small enough, separate config files are unnecessary overhead |
| The update problem is real | The Fabric's source/config separation is a governance advantage over NanoClaw's interleaved model |
| Contributing patterns over implementations | Both NanoClaw and the Fabric favor distributing instructions over distributing code |
| Skills suggest Fabric evolution | Natural-language skill instructions for Fabric modules could combine NanoClaw's expressiveness with Fabric governance |

NanoClaw's skills model is the most radical customization approach the Fabric has encountered. It eliminates the configuration layer entirely, replacing it with AI-mediated code transformation. The Fabric cannot adopt this model wholesale — the governance boundary requires separating what the agent can modify from what requires human review. But the underlying insight is shared: **the repository is the source of truth, and customization is a committed change** — whether that change is to configuration or code.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

# Smallness as Architecture

> [NanoClaw Index](./index.md) · [The Repo Is the Mind](../../docs/the-repo-is-the-mind.md) · [What NanoClaw Teaches Fabric](./what-nanoclaw-teaches-fabric.md)

> NanoClaw's defining constraint is not a feature — it is an architectural decision: the entire codebase must fit inside an AI's context window. When the Fabric absorbs this, the mind is small enough to read itself.

---

## 1. The Context-Window Constraint

NanoClaw's README displays a badge: **"34.9k tokens, 17% of context window."** This is not documentation — it is a specification. Every architectural decision flows from this constraint:

| Decision | Rationale |
|----------|-----------|
| Single process | Multiple processes mean multiple codebases to understand |
| No microservices | Each microservice adds context that competes for the window |
| No configuration files | Config is code surface area that must be comprehended |
| Six runtime dependencies | Each dependency is potential complexity outside the window |
| Skills over features | Features bloat the codebase; skills transform it per-user |
| No abstraction layers | Abstractions compress code but expand cognitive load |

The result is a system where a single prompt can contain the orchestrator (`src/index.ts`, ~18KB), the container runner (`src/container-runner.ts`, ~22KB), the database layer (`src/db.ts`, ~20KB), the channel registry, the router, the scheduler, the IPC handler, and the type definitions — with room to spare.

---

## 2. What Fits in the Window

NanoClaw's source files and their approximate sizes:

| File | Size | Purpose |
|------|------|---------|
| `src/index.ts` | ~18 KB | Orchestrator: state, message loop, agent invocation |
| `src/container-runner.ts` | ~22 KB | Spawns streaming agent containers with mounts |
| `src/db.ts` | ~20 KB | SQLite operations (messages, groups, sessions, state) |
| `src/ipc.ts` | ~15 KB | IPC watcher and task processing |
| `src/group-queue.ts` | ~11 KB | Per-group queue with global concurrency limit |
| `src/mount-security.ts` | ~11 KB | Mount validation and security enforcement |
| `src/task-scheduler.ts` | ~8 KB | Scheduled task execution |
| `src/container-runtime.ts` | ~4 KB | Docker/Apple Container runtime detection |
| `src/credential-proxy.ts` | ~4 KB | Host-side credential injection proxy |
| `src/sender-allowlist.ts` | ~3 KB | Sender verification |
| `src/types.ts` | ~3 KB | Shared type definitions |
| `src/config.ts` | ~2 KB | Trigger pattern, paths, intervals |
| `src/router.ts` | ~1 KB | Message formatting and outbound routing |
| `src/group-folder.ts` | ~1 KB | Group directory management |
| `src/env.ts` | ~1 KB | Environment variable loading |
| `src/logger.ts` | ~0.5 KB | Pino logger configuration |
| `src/timezone.ts` | ~0.4 KB | Timezone detection |

**Total source: ~125 KB, approximately 35,000 tokens.**

This is not a toy. This is a production system with container isolation, mount security, credential proxying, multi-channel support, scheduled tasks, agent swarms, and per-group memory — all within 17% of a modern LLM's context window.

---

## 3. The Fabric Implication: Self-Comprehending Modules

When the Fabric absorbs NanoClaw, the agent that runs on the repository has access to the repository's contents. For NanoClaw, this means the agent can read its own source code — all of it — in a single context load.

This creates a category of Fabric module that has not existed before:

| Module Category | Self-Comprehension | Example |
|----------------|-------------------|---------|
| **Opaque** | Agent cannot read or understand its own source | OpenClaw (500K+ lines exceed context) |
| **Partially legible** | Agent can read key files but not the whole system | Agenticana (20 agent configs, large surface) |
| **Fully legible** | Agent can read and comprehend its entire source in one pass | NanoClaw (~35K tokens) |

A fully legible module can:

1. **Self-audit** — verify that its own code matches its stated behavior.
2. **Self-diagnose** — when something fails, read its own logic to identify the cause.
3. **Self-document** — generate accurate documentation from its own source without hallucination.
4. **Self-constrain** — verify that its committed state is consistent with its configuration.
5. **Propose self-modifications** — suggest improvements to its own orchestration (subject to governance constraints).

This does not violate the Four Laws. The agent still cannot modify its own workflow files, lifecycle scripts, or governance configuration. But it can propose changes via issue comments — and those proposals will be grounded in actual self-knowledge, not inference from partial context.

---

## 4. The Complexity Budget

NanoClaw's context-window constraint implies a **complexity budget**: there is a finite amount of complexity the system can contain before it exceeds the AI's ability to hold it all in mind.

The Fabric has an analogous budget, driven by different constraints:

| Constraint | NanoClaw's Budget | Fabric's Budget |
|-----------|-------------------|-----------------|
| **Context window** | ~200K tokens (Claude) | Not applicable (stateless per invocation) |
| **Actions minutes** | Not applicable (local runtime) | 2,000–50,000 min/month |
| **Build time** | Not applicable (runs directly) | Minutes per invocation (proportional to complexity) |
| **Git storage** | Not applicable (SQLite) | 5 GB soft limit |
| **Comprehensibility** | Must fit in one context load | Must be reviewable by humans via diffs |

The budgets are different, but the principle is the same: **complexity has a cost, and the system performs best when complexity is minimized.** NanoClaw enforces this through a hard constraint (context window). The Fabric enforces it through economic pressure (more complexity = more minutes, more storage, more build time).

When NanoClaw enters the Fabric, both budget systems align. The module is small enough for the AI to comprehend, cheap enough for Actions to run, and simple enough for humans to review. This triple alignment — AI-legible, economically efficient, and human-reviewable — is the ideal state for a Fabric module.

---

## 5. No Configuration Files

NanoClaw has zero configuration files. The README states:

> "NanoClaw doesn't use configuration files. To make changes, just tell Claude Code what you want."

This is a radical position. Every other system the Fabric has analyzed — OpenClaw (53 config files), Agenticana (YAML specifications), even GMI (JSON settings) — uses configuration to separate behavior from code. NanoClaw collapses this distinction: **behavior is code, and code is the only configuration.**

For the Fabric, this matters because the Fabric's own module system uses committed configuration (JSON and YAML files in `.github-fabric/`). NanoClaw's approach suggests an alternative: instead of configuring the agent through committed JSON, configure it by committing code changes.

| Approach | NanoClaw (Code-as-Config) | Fabric (Committed Config) |
|----------|--------------------------|--------------------------|
| **Change mechanism** | Modify source code | Edit JSON/YAML files |
| **Review process** | PR with code diff | PR with config diff |
| **AI involvement** | Claude Code makes the change | Human edits the config |
| **Expressiveness** | Unlimited (code can do anything) | Bounded (schema-constrained) |
| **Safety** | Depends on review quality | Schema validation + review |
| **Rollback** | `git revert` | `git revert` |

Both approaches result in committed, diffable, reviewable changes. The difference is in the safety boundary: committed config is schema-constrained (you can validate it structurally); committed code requires review to validate semantically. The Fabric chooses the safer model. NanoClaw chooses the more expressive one.

The lesson is not that the Fabric should adopt NanoClaw's model. It is that **both models share the same underlying principle: the repository is the single source of truth, and all changes are committed.** The Fabric's config-only approach is the governance-constrained version of NanoClaw's code-as-config philosophy.

---

## 6. The Nano-Repo Pattern

NanoClaw introduces a repository pattern the Fabric has not seen before: the **nano-repo** — a complete, production-grade system contained in a repository small enough for an AI to hold in its entirety.

Characteristics of a nano-repo:

| Property | Requirement |
|----------|------------|
| **Total token count** | < 20% of the target model's context window |
| **Runtime dependencies** | < 10 |
| **Source files** | < 20 |
| **Build steps** | < 3 (typically: install, compile, run) |
| **Config files** | 0 (or < 3 if absolutely necessary) |
| **Test infrastructure** | Co-located with source (`.test.ts` alongside `.ts`) |

NanoClaw fits all of these criteria. It is the canonical nano-repo.

For the Fabric, the nano-repo is the ideal source format. It minimizes:
- **Build time** (fewer dependencies, simpler compilation)
- **Build cost** (fewer Actions minutes per invocation)
- **Ingestion complexity** (the transformation plane has less to normalize)
- **Audit burden** (humans and AI can review the entire system)

The Fabric does not require nano-repos. It can absorb OpenClaw's 500 MB monorepo. But NanoClaw demonstrates that nano-repos are the **path of least resistance** — the format where source complexity, Fabric overhead, and governance cost all converge on their minimums.

---

## 7. Summary

| Property | What NanoClaw Demonstrates |
|----------|---------------------------|
| Context-window constraint | A hard limit on complexity produces better architecture |
| Self-comprehension | The agent can read and understand its own source — a first for the Fabric |
| Complexity budget | Both NanoClaw and the Fabric reward minimalism through different mechanisms |
| Code-as-config | Configuration files are unnecessary when the codebase is small enough to modify directly |
| Nano-repo pattern | Production systems can be context-window-sized — and this is the Fabric's ideal source format |
| Triple alignment | AI-legible + economically efficient + human-reviewable is the optimal state for a Fabric module |

Smallness is not a limitation of NanoClaw. It is the architecture. When the Fabric absorbs this architecture, the result is a module that achieves something no previous case study has: a mind small enough to read itself, cheap enough to run on every issue, and simple enough for every stakeholder — human and AI — to trust.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

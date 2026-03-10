# AGENTS.md as Committed Memory

> [OpenAI Codex Index](./index.md) · [The Repo Is the Mind](../../docs/the-repo-is-the-mind.md) · [What Codex Teaches Fabric](./what-codex-teaches-fabric.md)

> Codex loads behavioral instructions from AGENTS.md files at three levels: global, repo root, and current directory. The Fabric stores agent identity in committed configuration. Both systems treat the repository as the source of truth for how the agent should behave. The convergence is not accidental — it reveals an emerging standard for repository-native agent memory.

---

## 1. Codex's AGENTS.md Hierarchy

Codex looks for AGENTS.md files in three locations, merged top-down:

| Level | Path | Scope | Example Content |
|-------|------|-------|-----------------|
| **Global** | `~/.codex/AGENTS.md` | All projects, all repos | Personal preferences: "Use TypeScript strict mode", "Prefer pnpm over npm" |
| **Repo root** | `AGENTS.md` (repo root) | This repository | Project conventions: coding standards, architecture notes, test patterns |
| **Working directory** | `AGENTS.md` (cwd) | This subdirectory | Feature-specific: "This module uses the observer pattern", "API endpoints follow REST conventions" |

The merge is hierarchical: global provides defaults, repo root overrides with project-specifics, working directory overrides with local-specifics. The agent sees a single merged instruction set.

Codex also has a `.codex/` directory at the repo root for skills and additional configuration, further extending the repository-as-memory pattern.

---

## 2. The Fabric's Committed Configuration

The Fabric stores agent behavior in committed files within the `.github-fabric/` directory:

| Component | Path | Scope | Example Content |
|-----------|------|-------|-----------------|
| **Agent identity** | `.github-fabric/AGENTS.md` | This repository | Agent name, personality, behavioral guidance, thinking style |
| **Packages** | `.github-fabric/PACKAGES.md` | This repository | Runtime dependencies and required packages |
| **DEFCON state** | Module config files | Per-module | Current readiness level, behavioral constraints |
| **Module config** | `.GITMODULE/config/settings.json` | Per-module | Model selection, invocation limits, feature flags |
| **Sentinel files** | `.GITMODULE/MODULE-ENABLED.md` | Per-module | Presence = active; absence = disabled |

Both systems share the same fundamental assumption: **the repository is the source of truth for agent behavior.** Neither stores behavioral instructions in an external database, a cloud service, or a configuration management system. The file lives in the repo. The repo is the memory.

---

## 3. Convergence Points

| Property | Codex AGENTS.md | Fabric Configuration | Alignment |
|----------|----------------|---------------------|-----------|
| **Format** | Markdown (free-form) | Markdown + JSON (structured) | Partial — Fabric is more structured |
| **Location** | In the repository (committed) | In the repository (committed) | Identical |
| **Versioned** | Yes (git-tracked) | Yes (git-tracked) | Identical |
| **Diffable** | Yes (text diffs) | Yes (text diffs) | Identical |
| **Reviewable** | Yes (PR review) | Yes (PR review) | Identical |
| **Hierarchical** | Global → repo → directory | Global config → module config | Similar |
| **Human-readable** | Yes (markdown) | Yes (markdown + JSON) | Identical |
| **AI-readable** | Yes (designed for LLM consumption) | Yes (designed for LLM consumption) | Identical |
| **Merge strategy** | Top-down (global defaults, local overrides) | Layered (base config + module overrides) | Similar |
| **Scope** | Behavioral instructions only | Behavioral instructions + governance + configuration | Fabric is broader |

The critical convergence: **both systems use the repository as the memory substrate and text files as the memory format.** This is not a coincidence. It reflects the discovery that the most reliable, auditable, and trustworthy place to store agent instructions is the same place you store code — in version-controlled files.

---

## 4. What Codex's AGENTS.md Reveals

### 4.1 The Agent Already Expects Memory in the Repo

Codex was not designed for the Fabric. It was designed as a terminal tool. And yet it independently arrived at the same conclusion: behavioral instructions should be **committed files in the repository.** This means the Fabric's thesis — that the repository is the mind — is not a theoretical position. It is a practical reality that agent builders converge on when they need reliable, project-scoped instructions.

### 4.2 Free-Form Markdown Is Sufficient

Codex's AGENTS.md is free-form markdown. There is no schema, no required sections, no structured format. The LLM reads it as natural language and incorporates it into its behavior. This challenges the Fabric's more structured approach (JSON config, YAML workflows, typed settings):

| Approach | Advantage | Disadvantage |
|----------|-----------|--------------|
| **Free-form markdown** (Codex) | Easy to write; no schema to learn; LLM-native | Not machine-parseable; no validation; ambiguous semantics |
| **Structured config** (Fabric) | Machine-parseable; validatable; unambiguous | Harder to write; requires schema knowledge; less natural for humans |

The Fabric should consider supporting both: structured configuration for governance-critical settings (DEFCON level, invocation limits, model selection) and free-form AGENTS.md for behavioral guidance (personality, coding style, project conventions).

### 4.3 The Hierarchy Maps to Governance Layers

Codex's three-level hierarchy (global → repo → directory) maps to governance layers:

| Codex Level | Governance Analogy | Fabric Equivalent |
|-------------|-------------------|-------------------|
| Global (`~/.codex/AGENTS.md`) | Organization-wide policies | GitHub org-level settings; future Fabric org-config |
| Repo root (`AGENTS.md`) | Project-specific rules | `.github-fabric/AGENTS.md` |
| Working directory (`AGENTS.md`) | Feature/module-specific rules | Module-level config (`./GITMODULE/config/`) |

This hierarchy is a governance pattern: higher levels set boundaries, lower levels specialize within those boundaries. The Fabric already implements this at the module level. Codex's explicit three-level hierarchy suggests the Fabric should formalize the global (organization) level as well.

---

## 5. The Emerging Standard

Codex is not the only agent that reads AGENTS.md. The pattern is emerging across the ecosystem:

- **OpenAI Codex** — `AGENTS.md` at global, repo root, and directory levels
- **GitHub Copilot** — reads repository-level instructions from committed files
- **Claude Code** — reads `CLAUDE.md` for project-specific instructions
- **Cursor** — reads `.cursorrules` for project-specific behavior

The file names differ, but the pattern is identical: **a committed text file in the repository that tells the agent how to behave in this context.** This is repository-native agent memory, and it is becoming a standard.

The Fabric's position should be:

1. **Support AGENTS.md natively** — when Codex runs as a Fabric module, the Fabric should preserve and respect the existing AGENTS.md hierarchy
2. **Extend, don't replace** — the Fabric's committed configuration adds governance-critical settings that AGENTS.md does not cover (DEFCON, sentinel files, invocation limits), but AGENTS.md remains the primary vehicle for behavioral instructions
3. **Ensure compatibility** — a repository should be able to serve both a local Codex session and a Fabric-managed invocation from the same AGENTS.md file without conflicts

---

## 6. Composition: AGENTS.md + Fabric Config

When Codex runs as a Fabric module, both systems contribute to the agent's memory:

```
Agent Instruction Stack (top = highest priority)
─────────────────────────────────────────────────
  Working directory AGENTS.md    ← Local overrides (Codex)
  Repo root AGENTS.md           ← Project conventions (shared)
  .github-fabric/AGENTS.md      ← Fabric agent identity (Fabric)
  Global ~/.codex/AGENTS.md     ← Personal defaults (not available on runner)
  Fabric module config           ← Governance settings (Fabric)
  DEFCON constraints             ← Behavioral boundaries (Fabric)
  The Four Laws                  ← Ultimate constraints (Fabric)
─────────────────────────────────────────────────
```

The key insight: **AGENTS.md and Fabric configuration operate at different layers.** AGENTS.md tells the agent *how to code* (style, conventions, preferences). Fabric config tells the agent *what it may do* (DEFCON, scope, limits). These are complementary, not competing.

The global `~/.codex/AGENTS.md` is unavailable on a Fabric runner (no persistent home directory), but the repo root AGENTS.md and directory-level AGENTS.md are fully available. This means project-specific and feature-specific instructions carry over perfectly from local Codex sessions to Fabric-managed invocations.

---

## 7. Summary

| Insight | Detail |
|---------|--------|
| Both systems store agent instructions in the repo | Codex: AGENTS.md; Fabric: AGENTS.md + config JSON |
| The convergence is not accidental | Repository-native memory is the practical optimum for project-scoped agent behavior |
| AGENTS.md is becoming a standard | Multiple agent tools (Codex, Copilot, Claude Code, Cursor) read behavioral instructions from committed files |
| Free-form and structured config are complementary | AGENTS.md for behavior; JSON/YAML for governance |
| The hierarchy maps to governance layers | Global → repo → directory mirrors org → project → module |
| Composition is layered, not conflicting | AGENTS.md tells the agent how to code; Fabric config tells it what it may do |

The repository is the mind. Both Codex and the Fabric know this. AGENTS.md is the vocabulary they share.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

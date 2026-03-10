# The Extensible Mind

> [Pi-Mono Index](./index.md) · [The Four Laws](../../the-four-laws-of-ai.md) · [Governance Alignment (OpenClaw)](../openclaw/governance-alignment.md)

> Pi's philosophy is radical extensibility: anyone can replace any capability. The Fabric's philosophy is radical governance: every action is committed, reviewed, and auditable. These are not opposites — they are the same ambition applied to different concerns.

---

## 1. Pi's Extension Architecture

Pi-coding-agent is designed around the principle that the core should be minimal and everything else should be pluggable. The customization system has five layers:

| Layer | Mechanism | Scope | Example |
|-------|-----------|-------|---------|
| **Extensions** | TypeScript modules | Full capability — tools, commands, shortcuts, event handlers, UI | Sub-agent orchestration, permission gates, git checkpointing, Doom |
| **Skills** | Markdown files (SKILL.md) | On-demand capability packages following the Agent Skills standard | Code review skill, deployment skill, documentation skill |
| **Prompt Templates** | Markdown files in `prompts/` | Reusable prompt expansions invoked with `/name` | `/review`, `/refactor`, `/explain` |
| **Themes** | JSON/TypeScript files | Visual appearance (hot-reloadable) | Dark, light, custom brand |
| **Pi Packages** | npm or git bundles | Distribution mechanism for all of the above | `pi install npm:@foo/pi-tools` |

Extensions are the most powerful layer. They can:

- Register custom tools (or **replace** built-in tools entirely)
- Add sub-agent orchestration and plan mode
- Implement custom compaction and summarization
- Create permission gates and path protection
- Replace the editor with custom UI
- Add status lines, headers, footers, and overlays
- Implement git checkpointing and auto-commit
- Provide SSH, sandbox, and MCP integration
- Run games in the terminal while waiting

The explicit philosophy: features other tools bake in — sub-agents, plan mode, MCP, permission popups, background bash, to-dos — are omitted from the core and left to extensions.

---

## 2. The Governance Tension

The Fabric's governance model requires that every action be traceable, every tool be known, every prompt be reviewable. This creates a direct tension with pi's extensibility:

| Pi Extension Property | Fabric Governance Requirement | Tension |
|----------------------|------------------------------|---------|
| Extensions can register **any** tool | Fabric must know all available tools | Extensions must be committed and reviewable |
| Extensions can **replace** built-in tools | Fabric assumes a known tool surface | Replacement must be declared and auditable |
| Extensions execute **arbitrary code** | Four Laws constrain all agent behavior | Extension code is subject to the same Laws |
| Skills instruct models to perform **any action** | DEFCON levels constrain capability | Skill scope must respect DEFCON level |
| Pi packages install from **npm or git** | Supply chain must be reviewed | Packages must be pinned and audited |
| Extensions can modify the **editor and UI** | Not applicable in Actions (no UI) | Only runtime-relevant extensions apply |

The resolution is not to restrict pi's extensibility but to **commit it**. If extensions, skills, prompt templates, and themes are committed to the repository, they become part of the mind's genome. They are versioned, reviewable, and diffable. The Fabric does not need to prevent extensibility — it needs to make extensibility **visible**.

---

## 3. Extensions as Committed Code

In the Fabric model, extensions live in the repository:

```
.GITPI/
  extensions/
    permission-gate.ts    ← Extension that requires human approval for writes
    auto-commit.ts        ← Extension that commits after each tool execution
    defcon-enforcer.ts    ← Extension that checks DEFCON level before tool calls
  skills/
    code-review/SKILL.md  ← Skill for structured code review
    deploy/SKILL.md       ← Skill for deployment workflow
  prompts/
    review.md             ← Prompt template for code review
    refactor.md           ← Prompt template for refactoring
  config/
    settings.json         ← Agent configuration
    models.json           ← Custom model definitions
```

When the Fabric invokes pi-coding-agent, these committed extensions are loaded automatically. The extension surface is:

- **Known** — every extension is a committed file with a SHA
- **Reviewable** — any change to an extension requires a commit (and optionally a PR)
- **Rollbackable** — `git revert` removes an extension from the agent's capability set
- **Diffable** — the exact change to the agent's behavior is visible in the diff

This is the composition: pi provides the extensibility mechanism; the Fabric provides the governance mechanism. The agent can do anything the extensions allow, but what the extensions allow is permanently recorded in the commit history.

---

## 4. Skills and the Prompt Supply Chain

Skills are particularly interesting from a governance perspective. A skill is a Markdown file that instructs the model to perform a specific task. It is not code — it is **natural language instruction**. But the effect of a skill is equivalent to code: it changes what the model does.

Example skill:

```markdown
# Code Review Skill
Use this skill when the user asks for a code review.

## Steps
1. Read all changed files
2. Identify bugs, security issues, and performance problems
3. Write review comments with specific line references
4. Summarize findings
```

In pi's native model, skills are loaded from filesystem directories. In the Fabric model, skills are committed files. This means:

- The **prompt supply chain** is auditable. Every instruction given to the model is committed.
- **Prompt injection via skill modification** is detectable. Any change to a skill file appears as a diff.
- **Skill versioning** is automatic. The model's instructions at any point in time are recoverable from git history.

This is something pi's native model does not provide. Skills on the local filesystem are mutable, unversioned, and potentially modified by the model itself (pi-mom actively writes her own skills). The Fabric adds a governance layer that pi does not natively have.

---

## 5. The "No MCP" Principle Through the Fabric Lens

Pi's documentation is explicit: *"No MCP. Build CLI tools with READMEs (see Skills), or build an extension that adds MCP support."* The rationale is that CLI tools with Markdown documentation are simpler, more debuggable, and more composable than the Model Context Protocol.

The Fabric aligns with this principle, but for a different reason. MCP servers are persistent processes that expose capabilities over a protocol. The Fabric's execution model is ephemeral — there is no persistent process to host an MCP server. Skills (Markdown files instructing the model to invoke CLI tools) fit the Fabric's model perfectly:

| Capability Source | Persistent Process Required? | Fabric Compatible? |
|-------------------|-----------------------------|--------------------|
| MCP server | Yes (long-running) | ❌ Not in ephemeral runners |
| Pi extension | No (loaded at startup) | ✅ Loaded from committed code |
| Pi skill | No (Markdown read at invocation) | ✅ Committed Markdown file |
| CLI tool | No (invoked per-call via bash) | ✅ Available on runner |

Pi's "No MCP" principle is pragmatically correct for the Fabric's execution model. The Fabric does not need to take a philosophical position on MCP — it simply cannot host persistent servers, so skills and extensions are the natural capability mechanism.

---

## 6. Pi Packages and Supply Chain Governance

Pi packages are the distribution mechanism for extensions, skills, prompts, and themes. They install from npm or git:

```bash
pi install npm:@foo/pi-tools
pi install git:github.com/user/repo
```

The security warning in pi's documentation is explicit: *"Pi packages run with full system access. Extensions execute arbitrary code, and skills can instruct the model to perform any action including running executables. Review source code before installing third-party packages."*

In the Fabric model, this supply chain risk is mitigated by the commit requirement:

1. **Installation is a commit.** Adding a pi package to the repository requires a commit. The package contents are committed files — visible, reviewable, diffable.
2. **Version pinning is enforced.** The committed `package.json` pins exact versions. No silent updates.
3. **Code review applies.** If the repository uses branch protection, adding or updating a pi package requires a pull request and review.
4. **The Four Laws apply.** Any extension, regardless of source, operates under the Four Laws. An extension that violates the Laws is a defect, not a feature.

This does not eliminate supply chain risk — a malicious extension committed by an authorized user is still dangerous. But it makes the risk **auditable**. The Fabric's contribution to pi's package ecosystem is not prevention but **visibility**.

---

## 7. Summary

| Dimension | Pi (Native) | Fabric (Governed) |
|-----------|-------------|-------------------|
| **Extension discovery** | Filesystem directories | Committed files with SHAs |
| **Extension modification** | Edit and reload | Commit, PR, review, merge |
| **Skill versioning** | None (mutable files) | Full git history |
| **Prompt supply chain** | Untracked | Fully auditable |
| **Package installation** | `pi install` | Committed to repo + version-pinned |
| **Capability surface** | Dynamic (load/unload at runtime) | Static per commit (known at invocation) |
| **"No MCP" compatibility** | Philosophical choice | Architectural necessity |
| **Rollback** | Manual file restore | `git revert` |

Pi's extensibility is not a governance problem — it is a governance **opportunity**. The Fabric does not restrict what the agent can do; it makes what the agent can do permanently visible. The extensible mind becomes the **auditable** mind.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

# Self-Managing Agents

> [Pi-Mono Index](./index.md) · [The Four Laws](../../the-four-laws-of-ai.md) · [Governance Alignment (OpenClaw)](../openclaw/governance-alignment.md)

> Mom installs her own tools, writes her own scripts, configures her own credentials, and manages her own workspace. The Fabric governs every action through committed state. This is the deepest tension in the pi-mono analysis — and its resolution reveals something fundamental about the relationship between autonomy and accountability.

---

## 1. What Mom Does

Pi-mom is a Slack bot that is explicitly designed to be **self-managing**:

- **Installs her own tools** — `apk add git jq curl`, `npm install`, `brew install`
- **Writes her own scripts** — creates CLI tools ("skills") as shell scripts with SKILL.md documentation
- **Configures her own credentials** — asks the user for tokens and stores them
- **Maintains per-channel workspaces** — separate conversation history, memory, and tools per Slack channel
- **Manages working memory** — reads and writes MEMORY.md files to remember preferences across sessions
- **Schedules her own events** — creates JSON files that wake her up at specific times or on cron schedules
- **Builds her own artifact server** — can share HTML/JS visualizations publicly with live reload

The workspace structure:

```
./data/
  ├── MEMORY.md              ← Global memory (shared across channels)
  ├── settings.json          ← Global settings
  ├── skills/                ← Global custom tools mom creates
  ├── events/                ← Scheduled wakeup events
  ├── C123ABC/               ← Per-channel directory
  │   ├── MEMORY.md          ← Channel-specific memory
  │   ├── log.jsonl          ← Full message history
  │   ├── context.jsonl      ← LLM context
  │   ├── attachments/       ← User-shared files
  │   ├── scratch/           ← Working directory
  │   └── skills/            ← Channel-specific tools
  └── D456DEF/               ← DM channel
      └── ...
```

Mom is not passive. She actively shapes her own environment. When you ask her to check your email, she installs the tools, writes the scripts, configures the IMAP credentials, creates a scheduled event to check periodically, and then does it. The user provides the intent; Mom provides the implementation.

---

## 2. The Governance Conflict

The Fabric's governance model has a clear expectation: **every action is committed, reviewed, and auditable.** The Four Laws constrain agent behavior. DEFCON levels limit capabilities. The sentinel file controls whether the agent runs at all.

Mom's self-management conflicts with every one of these:

| Mom Behavior | Fabric Expectation | Conflict |
|-------------|-------------------|----------|
| Installs tools at runtime | Tools are committed and known | Runtime installations are untracked |
| Writes scripts (skills) | Skills are committed Markdown | Self-created skills bypass commit review |
| Stores credentials in workspace | Secrets are GitHub secrets | Self-managed credentials are outside the governance boundary |
| Modifies MEMORY.md | Memory is the commit graph | Self-modified memory is not committed |
| Creates scheduled events | Triggers are Actions `schedule:` | Self-created schedules are untracked |
| Runs in Docker sandbox | Runner is ephemeral | Docker persistence contradicts ephemeral model |

The conflict is not about capability — Mom can do all of these things — but about **visibility**. In Mom's native model, her self-management is productive. She gets things done without requiring the user to configure everything. In the Fabric's model, her self-management is a governance gap. Actions taken outside the commit graph are invisible to reviewers, auditors, and the Four Laws.

---

## 3. The Resolution: Committed Self-Management

The resolution is not to prevent self-management but to **commit it**. Every tool Mom installs, every script she writes, every memory she updates — all committed to the repository:

```
Mom installs a tool:
  → bash: apk add jq
  → Fabric records: .GITMOM/tools-manifest.json updated with "jq" dependency
  → Committed with SHA

Mom writes a skill:
  → write: /workspace/skills/gmail/SKILL.md
  → write: /workspace/skills/gmail/gmail.sh
  → Fabric commits: .GITMOM/skills/gmail/SKILL.md and gmail.sh
  → Committed with SHA, diffable, reviewable

Mom updates memory:
  → write: MEMORY.md with "User prefers tabs, not spaces"
  → Fabric commits: .GITMOM/memory/global.md updated
  → Change is visible in git diff

Mom creates a scheduled event:
  → write: events/check-inbox.json with cron schedule
  → Fabric commits: .GITMOM/events/check-inbox.json
  → Fabric creates matching Actions schedule trigger
```

In this model, Mom's self-management is preserved — she still installs tools, writes scripts, updates memory, creates schedules. But every action is committed. The diff shows what changed. The history shows who (or what) made the change. The Four Laws still apply.

The key insight: **self-management and governance are not opposites.** Self-management is a capability. Governance is a property of how that capability is recorded. Mom can manage herself as long as every management action produces a commit.

---

## 4. The Sandbox Question

Mom natively runs in a Docker sandbox — an isolated container with access only to the mounted data directory. This is a security measure: Mom has bash access and can run arbitrary commands, so isolation limits the blast radius.

The Fabric provides a different kind of sandbox: the Actions runner. Each invocation runs on a fresh virtual machine that is destroyed after the workflow completes. The question is whether these sandboxes compose or conflict.

| Sandbox Property | Docker (Mom native) | Actions Runner (Fabric) |
|-----------------|---------------------|------------------------|
| **Isolation** | Container-level | VM-level |
| **Persistence** | Container survives restarts | Runner is destroyed after use |
| **File access** | Mounted data directory only | Repository checkout + runner filesystem |
| **Network** | Full (or restricted) | Full |
| **Package installation** | Persistent in container | Ephemeral (reinstall each run) |
| **Credential storage** | In data directory | GitHub secrets (environment variables) |

The tension is persistence. Mom's Docker sandbox persists between invocations — installed tools, configured credentials, and written files survive. The Actions runner is ephemeral — everything is rebuilt from committed state each time.

The resolution: **the committed state replaces the persistent container.** Instead of Mom's tools persisting in a Docker container, they persist in committed manifests. Instead of credentials persisting in the data directory, they persist in GitHub secrets. The runner rebuilds the environment from committed state each invocation, making the environment reproducible and auditable.

This costs time (rebuilding the environment) but gains reproducibility (any invocation can be replayed from committed state) and auditability (the environment definition is committed).

---

## 5. Infinite History and the Commit Graph

Mom uses a two-layer memory system:

1. **context.jsonl** — the current LLM context (limited by model's context window)
2. **log.jsonl** — the full message history (unlimited, searchable via grep)

When the context overflows, Mom compacts: summarizes old messages, keeps recent ones. But the full history in log.jsonl remains searchable. Mom can grep for any past conversation, any shared file, any decision.

In the Fabric, both layers are committed:

- **context.jsonl** → committed session state (loaded each invocation, compacted as needed)
- **log.jsonl** → the commit graph itself (every interaction is a commit, searchable via `git log`)

The Fabric provides something Mom's native model does not: the full history is not just searchable but **diffable**. Each interaction produces a commit diff that shows exactly what changed — what the user said, what Mom did, what code she wrote, what tools she installed. The commit graph is not just a log; it is a structured record of every state transition.

---

## 6. Skills as Self-Modifying Code

The deepest governance question is about self-created skills. When Mom writes a skill — say, a Gmail checker — she creates:

1. A SKILL.md file with instructions for future invocations
2. Shell scripts or programs that implement the skill
3. Configuration files with credentials and settings

In subsequent invocations, Mom reads these skills and uses them. She is, in effect, **programming her own future behavior**. The skill she writes today changes what she can do tomorrow.

In the Fabric, this self-modification is committed:

- The skill creation commit shows exactly what capability was added
- The skill's code is reviewable (a human can read the shell script)
- The skill's instructions are reviewable (a human can read the SKILL.md)
- If the skill is harmful, it can be reverted with `git revert`

This creates a governance loop:

```
Mom creates skill → skill is committed → human reviews commit → 
  → approved: skill remains, Mom uses it next invocation
  → rejected: git revert, skill is removed, Mom loses the capability
```

The loop is asynchronous — Mom creates the skill and uses it immediately, and the review happens later. This is acceptable because:

1. The runner is ephemeral — any damage is contained to the current invocation
2. The committed state is revertible — the skill can be removed retroactively
3. The blast radius is limited — the runner only has access to the repository

Self-modification under governance is not a contradiction. It is **accountable evolution** — the agent improves itself, and every improvement is recorded.

---

## 7. Summary

| Dimension | Mom (Native) | Fabric (Governed) | Resolution |
|-----------|-------------|-------------------|------------|
| **Tool installation** | Runtime, persistent | Must be committed | Committed manifests, rebuilt each run |
| **Skill creation** | Local files, mutable | Must be committed | Committed skills, reviewable |
| **Credential storage** | Data directory | GitHub secrets | Secrets populate environment |
| **Memory updates** | Local MEMORY.md | Must be committed | Committed memory files |
| **Event scheduling** | JSON files in events/ | Actions `schedule:` | Committed events, matched to workflows |
| **Sandbox** | Docker container (persistent) | Actions runner (ephemeral) | Ephemeral wins; state rebuilt from commits |
| **History** | log.jsonl (grep) | Commit graph (git log) | Commit graph is searchable and diffable |
| **Self-modification** | Untracked | Committed and reviewable | Accountable evolution |

Mom is the Fabric's most challenging case — not because she is the most complex agent, but because she is the most **autonomous**. She manages herself. The Fabric's answer is not to constrain her autonomy but to make it visible. Every tool installed, every script written, every memory updated — committed, diffed, and reviewable. The self-managing agent becomes the **self-documenting** agent.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

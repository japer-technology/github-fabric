# Sessions as Branching Memory

> [Pi-Mono Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [When?](../../question-when.md)

> Pi stores sessions as branching JSONL trees with in-place navigation and compaction. The Fabric stores memory as the commit graph. These are two implementations of the same idea: memory is structured, durable, and navigable.

---

## 1. Pi's Session Architecture

Pi-coding-agent stores sessions as JSONL files with a tree structure. Each entry has an `id` and `parentId`, enabling branching without creating new files. The key operations:

| Operation | Command | Effect |
|-----------|---------|--------|
| **New session** | `pi` | Creates a new JSONL file in `~/.pi/agent/sessions/` |
| **Continue** | `pi -c` | Resumes the most recent session |
| **Browse** | `pi -r` or `/resume` | Lists and selects from previous sessions |
| **Branch** | `/tree` | Navigate to any previous point and continue from there |
| **Fork** | `/fork` | Create a new session file from a selected branch point |
| **Compact** | `/compact` | Summarize older messages while keeping recent ones |
| **Name** | `/name <name>` | Label the session for human reference |
| **Export** | `/export` or `/share` | Export to HTML or upload as a GitHub gist |

The tree structure is the critical innovation. A session is not a linear sequence of messages — it is a **directed acyclic graph** where any previous point can become a branch point. The JSONL file contains the entire tree; navigation is in-place.

```
Message 1 (user)
├── Message 2 (assistant)
│   ├── Message 3 (user) ← current branch
│   │   └── Message 4 (assistant)
│   └── Message 3' (user) ← alternative branch
│       └── Message 4' (assistant)
└── Message 2' (assistant) ← earlier branch from different assistant response
```

All history is preserved. Branching does not delete anything. The user can navigate the tree, switch branches, and continue from any point.

---

## 2. The Commit Graph as Memory

The Fabric's memory model is the commit graph. Every interaction with the Fabric produces commits:

```
commit abc123: Issue #42 opened, session initialized
commit def456: Agent responds, session updated
commit ghi789: User comments, session appended
commit jkl012: Agent responds, code changes committed
commit mno345: Session compacted (old messages summarized)
```

The commit graph is also a directed acyclic graph — it has branches (git branches), merge points, and a full history. But the commit graph serves a different purpose than pi's session tree:

| Property | Pi Session Tree | Fabric Commit Graph |
|----------|----------------|---------------------|
| **Unit of storage** | One JSONL file per session | One commit per interaction |
| **Branching** | In-place within the file | Git branches (heavier weight) |
| **Navigation** | `/tree` command (real-time) | `git log`, `git diff`, `git checkout` |
| **Compaction** | Summarize old messages | Squash commits (rare, usually avoided) |
| **Scope** | One conversation | The entire repository state |
| **Durability** | Local file (can be lost) | Pushed to remote (durable) |
| **Auditability** | Not auditable (local) | Fully auditable (SHAs, diffs, timestamps) |
| **Rollback** | Navigate to earlier branch point | `git revert` or `git reset` |

---

## 3. The Complementary Insight

Pi's session tree and the Fabric's commit graph are solving the same problem — **how to structure memory so that past states are recoverable and exploration is non-destructive** — at different scales.

Pi's tree is **conversational memory**: the record of a single interaction thread with branches for exploration. It is fast (in-memory navigation), local (one file), and lightweight (JSONL).

The Fabric's graph is **institutional memory**: the record of everything that has ever happened in the repository. It is slow (git operations), distributed (remote), and heavyweight (full repository snapshots per commit).

When pi runs inside the Fabric, both memory systems operate simultaneously:

```
Issue #42 opened
  → Fabric commit: session file created
    → Pi session: message 1 (user prompt from issue body)
    → Pi session: message 2 (assistant response)
  → Fabric commit: session file updated, code changes committed
    → Pi session: message 3 (user follow-up from comment)
    → Pi session: message 4 (assistant response)
  → Fabric commit: session file updated
```

The pi session file tracks the conversational state. The Fabric commit graph tracks the repository state. Both are durable. Both are navigable. But they operate at different granularities.

---

## 4. Compaction: Two Strategies

Long conversations exhaust context windows. Both pi and the Fabric need compaction strategies.

**Pi's compaction:**

- Triggered manually (`/compact`) or automatically (on context overflow or approaching limit)
- Summarizes older messages while keeping recent ones in full
- The summary replaces the old messages in the session context
- The full history remains in the JSONL file — `/tree` can still access pre-compaction messages
- Compaction behavior is customizable via extensions

**Fabric's compaction (proposed):**

- The session JSONL file grows with each interaction
- When the file exceeds a threshold, the Fabric invokes compaction before the next reasoning step
- The compacted session file is committed as a new version
- The full history is preserved in git — `git log -p` shows every state

The key difference: **pi compacts within the session file; the Fabric compacts across commits.** In pi, compaction modifies the active context but preserves the full tree in the file. In the Fabric, compaction creates a new committed version of the session file, but the previous version is preserved in git history.

This means the Fabric provides a compaction guarantee that pi does not: even the compaction decision is auditable. The diff between the pre-compaction and post-compaction session file shows exactly what was summarized and how.

---

## 5. Session Identity Across Invocations

In pi-coding-agent, a session lives as long as the user keeps the terminal open (or resumes with `pi -c`). The session has identity through process continuity and filesystem persistence.

In the Fabric, there is no process continuity. Each invocation is a fresh Actions runner. Session identity must come from committed state:

```
.GITPI/state/issues/42.json          → { "sessionId": "abc123" }
.GITPI/state/sessions/abc123.jsonl   → Full session tree
```

When issue #42 receives a new comment:

1. The workflow reads `issues/42.json` to find the session ID
2. The session file `sessions/abc123.jsonl` is loaded
3. Pi-agent-core reconstructs the conversation context
4. The new comment becomes the latest user message
5. The agent reasons and responds
6. The updated session file is committed

Session identity is maintained through **committed mapping files**, not process state. This is the same pattern used in the OpenClaw analysis but with a different session format — pi's JSONL tree instead of OpenClaw's session objects.

---

## 6. Branching as Governance

Pi's session branching has an unexpected governance application in the Fabric. Consider a scenario where a human disagrees with the agent's response:

**In pi (native):**
1. User navigates to the problematic point with `/tree`
2. User branches from the message before the bad response
3. User provides a corrected prompt
4. Agent re-reasons from the corrected branch point

**In the Fabric (governed):**
1. Human comments on the issue: "That approach is wrong. Try this instead."
2. The Fabric creates a new branch in the session tree from the last user message
3. The human's correction becomes the new branch
4. The agent re-reasons from the corrected branch

The session tree's branching structure makes **correction auditable**. The original (bad) branch is preserved in the JSONL file. The corrected branch is committed alongside it. The commit diff shows exactly what was corrected and why. A reviewer can trace the agent's reasoning path, see where it went wrong, and verify that the correction was appropriate.

This is governance through memory structure, not governance through access control. The tree does not prevent bad responses — it makes the correction history visible.

---

## 7. Summary

| Dimension | Pi Session Tree | Fabric Commit Graph | Composed |
|-----------|----------------|---------------------|----------|
| **Memory model** | Branching JSONL | Git DAG | Both active simultaneously |
| **Granularity** | Per-message | Per-interaction | Messages inside commits |
| **Branching** | In-place (lightweight) | Git branches (heavyweight) | Session branches inside committed files |
| **Compaction** | In-context summarization | New committed version | Compaction is auditable |
| **Durability** | Local file | Distributed repository | Committed JSONL is both |
| **Navigation** | `/tree` (real-time) | `git log` (historical) | Different time scales |
| **Identity** | Process/filesystem | Committed mapping file | Mapping file provides continuity |
| **Correction** | Branch and re-reason | New branch in session tree (committed) | Correction is auditable |

Pi's session tree is conversational memory. The Fabric's commit graph is institutional memory. Together, they provide a two-level memory architecture: fast, branching, local-to-the-conversation memory (pi) backed by permanent, auditable, repository-wide memory (Fabric). The mind remembers at two scales.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

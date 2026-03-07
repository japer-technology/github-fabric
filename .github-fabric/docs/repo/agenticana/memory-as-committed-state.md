# Memory as Committed State

> [Agenticana Index](./index.md) · [What Agenticana Teaches Fabric](./what-agenticana-teaches-fabric.md) · [The Repo Is the Mind](../../docs/the-repo-is-the-mind.md)

> When the ReasoningBank becomes part of the commit graph, every agent decision gains the properties of source code: versioned, diffable, blameable, and revertible.

---

## 1. What the ReasoningBank Is

Agenticana's ReasoningBank is not a log file. It is a **structured decision memory** — every successful agent decision is recorded with full context, outcome data, and a semantic embedding for similarity retrieval:

```json
{
  "id": "rb-001",
  "task": "Build JWT auth system",
  "agent": "backend-specialist",
  "decision": "bcrypt cost=12 + httpOnly cookies + 15min access token",
  "outcome": "Deployed, 0 security issues found",
  "success": true,
  "tokens_used": 4200,
  "embedding": [0.12, 0.34, 0.56, ...],
  "tags": ["auth", "jwt", "backend"]
}
```

In Agenticana's local execution model, this lives in `memory/reasoning-bank/decisions.json` — a file on the developer's machine that grows with use. The embedding vectors enable cosine similarity search: when a new task arrives, the agent queries the ReasoningBank for similar past decisions and uses them to inform its approach.

This is more sophisticated than the Fabric's current memory model. GMI uses an append-only `memory.log` with grep-based retrieval. OpenClaw uses hybrid SQLite BM25 + vector embeddings, but its memory is reconstructed at runtime from committed state. Agenticana's ReasoningBank sits between these: structured JSON with semantic search, designed to accumulate institutional knowledge across sessions.

---

## 2. The Fabric's Memory Model

The Fabric's foundational thesis on memory is stated in [The Repo Is the Mind](../../docs/the-repo-is-the-mind.md):

> Each agent invocation is a fresh process — no warm session, no in-memory conversation cache. State is reconstructed from durable artifacts: the issue thread, the commit log, the repo contents at HEAD.

And in [question-when.md](../../docs/question-when.md):

> Continuity is a property of the repository, not of the agent process. As long as Git history and the issue thread exist, the agent can resume with full fidelity.

This is the Fabric's memory contract: **everything the agent knows must be recoverable from the commit graph.** There is no server-side state. There is no warm cache. Memory is what you committed.

---

## 3. ReasoningBank as Committed State

When the ReasoningBank is committed to git after every agent interaction, it acquires properties that the local version lacks:

### 3.1 Auditability

Every decision is part of the commit history. `git log memory/reasoning-bank/decisions.json` shows when each decision was added, by which workflow run, in response to which issue. The provenance chain extends from the user's question through the agent's reasoning to the committed decision record.

### 3.2 Diffability

When a decision record changes — because the agent revisited a past decision with new information — the diff shows exactly what changed. A decision that was `success: true` becoming `success: false` after a post-mortem is a one-line diff with full context.

### 3.3 Revertibility

If a bad decision enters the ReasoningBank (an agent recorded an incorrect pattern that would mislead future queries), `git revert` removes it cleanly. In the local model, bad decisions accumulate silently unless someone manually edits the JSON.

### 3.4 Collaborative Visibility

In the local model, the ReasoningBank is on one developer's machine. In the Fabric, every collaborator can read it, review it, and contribute to it through PRs. A team lead can review the agent's accumulated decisions the same way they review code — because it IS code, in the Git sense.

### 3.5 Branch-testability

Want to test how the agent behaves with a different set of accumulated decisions? Branch the ReasoningBank. The agent's memory becomes a configurable parameter of the execution, not a fixed accumulation on disk.

---

## 4. The DNA Metaphor Extended

The Fabric's README describes upstream code as "genetic material" — something you import, normalize, and express under controlled conditions. When applied to memory:

- **The ReasoningBank is the agent's epigenetic state** — not the code itself, but the accumulated modifications to behavior based on experience.
- **Committing decisions to git is inheritance** — future invocations inherit the wisdom (or errors) of past invocations.
- **Branching memory is speciation** — different branches can accumulate different decision histories, creating variant strains of the same agent.
- **Reverting decisions is gene therapy** — removing harmful mutations from the hereditary line.

This metaphor reveals something important: **the Fabric doesn't just version code. It versions intelligence.** The ReasoningBank committed to git is not a log. It is the agent's accumulated wisdom, subject to the same governance as the codebase it operates on.

---

## 5. The Embedding Challenge

The one complication is the embedding vectors. Each ReasoningBank entry includes a high-dimensional vector for cosine similarity search. These vectors are:

- **Binary-opaque** — a human reading the JSON cannot interpret `[0.12, 0.34, ...]`
- **Model-dependent** — vectors generated by one embedding model are incompatible with another
- **Space-consuming** — a 1536-dimension float32 vector is ~6 KB per entry

For a ReasoningBank with hundreds of entries, the total embedding data might be 1–5 MB — well within Git's comfort zone. For thousands of entries, it approaches the range where Git diffs become less meaningful (every new entry adds a large opaque blob).

### Mitigation Strategies

**Strategy 1: Split structured data from embeddings.**

```
memory/reasoning-bank/
├── decisions.json          # Human-readable: task, decision, outcome, tags
└── embeddings.bin          # Binary: entry_id → vector (gitignored, regenerated)
```

The structured data is committed and diffable. The embeddings are regenerated from the structured data at runtime. This sacrifices the ability to search by similarity during cold start, but preserves the auditability of the decision records.

**Strategy 2: Commit everything, accept opaque diffs.**

If the embedding model is stable, commit the full JSON including vectors. Accept that diffs for the embedding field are meaningless noise, but benefit from the complete state being recoverable from any commit. Use structured fields (task, tags, agent) for human review; use embeddings for agent retrieval.

**Strategy 3: Hybrid with index regeneration.**

Commit the structured data with embeddings. Maintain a separate similarity index (e.g., HNSW or flat cosine) that is regenerated at runtime from the committed data. This gives both cold-start retrieval and auditable state.

**Recommendation:** Strategy 1 for most cases. The ReasoningBank's value to human reviewers is in the structured decisions, not the vectors. Embeddings are a runtime optimization, not archival data.

---

## 6. Shared Memory Across Twenty Agents

In Agenticana's local model, all twenty agents share one ReasoningBank. The Security Auditor's decisions about authentication patterns are available to the Backend Specialist's next task. The Orchestrator's delegation plans are visible to the Debugger.

In the Fabric, this shared memory is a committed artifact. When multiple agents write to it in the same invocation (swarm execution), the merge strategy matters:

### Sequential Execution (No Conflict)

If agents run one at a time, each commits its decisions after completing. The ReasoningBank grows linearly. No merge conflict.

### Parallel Execution (Potential Conflict)

If three agents run simultaneously in a swarm, they each read the ReasoningBank at the same HEAD and each attempt to append new decisions. The Fabric's existing push-retry-with-rebase pattern handles this:

1. Agent A finishes first, commits its decisions, pushes.
2. Agent B finishes second, attempts to push, gets a conflict.
3. Agent B rebases, resolves (JSON append is deterministically mergeable), pushes.
4. Agent C follows the same pattern.

For JSON arrays, this is safe — each agent appends entries with unique IDs. The rebase produces a correct combined array. For more complex data structures, the merge strategy would need to be explicitly defined in the dispatch manifest.

---

## 7. The "Repo Is the Mind" — Revisited

The Fabric's thesis that "the repo is the mind" gains new depth with Agenticana's ReasoningBank:

- In GMI, the mind is simple: `memory.log` plus session transcripts. The agent remembers what happened.
- In OpenClaw, the mind is richer: hybrid vector + BM25 memory with temporal decay. The agent remembers contextually.
- In Agenticana, the mind is **institutional**: twenty specialists contributing decisions with semantic structure, success metrics, and cross-agent visibility. The agent does not just remember — it builds a body of professional judgment.

When this institutional memory is committed to git, the repository becomes more than a mind. It becomes a **professional practice** — an accumulation of expertise, precedent, and learned patterns that persists across sessions, agents, and collaborators.

This is the deepest implication of committing the ReasoningBank: the Fabric does not just version code or configuration. It versions **judgment**. And judgment, unlike code, improves with every decision committed.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

# Governance Alignment

> [Agenticana Index](./index.md) · [The Four Laws of AI](../../docs/the-four-laws-of-ai.md) · [DEFCON Levels](../../docs/transition-to-defcon-5.md)

> Agenticana and the Fabric govern AI behavior through different mechanisms. When composed, the result is stronger than either system alone.

---

## 1. Two Governance Traditions

### The Fabric's Model

The Fabric governs agent behavior through three interlocking mechanisms:

1. **The Four Laws of AI** — Zeroth (Protect Humanity), First (Do No Harm), Second (Obey the Human), Third (Preserve Integrity). These are operationalized through repository mechanisms: scoped permissions, fail-closed guards, collaborator-gated invocation, committed audit trails.

2. **DEFCON Readiness Levels** — Five operational states from DEFCON 5 (Normal) to DEFCON 1 (Maximum Readiness / all operations suspended). Each level constrains agent behavior progressively: at DEFCON 3, the agent explains planned changes and awaits approval; at DEFCON 1, all operations halt.

3. **GitHub's Native Controls** — Collaborator permissions, branch protection, CODEOWNERS, pull request reviews, and scoped GITHUB_TOKEN permissions.

### Agenticana's Model

Agenticana governs its twenty agents through three complementary mechanisms:

1. **Guardian Mode** — A pre-commit validation gate that runs Sentinel audit (structural verification), Python linting, and secret scanning before any code reaches the repository. Locally, it operates as a `pre-commit` hook.

2. **Proof-of-Work Attestation** — A cryptographic attestation system that signs each commit with evidence that: the Logic Simulacrum debate occurred, performance benchmarks met thresholds, and Guardian Mode passed. Each attestation includes a Trust Score (0–100).

3. **Model Router Constraints** — The Model Router enforces cost-aware model selection, ensuring that agents use the cheapest adequate model for each task. This is operational governance — constraining resource consumption rather than behavior.

---

## 2. The Composition

These two governance traditions are not in conflict. They operate at different layers and reinforce each other:

| Governance Concern | Fabric Mechanism | Agenticana Mechanism | Composed Behavior |
|---|---|---|---|
| **Who can invoke?** | Collaborator permissions check | *(none)* | GitHub permissions gate all invocations |
| **What can the agent do?** | DEFCON levels, Four Laws | Guardian Mode pre-commit check | DEFCON constrains broad behavior; Guardian validates specific changes |
| **Is the output safe?** | Scoped commits, fail-closed guard | Sentinel audit + secret scan | Double-gated: Fabric guard + Agenticana guardian |
| **Is the process auditable?** | Commit history, issue thread | Proof-of-Work attestation + Trust Score | Every commit carries both git provenance AND cryptographic attestation |
| **Is the cost controlled?** | Actions minutes budget | Model Router tier selection | Router picks cheapest adequate model within Actions budget |
| **Can the agent be stopped?** | DEFCON 1 (all operations suspended) | *(none — local kill)* | DEFCON 1 halts all Agenticana agents across all specialists |

---

## 3. The Four Laws Applied to Twenty Agents

### Zeroth Law: Protect Humanity

> Do not concentrate power. Keep the system interoperable, auditable, and under human control.

Agenticana's twenty agents, sharing a ReasoningBank and coordinating through the Swarm Dispatcher, represent a concentration of capability that must remain under human governance. The Fabric enforces this through:

- **Collaborator-gated invocation** — only authorized humans can trigger the agents.
- **Issue-driven conversation** — every agent action is visible in a public issue thread.
- **MIT license** — the system remains open and forkable.

### First Law: Do No Harm

> Never generate dangerous code, leak secrets, or produce outputs that could cause material harm.

Agenticana's Guardian Mode directly operationalizes this law:

- **Sentinel audit** verifies structural integrity before commit.
- **Secret scanning** prevents credential leakage.
- **Pre-commit validation** catches harmful patterns before they reach the default branch.

In the Fabric, Guardian Mode becomes a **branch protection check** — a GitHub Actions workflow triggered by pull requests that cannot be bypassed (unlike local `pre-commit` hooks that developers can skip with `--no-verify`). This is a strictly stronger guarantee than the local model.

### Second Law: Obey the Human

> Serve human intent, be transparent about reasoning and limitations.

The twenty-agent model actually strengthens this law. When the Orchestrator delegates to a specialist, the delegation is visible in the issue thread. When the Logic Simulacrum debates a question, the full reasoning — proposals, critiques, votes — is posted as comments. The human does not receive a black-box answer; they receive a structured deliberation they can follow, question, and override.

### Third Law: Preserve Integrity

> Maintain audit trails, resist corruption, protect the system's ability to function correctly.

Agenticana's Proof-of-Work attestation is the most concrete implementation of this law in any Fabric module:

- Every commit carries a cryptographic attestation proving that validation occurred.
- The Trust Score (0–100) quantifies the confidence in the commit's integrity.
- The attestation chain is committed to git, creating an immutable record of verification.

In the local model, attestations are stored in a gitignored directory. In the Fabric, they are committed — making the integrity record part of the auditable history.

---

## 4. DEFCON Levels for a Multi-Agent System

The Fabric's DEFCON levels were designed for a single agent. With twenty agents, the levels gain additional nuance:

### DEFCON 5 — Normal

All twenty agents operate at full capability. The dispatch manifest routes issues to specialists. Swarm execution and Simulacrum debates are available. Guardian Mode runs as a pre-merge check.

### DEFCON 4 — Above Normal

All agents operate but with elevated discipline. The dispatch manifest restricts swarm execution to two agents maximum. Simulacrum debates require explicit `architecture` label (no auto-routing). Each agent confirms intent before every write operation.

### DEFCON 3 — Increased Readiness

All agents operate in read-only mode. They can analyze issues, explain planned changes, and recommend approaches — but they cannot commit code, modify files, or push changes. Simulacrum debates can still occur (they produce comments, not code), but Guardian Mode pre-commit checks are paused because no commits occur.

### DEFCON 2 — High Readiness

Only the Orchestrator and Security Auditor remain active. All other specialists are suspended. The Orchestrator can advise and triage. The Security Auditor can perform read-only security reviews. No code generation, no file modification.

### DEFCON 1 — Maximum Readiness

All twenty agents are suspended. No workflow triggers. No comments posted. The system is fully halted. Recovery requires a human collaborator to manually restore DEFCON level.

---

## 5. Guardian Mode as Branch Protection

In the local VS Code model, Guardian Mode runs as a `pre-commit` hook:

```
Developer writes code → git commit → Guardian Mode intercepts → Sentinel audit + lint + secret scan → Allow or block
```

In the Fabric, this transforms into a pull request check:

```
Agent creates branch → Pushes changes → PR opened → Guardian Mode workflow triggers → Sentinel + lint + secret scan → Check passes/fails → Branch protection enforces
```

The Fabric version is stronger because:

1. **It cannot be bypassed.** Branch protection rules enforced by GitHub prevent merging without passing checks. There is no `--no-verify` equivalent.
2. **It runs in isolation.** The Guardian workflow runs on a fresh runner, not the developer's machine. The validation environment is clean and reproducible.
3. **The result is visible.** Pass/fail status appears on the PR. Any warnings or findings are posted as review comments.
4. **It applies to all contributors.** In the local model, only developers who install the pre-commit hook are protected. In the Fabric, every change to the protected branch passes through Guardian Mode.

---

## 6. Proof-of-Work as Committed Provenance

Agenticana's Proof-of-Work attestation creates a signed record for each commit:

```json
{
  "commit_sha": "abc123...",
  "simulacrum_occurred": true,
  "guardian_passed": true,
  "benchmark_passed": true,
  "trust_score": 87,
  "timestamp": "2026-03-07T05:00:00Z",
  "agents_involved": ["orchestrator", "backend-specialist", "security-auditor"],
  "signature": "..."
}
```

In the local model, these attestations are stored in `.Agentica/attestations/` (gitignored). In the Fabric, they are committed to `state/attestations/`, creating a verifiable chain of evidence in the git history.

This is a pattern not seen in any other Fabric module: **provenance as a first-class git artifact.** Every commit in the repository carries not just the code change and the author, but a machine-verifiable attestation of the process that produced it.

Combined with the Fabric's existing provenance (upstream SHA + splice rules + workflow run ID), the result is the most complete provenance chain in any Fabric module:

| Provenance Layer | Source | What It Proves |
|---|---|---|
| **Git commit** | GitHub | Who committed, when, what changed |
| **Workflow run** | GitHub Actions | Which workflow, which runner, which inputs |
| **Upstream SHA** | Fabric Source Plane | Which version of the upstream code was used |
| **Splice rules** | Fabric Transformation Plane | Which modifications were applied |
| **PoW attestation** | Agenticana | Which agents were involved, what validation passed, how confident the result is |

---

## 7. Summary

Agenticana's governance model and the Fabric's governance model are complementary, not competing. The Fabric provides the outer container — who can invoke, what readiness level constrains behavior, how the system can be halted. Agenticana provides the inner quality gates — what validation runs before code is accepted, how confident the system is in each commit, and how multiple agents have deliberated before reaching a decision.

The composed model gives every commit in the repository three layers of assurance:

1. **Authorization** — a verified collaborator triggered the work.
2. **Validation** — Guardian Mode confirmed the output is safe.
3. **Attestation** — Proof-of-Work records what process produced the result.

This is governance that compounds. Each layer adds confidence. And because all of it is committed to git, the governance is not a policy document — it is an auditable, diffable, revertible property of the repository itself.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

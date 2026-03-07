# Swarm and Simulacrum

> [Agenticana Index](./index.md) · [Twenty Agents, One Fabric](./twenty-agents-one-fabric.md) · [Cost and Constraints](./cost-and-constraints.md)

> When multiple agents reason in parallel, the Fabric must orchestrate not one mind but a conversation among minds — with concurrency, convergence, and committed outcomes.

---

## 1. Two Multi-Agent Patterns

Agenticana defines two distinct multi-agent execution patterns. Both are novel in the context of Githubification — no previous case study has involved more than one agent per invocation.

### Swarm Dispatch

Multiple specialist agents work in **parallel** on different aspects of the same task. Each agent operates independently, producing its own output. The results are collected and presented together.

Example: A `review` task dispatches the Security Auditor and Test Engineer simultaneously. The Security Auditor examines vulnerabilities. The Test Engineer evaluates coverage. Both results are posted to the issue.

### Logic Simulacrum

Multiple specialist agents engage in a **structured debate** — presenting proposals, critiquing each other's approaches, voting, and reaching consensus. The output is a decision, not a collection of independent analyses.

Example: An `architecture` task triggers the Logic Simulacrum. The Orchestrator frames the question. The Backend Specialist, Frontend Specialist, and Security Auditor each present proposals. They debate across multiple rounds. The consensus is documented as an Architecture Decision Record (ADR).

---

## 2. Swarm on GitHub Actions

### The Matrix Strategy

GitHub Actions' matrix strategy is the natural substrate for swarm execution:

```yaml
jobs:
  swarm:
    strategy:
      matrix:
        agent: [security-auditor, test-engineer]
      fail-fast: false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run specialist
        run: |
          # Load agent config from agents/${{ matrix.agent }}.yaml
          # Load skills per agent tier
          # Execute agent with issue context
          # Post result as issue comment
```

Each agent runs as a separate job on a separate runner. They execute in parallel without interfering with each other's reasoning. `fail-fast: false` ensures that one agent's failure does not cancel the others.

### Concurrency and State Commits

The concurrency challenge arises when agents finish and attempt to commit their results. In a two-agent swarm:

1. Both agents read the repository at the same HEAD.
2. Agent A finishes first: commits its session transcript and ReasoningBank update, pushes.
3. Agent B finishes second: its push fails because HEAD has moved.
4. Agent B rebases onto the new HEAD, resolves any conflicts, pushes.

The Fabric's existing push-retry-with-rebase loop (proven in GMI's concurrency tests) handles this. The only difference is frequency: in a single-agent system, conflicts arise when two separate issue events overlap. In a swarm, conflicts are guaranteed — every agent in the swarm will attempt to push in the same time window.

The mitigation is straightforward: increase retry count and add exponential backoff. For a three-agent swarm, three retries with 5-second backoff is sufficient. For larger swarms, the retry parameters should scale with agent count.

### Result Aggregation

Each agent in the swarm posts its own comment to the issue. The issue thread becomes the natural aggregation point — the user reads all responses in order. No explicit aggregation step is needed for the simple swarm pattern.

For advanced use cases where a synthesized summary is desired, a post-swarm aggregation job can read the individual comments and produce a combined report:

```yaml
jobs:
  swarm:
    # ... matrix execution as above ...

  synthesize:
    needs: swarm
    runs-on: ubuntu-latest
    steps:
      - name: Aggregate results
        run: |
          # Read all agent comments from the issue
          # Generate synthesis comment
```

---

## 3. Simulacrum on GitHub Actions

The Logic Simulacrum is architecturally more interesting than the swarm. It is not parallel independent work — it is a **sequential, adversarial conversation** among agents.

### The Debate Protocol

The local Simulacrum (`real_simulacrum.py`) executes as:

1. **Frame** — The Orchestrator presents the question and constraints.
2. **Propose** — Each specialist generates an initial proposal via separate LLM calls.
3. **Critique** — Each specialist reviews the other proposals and raises objections.
4. **Revise** — Specialists revise their proposals based on critiques.
5. **Vote** — Each specialist votes on the best approach with reasoning.
6. **Decide** — The Orchestrator synthesizes the votes into a final decision.
7. **Record** — The decision is documented as an ADR.

### Mapping to GitHub

On GitHub, the Simulacrum maps to an issue-driven debate:

| Debate Phase | GitHub Manifestation |
|-------------|---------------------|
| Frame | Issue body (the user's question) |
| Propose | One comment per specialist with their proposal |
| Critique | One comment per specialist with their review of others |
| Revise | One comment per specialist with their revised proposal |
| Vote | One comment per specialist with their vote and reasoning |
| Decide | Summary comment from the Orchestrator |
| Record | ADR committed to `docs/decisions/` |

This is the most visible and auditable form a multi-agent debate has ever taken. In the local model, the debate is saved to a gitignored log directory. On GitHub, the debate is a public issue thread — readable by every collaborator, searchable, linkable, and part of the permanent project record.

### Implementation: Sequential Jobs with Shared State

Unlike the swarm (which is parallel), the Simulacrum is inherently sequential — each phase depends on the output of the previous phase. The workflow structure:

```yaml
jobs:
  propose:
    strategy:
      matrix:
        agent: [backend-specialist, security-auditor, frontend-specialist]
    steps:
      - name: Generate proposal
        run: |
          # Each agent reads the issue and generates a proposal
          # Posts as a comment with label "proposal"

  critique:
    needs: propose
    strategy:
      matrix:
        agent: [backend-specialist, security-auditor, frontend-specialist]
    steps:
      - name: Critique proposals
        run: |
          # Each agent reads all proposal comments and posts critique

  vote:
    needs: critique
    strategy:
      matrix:
        agent: [backend-specialist, security-auditor, frontend-specialist]
    steps:
      - name: Vote with reasoning
        run: |
          # Each agent reads all critiques and votes

  decide:
    needs: vote
    steps:
      - name: Orchestrator synthesis
        run: |
          # Orchestrator reads all votes, produces final decision
          # Commits ADR to docs/decisions/
```

Each phase is a separate job (or set of jobs). The matrix fans out per agent within each phase. The `needs` graph enforces sequential phases: proposals before critiques, critiques before votes, votes before the decision.

### The Cost of Debate

A full Simulacrum with three specialists, three debate rounds, and an Orchestrator synthesis requires:

- **Propose:** 3 LLM calls (one per specialist)
- **Critique:** 3 LLM calls (each reads 3 proposals)
- **Vote:** 3 LLM calls (each reads 3 critiques)
- **Decide:** 1 LLM call (reads all votes)
- **Total:** 10 LLM calls, each consuming tokens proportional to the accumulated context

Plus GitHub Actions minutes for each job. A three-specialist Simulacrum with 4 phases of 3 parallel jobs plus 1 synthesis job = 13 jobs. At ~1–2 minutes per job (setup + LLM reasoning), the total is ~15–25 minutes of Actions time.

This is expensive. But the output — a structured, adversarial, multi-perspective architectural decision with full audit trail — is qualitatively different from any single-agent analysis. See [Cost and Constraints](./cost-and-constraints.md) for budget implications.

---

## 4. What the Fabric Gains

### From Swarm

- **Breadth of analysis.** A security audit and a test coverage review happen simultaneously, each from a specialist's perspective. The result is richer than any single agent could produce.
- **Time efficiency.** Parallel execution means the total wall-clock time is the duration of the slowest agent, not the sum of all agents.
- **Natural aggregation.** The issue thread collects all results without requiring a separate aggregation service.

### From Simulacrum

- **Adversarial robustness.** Proposals survive critique from specialists with different priorities. A Backend Specialist's proposal is stress-tested by the Security Auditor before adoption.
- **Committed decisions.** The ADR is a git artifact — reviewable, revertible, and part of the project's decision history. `git log docs/decisions/` becomes the architectural memory of the project.
- **Transparent reasoning.** The entire debate is visible in the issue thread. Anyone can read the proposals, critiques, votes, and final decision. There is no "the AI decided X" without explanation — there is "three specialists debated, here is the reasoning, here is the consensus."

### From Both

- **The repo gains institutional deliberation.** A repository that can host structured, multi-agent debates about its own architecture is something new. It is not just a mind — it is a mind that can argue with itself, reach consensus, and record why.

---

## 5. Limits

### Simulacrum Depth vs. Cost

More debate rounds produce better decisions but cost more. The dispatch manifest should define a configurable `max_rounds` parameter. Most architectural questions are adequately explored in 2–3 rounds. Open-ended philosophical questions might warrant more, but the cost scales linearly.

### Swarm Size vs. Conflict

As the number of parallel agents increases, the probability and frequency of push conflicts increases quadratically. For practical purposes, swarms of 2–4 agents are efficient. Swarms of 5+ agents should use a post-execution merge job rather than per-agent push-retry.

### Model Context Window

In later debate rounds, each specialist's context includes all previous proposals and critiques. A three-specialist, three-round Simulacrum might accumulate 50–100K tokens of context. This is within the range of modern models (GPT-4o at 128K, Claude at 200K) but approaches the degradation zone described in the [GitHub Data Size Limits](../../docs/analysis/github-data-size-limits.md) analysis. Summarization between rounds can mitigate this.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

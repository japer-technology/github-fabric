# Twenty Agents, One Fabric

> [Agenticana Index](./index.md) · [What Agenticana Teaches Fabric](./what-agenticana-teaches-fabric.md) · [Transformation Map](./transformation-map.md)

> The routing problem is the central architectural challenge. Everything else — memory, governance, cost — depends on solving dispatch first.

---

## 1. The Single-Agent Assumption

In every prior Fabric module, the dispatch model is trivial:

```
GitHub Event → Workflow → Agent → Result
```

An issue opens. The workflow fires. The agent thinks. A comment appears. There is no routing decision because there is nothing to route — there is only one agent.

Agenticana introduces a routing decision at the center of every invocation:

```
GitHub Event → Workflow → Router → Agent(s) → Result
```

The router must answer: *which of the twenty specialists should handle this?* And in some cases: *should multiple specialists handle it together?*

---

## 2. The Routing Surface

Agenticana's local routing works implicitly. In VS Code Copilot Chat, the user types `@security-auditor` or `@backend-specialist` and the MCP bridge dispatches accordingly. On GitHub, that implicit addressing must become explicit. The Fabric's routing surface uses the primitives it already owns:

### Issue Labels as Dispatch Keys

| Label | Agent(s) Invoked | Execution Mode |
|-------|-----------------|----------------|
| `agenticana` | Model Router auto-selects | Single agent |
| `security` | Security Auditor | Single agent |
| `frontend` | Frontend Specialist | Single agent |
| `backend` | Backend Specialist | Single agent |
| `architecture` | Orchestrator → Logic Simulacrum | Multi-agent debate |
| `debug` | Debugger | Single agent |
| `performance` | Performance Optimizer | Single agent |
| `review` | Security Auditor + Test Engineer | Swarm (parallel) |
| `full-stack` | Frontend + Backend + Security | Swarm (parallel) |

Labels are the natural dispatch key because they are:
- **Already part of GitHub's data model** — no custom metadata needed.
- **Visible to collaborators** — the routing decision is transparent.
- **Changeable after creation** — adding or removing a label mid-conversation can redirect the conversation to a different specialist.
- **Combinable** — multiple labels can trigger multiple agents or a swarm.

### Comment Keywords as Fallback

When no label is present, the workflow can parse the issue body or comment for routing hints:

- `@security-auditor` in the comment text → route to Security Auditor
- A question about "performance" or "latency" → route to Performance Optimizer
- No clear signal → route through Model Router for auto-selection

This is a heuristic layer, not a replacement for labels. Labels are authoritative; keyword routing is a convenience.

### Event Type as Context

The GitHub event itself carries routing context:

| Event | Routing Implication |
|-------|-------------------|
| `issues.opened` | Route based on labels on the new issue |
| `issue_comment.created` | Continue with the agent already assigned to this issue |
| `pull_request.opened` | Guardian Mode (validation agent) |
| `pull_request.synchronize` | Guardian Mode re-check |

---

## 3. The Workflow Architecture

The dispatch model requires a workflow that can branch based on the routing decision. Two architectures are viable:

### Option A: Single Workflow with Conditional Steps

```yaml
jobs:
  route:
    runs-on: ubuntu-latest
    outputs:
      agents: ${{ steps.dispatch.outputs.agents }}
      mode: ${{ steps.dispatch.outputs.mode }}
    steps:
      - name: Determine agents
        id: dispatch
        run: |
          # Read issue labels, parse routing table
          # Output: agents=["security-auditor"] mode="single"
          # Or:    agents=["frontend","backend","security"] mode="swarm"

  execute:
    needs: route
    strategy:
      matrix:
        agent: ${{ fromJson(needs.route.outputs.agents) }}
    runs-on: ubuntu-latest
    steps:
      - name: Run agent
        run: |
          # Execute the specific agent from the matrix
```

**Pros:** One workflow file. Matrix strategy handles both single and parallel execution.
**Cons:** Every invocation pays the routing job cost. Matrix fan-out adds per-job overhead.

### Option B: Router Workflow Dispatches Specialist Workflows

```yaml
# router.yml
jobs:
  dispatch:
    steps:
      - name: Route and dispatch
        run: |
          # Determine agent(s), then trigger specialist workflow(s)
          gh workflow run agent-security.yml -f issue=$ISSUE
          gh workflow run agent-backend.yml -f issue=$ISSUE

# agent-security.yml
on:
  workflow_dispatch:
    inputs:
      issue: { required: true }
jobs:
  run:
    steps:
      - name: Execute security auditor
```

**Pros:** Clean separation. Each specialist workflow is independently deployable and configurable.
**Cons:** More workflow files. Cross-workflow coordination is harder.

### Recommended: Option A

For the Fabric, Option A is preferred. The matrix strategy is a proven GitHub Actions pattern, it keeps routing logic centralized, and it avoids the complexity of cross-workflow coordination. The routing job adds ~10 seconds of overhead — negligible relative to the LLM reasoning time that follows.

---

## 4. Session Continuity Across Specialists

When an issue starts with a `security` label and later gains a `backend` label, the conversation must flow between specialists without losing context. The Fabric's session model — JSONL transcripts committed to git — supports this naturally:

1. Issue #42 opens with `security` label.
2. Security Auditor responds. Session transcript committed: `state/sessions/42-security-001.jsonl`
3. Collaborator adds `backend` label and posts a follow-up comment.
4. Backend Specialist responds. It reads the existing issue thread (including the Security Auditor's comment) and the committed session history. Session transcript committed: `state/sessions/42-backend-001.jsonl`
5. Both transcripts are available for future invocations. Any specialist assigned to issue #42 sees the full conversation history.

The key insight: **the issue thread is the shared context.** GitHub's native issue UI already displays the full conversation. The committed session transcripts provide the agent-internal reasoning that produced each comment. Together, they give any specialist a complete picture of what has happened.

---

## 5. The Dispatch Manifest

The routing logic should be declarative, not buried in shell scripts. A dispatch manifest — committed to the repository alongside the agent specifications — makes routing reviewable, diffable, and versionable:

```yaml
# agenticana/dispatch.yaml
default_agent: orchestrator
auto_route: true  # Use Model Router when no label matches

routes:
  - label: security
    agent: security-auditor
    model_tier: pro
    skills: [core, vulnerability-scanner, red-team-tactics]

  - label: frontend
    agent: frontend-specialist
    model_tier: flash
    skills: [core, nextjs-react-expert]

  - label: backend
    agent: backend-specialist
    model_tier: flash
    skills: [core, backend]

  - label: architecture
    mode: simulacrum
    agents: [orchestrator, backend-specialist, security-auditor, frontend-specialist]
    model_tier: pro
    output: docs/decisions/  # ADR committed here

  - label: review
    mode: swarm
    agents: [security-auditor, test-engineer]
    model_tier: flash

  - label: full-stack
    mode: swarm
    agents: [frontend-specialist, backend-specialist, security-auditor]
    model_tier: flash
```

This manifest is the routing equivalent of the Fabric's cull rules or splice manifests — declarative configuration that governs behavior without requiring code changes.

---

## 6. What Changes in the Fabric's Lifecycle

The `resolve → materialize → validate → run → emit` pipeline adapts as follows:

| Phase | Single-Agent (Current) | Multi-Agent (Agenticana) |
|-------|----------------------|--------------------------|
| **Resolve** | Module name → spec | Module name + label → agent spec(s) + dispatch manifest |
| **Materialize** | Fetch upstream, apply rules | Fetch upstream, apply rules, load agent YAML + skills for selected agent(s) |
| **Validate** | Contract tests, smoke tests | Contract tests + verify dispatch manifest + verify agent YAML schemas |
| **Run** | Single agent execution | Dispatch to one or more agents (single, swarm, or simulacrum) |
| **Emit** | Comment + commit | Comment(s) + commit(s) + optional ADR (for simulacrum) |

The pipeline does not break. It branches at the **Run** phase and may produce multiple outputs at the **Emit** phase. The Source and Transformation phases are unchanged — they prepare the module. The new routing decision sits between Validate and Run.

---

## 7. The Identity Question

With twenty agents, identity configuration changes fundamentally. The Fabric's current model — one `AGENTS.md` file — becomes insufficient. Agenticana's identity model is already richer:

- Each agent has a **YAML specification** defining its name, description, model tier, skills, and behavioral constraints.
- Each agent has a **Markdown instruction file** defining its persona, priorities, and operational guidelines.
- The **orchestrator** has a special role: it can delegate to other agents and coordinate multi-agent workflows.

In the Fabric, these would live as committed configuration:

```
.github-fabric/agenticana/
├── dispatch.yaml
├── agents/
│   ├── orchestrator.yaml + orchestrator.md
│   ├── security-auditor.yaml + security-auditor.md
│   ├── frontend-specialist.yaml + frontend-specialist.md
│   └── ... (17 more)
└── skills/
    ├── core/
    ├── domain/
    └── utility/
```

Every persona is diffable, reviewable, and subject to the same PR process as any other configuration. `git log agents/security-auditor.yaml` traces the evolution of the Security Auditor's behavioral configuration. `git blame agents/orchestrator.md` reveals who changed the Orchestrator's priorities and when.

This is the Fabric's identity model — configuration-as-code for agent personality — extended from one persona to twenty.

---

## 8. Summary

The routing problem is solvable. The Fabric already owns the primitives needed — labels for dispatch, matrix strategies for parallelism, JSONL for session continuity, committed YAML for configuration. What Agenticana adds is the requirement to compose these primitives into a dispatch layer that did not previously exist.

The dispatch manifest is the new artifact. It sits alongside the agent specifications and skill definitions as committed, reviewable, versionable infrastructure. It makes the routing decision transparent: anyone who can read a YAML file can understand which agent will respond to their issue.

Twenty agents, one Fabric. The loom weaves more threads, but the pattern holds.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

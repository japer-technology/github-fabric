# Transformation Map

> [Agenticana Index](./index.md) · [Twenty Agents, One Fabric](./twenty-agents-one-fabric.md) · [Cost and Constraints](./cost-and-constraints.md)

> The concrete plan for absorbing Agenticana into the Fabric's Three Planes — what gets ingested, how it transforms, and what executes.

---

## 1. Source Plane: What Gets Ingested

The Fabric's Source Plane principle is stated clearly: **faithful capture, truth over convenience.** The upstream is treated as genetic material — imported whole, then selectively expressed.

### The Upstream Repository

[Agenticana](https://github.com/ashrafmusa/AGENTICANA) contains:

```
AGENTICANA/
├── agents/               # 20 specialist agents (YAML specs + MD instructions)
├── skills/               # 36 skills in 3-tier hierarchy
├── router/               # Model Router (complexity scoring, token estimation)
├── mcp/                  # MCP server (11 tools for VS Code Copilot Chat)
├── memory/               # ReasoningBank (decisions, patterns, embeddings)
├── scripts/              # 18+ Python CLI scripts
├── schemas/              # JSON schemas for agents, skills, memory
├── workflows/            # GitHub Actions workflow templates
├── rules/                # Shared coding rules
├── .github/
│   ├── copilot-instructions.md
│   └── workflows-disabled/
├── package.json          # Node.js dependencies
├── requirements.txt      # Python dependencies
└── setup.ps1             # Windows setup
```

### What to Ingest

| Component | Ingest? | Rationale |
|-----------|---------|-----------|
| `agents/` | **Yes — critical** | These are the twenty specialist definitions. Without them, there is no multi-agent capability. |
| `skills/` | **Yes — critical** | The three-tier skill hierarchy is the knowledge base that makes specialists effective. |
| `router/` | **Yes** | Model Router logic is needed for cost-aware model selection on Actions. |
| `memory/` | **Partially** | ReasoningBank schema and retrieval logic: yes. Existing local decisions: no (start fresh in the Fabric). |
| `scripts/` | **Selectively** | `reasoning_bank.py` (memory management), `real_simulacrum.py` (debate), `swarm_dispatcher.py` (parallel execution), `guardian_mode.py` (validation). Other scripts may be VS Code-specific and should be evaluated individually. |
| `schemas/` | **Yes** | JSON schemas enforce structural correctness of agent definitions, skills, and memory entries. |
| `rules/` | **Yes** | Shared coding rules apply regardless of execution environment. |
| `.github/copilot-instructions.md` | **Yes** | Dual-use: configures both local Copilot and GitHub-hosted Copilot agent. |

### What to Cull

| Component | Cull? | Rationale |
|-----------|-------|-----------|
| `mcp/` | **Yes** | The MCP server is VS Code-specific. In the Fabric, agent invocation is through lifecycle scripts, not MCP. |
| `setup.ps1` | **Yes** | Windows-specific setup. Actions runners are Ubuntu. |
| `workflows-disabled/` | **Evaluate** | These are pre-designed workflow templates. They may inform the Fabric's workflows but should not be activated as-is. |
| `package.json` | **Selectively** | Keep dependencies needed by the ingested scripts. Cull VS Code/MCP-specific dependencies. |
| Existing `memory/reasoning-bank/decisions.json` content | **Yes** | Start with an empty ReasoningBank. Local decisions from a different context would pollute the Fabric's memory. |

---

## 2. Transformation Plane: How It Normalizes

The Transformation Plane converts the ingested upstream into an addressable Fabric module. For Agenticana, this involves several transformations that are more complex than any previous case.

### 2.1 Agent Specification Normalization

Each agent's YAML + Markdown pair must be normalized into a format the Fabric's lifecycle scripts can consume:

**Input (Agenticana native):**
```yaml
# agents/security-auditor.yaml
name: security-auditor
description: "Security vulnerability detection and compliance auditing"
model_tier: pro
skills:
  - core
  - vulnerability-scanner
  - red-team-tactics
personality: agents/security-auditor.md
```

**Output (Fabric-adapted):**
```yaml
# .github-fabric/agenticana/agents/security-auditor.yaml
name: security-auditor
description: "Security vulnerability detection and compliance auditing"
model_tier: pro
skills:
  tier1: [clean-code, error-handling, git-conventions]
  tier2: [vulnerability-scanner]
  tier3: [red-team-tactics]
persona: .github-fabric/agenticana/agents/security-auditor.md
fabric:
  labels: [security]
  defcon_minimum: 2        # Active at DEFCON 2 and below
  commit_scope: read-only  # Can analyze but not modify code at DEFCON 2
```

The normalization adds Fabric-specific metadata: label routing, DEFCON behavior, and commit scope. The agent's core identity (name, skills, model tier) is preserved unchanged.

### 2.2 Skill Loading Optimization

The three-tier skill system maps directly to token budget management:

| Tier | Loading Rule | Fabric Behavior |
|------|-------------|-----------------|
| **Tier 1 — Core** | Always loaded | Included in every agent's system prompt |
| **Tier 2 — Domain** | Loaded when domain matches | Included based on agent's YAML `skills.tier2` |
| **Tier 3 — Utility** | Loaded on explicit need | Included only when the dispatch manifest specifies the skill |

This tiered loading is a natural fit for the Fabric's cost-aware execution model. On Actions, every token costs compute time. Loading only the necessary skills for each invocation is both a performance optimization and a budget discipline.

### 2.3 Script Adaptation

Agenticana's Python scripts are designed for local CLI execution. The Fabric's lifecycle scripts are TypeScript (following the `pi-coding-agent` pattern). The transformation options:

**Option A: Wrap Python scripts from TypeScript.**

The lifecycle script calls Agenticana's Python scripts as subprocesses:

```typescript
// lifecycle/agent.ts
const result = await $`python3 scripts/reasoning_bank.py query --task "${task}"`;
```

**Pros:** Minimal rewrite. Agenticana's script logic is preserved exactly.
**Cons:** Requires Python runtime on the Actions runner. Two language runtimes.

**Option B: Rewrite core logic in TypeScript.**

Port the ReasoningBank query, Swarm Dispatcher, and Simulacrum logic to TypeScript to match the Fabric's existing lifecycle scripts.

**Pros:** Single runtime. Consistent with other Fabric modules.
**Cons:** Significant effort. Risk of logic drift from upstream.

**Recommendation:** Option A for the initial transformation. The Python runtime is readily available on `ubuntu-latest` runners. Wrapping preserves upstream logic fidelity. If the Python dependency becomes a pain point, selective rewriting can happen incrementally.

### 2.4 Dispatch Manifest Creation

The transformation must produce a `dispatch.yaml` that maps GitHub events to specialists. This is new configuration that does not exist in the upstream — it is the Fabric's adapter contract for Agenticana's routing model. See [Twenty Agents, One Fabric](./twenty-agents-one-fabric.md) for the full manifest specification.

---

## 3. Execution Plane: What Runs

### 3.1 The Workflow

A single workflow handles all Agenticana invocations:

```yaml
name: agenticana-agent
on:
  issues:
    types: [opened, labeled]
  issue_comment:
    types: [created]

permissions:
  contents: write
  issues: write

jobs:
  authorize:
    runs-on: ubuntu-latest
    steps:
      - name: Check permissions
        run: |
          PERMISSION=$(gh api "repos/${{ github.repository }}/collaborators/${{ github.actor }}/permission" --jq '.permission')
          if [[ "$PERMISSION" != "admin" && "$PERMISSION" != "write" ]]; then
            gh api "repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/reactions" -f content="-1"
            exit 1
          fi

  route:
    needs: authorize
    runs-on: ubuntu-latest
    outputs:
      agents: ${{ steps.dispatch.outputs.agents }}
      mode: ${{ steps.dispatch.outputs.mode }}
    steps:
      - uses: actions/checkout@v4
      - name: Dispatch
        id: dispatch
        run: |
          # Read issue labels
          # Parse dispatch.yaml
          # Output: agents and mode (single/swarm/simulacrum)

  execute:
    needs: route
    strategy:
      matrix:
        agent: ${{ fromJson(needs.route.outputs.agents) }}
      fail-fast: false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          bun install --frozen-lockfile

      - name: Run specialist
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
        run: |
          # Load agent config: agents/${{ matrix.agent }}.yaml
          # Load skills per tier
          # Execute agent with issue context
          # Commit session + ReasoningBank update
          # Post result as issue comment
```

### 3.2 State Directory

```
.github-fabric/agenticana/
├── dispatch.yaml
├── agents/                    # Normalized agent specifications
├── skills/                    # Three-tier skill hierarchy
├── router/                    # Model Router logic
├── state/
│   ├── issues/                # Issue → agent mapping
│   ├── sessions/              # JSONL session transcripts
│   ├── reasoning-bank/
│   │   ├── decisions.json     # Structured decisions (committed)
│   │   └── embeddings/        # Regenerated at runtime (gitignored)
│   └── attestations/          # PoW attestation records (committed)
└── guardian/                  # Guardian Mode check scripts
```

### 3.3 The Lifecycle Pipeline

For Agenticana, the Fabric's `resolve → materialize → validate → run → emit` pipeline becomes:

| Phase | Action |
|-------|--------|
| **Resolve** | Read issue labels → parse `dispatch.yaml` → determine agent(s) and mode |
| **Materialize** | Checkout repo → load agent YAML + skills for selected specialist(s) → load ReasoningBank |
| **Validate** | Verify agent YAML schema → verify dispatch manifest → check DEFCON level |
| **Run** | Execute agent(s): single, swarm (parallel), or simulacrum (sequential debate) |
| **Emit** | Post comment(s) → commit session + ReasoningBank + attestation → push with retry |

---

## 4. Provenance Chain

Every Agenticana execution in the Fabric produces a complete provenance record:

```
User opens issue #42 with label "security"
  → Workflow run #12345 dispatches to security-auditor
    → Agent reads issue context + ReasoningBank
      → LLM reasoning (pro tier, loaded skills: core + vulnerability-scanner)
        → Agent produces analysis
          → Guardian Mode validates (no secrets, no dangerous patterns)
            → Comment posted to issue #42
            → Session committed: state/sessions/42-security-001.jsonl
            → ReasoningBank updated: state/reasoning-bank/decisions.json
            → Attestation committed: state/attestations/42-001.json
              → Git push with SHA abc123
```

The provenance chain connects: user → issue → workflow → agent → model → skills → validation → output → commit. Every link is a committed artifact. Every link is auditable.

---

## 5. Summary

The transformation of Agenticana into a Fabric module follows the Three Planes faithfully — but each plane does more work than in any previous case study:

| Plane | Previous Case Studies | Agenticana |
|-------|----------------------|------------|
| **Source** | Ingest one agent entry point | Ingest 20 agent specs, 36 skills, router, memory system, validation scripts |
| **Transformation** | Normalize one invocation | Normalize 20 invocations + dispatch manifest + skill tiers + DEFCON mapping |
| **Execution** | One agent, one job | Dispatch to one or many agents, single/swarm/simulacrum modes, multi-job workflows |

The planes hold. The lifecycle holds. The provenance chain holds. Agenticana is the most complex module the Fabric has absorbed — and the transformation map shows that the architecture accommodates it without breaking its principles.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

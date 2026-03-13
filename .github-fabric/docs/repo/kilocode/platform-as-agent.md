# Platform as Agent

> [Kilocode Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [Source Plane](../../question-what.md)

> Kilocode is not an agent — it is a platform that hosts agents. Absorbing a platform into the Fabric is fundamentally different from absorbing an agent or a toolkit. The platform has its own server, its own clients, its own SDK, and its own economy. The Fabric must decide: absorb, compose, or coexist.

---

## 1. The Evolution from Agent to Platform

The Fabric's analysis history traces an evolution:

| Analysis | What Was Absorbed | Category |
|----------|------------------|----------|
| **Agenticana** | A swarm of 20 agents sharing memory | Agent swarm |
| **OpenClaw** | A persistent multi-channel assistant | Agent gateway |
| **NanoClaw** | A minimalist AI assistant | Agent (minimal) |
| **Pi-Mono** | A toolkit for building agents | Toolkit |
| **OpenAI Codex** | A terminal coding agent from the LLM vendor | Agent (vendor) |
| **Kilocode** | A multi-surface platform with 500+ models, SDK, gateway, and credits | **Platform** |

Each step increased the complexity of what the Fabric confronts. Agents have a loop: perceive → reason → act. Toolkits have components: libraries, runtimes, CLIs. Platforms have all of these **plus infrastructure**: servers, authentication, routing, economics, and telemetry.

Kilocode is not a program that responds to prompts. It is a system that:

- **Runs a persistent HTTP server** (`kilo serve`) that multiple clients connect to
- **Hosts multiple simultaneous agent sessions** via the Agent Manager
- **Routes requests through its own gateway** (Kilo Gateway with OAuth + credits)
- **Distributes a VS Code extension** that spawns the server as a child process
- **Ships a desktop application** (Tauri) and a web interface
- **Publishes an auto-generated SDK** for programmatic access
- **Maintains its own telemetry pipeline** (PostHog + OpenTelemetry)

This is not something you wrap in a GitHub Action. This is something that has its own gravitational field.

---

## 2. Three Absorption Models

When the Fabric encounters a platform, the Source Plane has three options — the same three that applied to pi-mono's toolkit, but with different consequences:

### Option A: Absorb the Agent, Ignore the Platform

Extract the core agent logic (`packages/opencode/src/agent/`) and the tool registry (`packages/opencode/src/tool/`). Ignore the server, the VS Code extension, the SDK, the gateway, and the desktop app. Run the agent in a GitHub Actions workflow, driven by issues.

This is the simplest option. It reduces Kilocode to what every previous analysis reduced its subject to: a reasoning loop with tools. The Fabric provides governance; the agent provides intelligence.

**What is lost:** Everything that makes Kilocode a platform — multi-session orchestration, real-time streaming to multiple clients, model switching, the credits economy, interactive feedback.

**What is preserved:** The agent loop, the tool registry, the Zod-validated namespace pattern, the provider abstraction.

### Option B: Compose with the Platform

Do not absorb Kilocode. Instead, treat it as an external service. The Fabric's GitHub Action calls Kilocode's HTTP API (via `@kilocode/sdk`) to perform tasks. Kilocode runs its own server — either self-hosted or through the Kilo cloud — and the Fabric consumes it as a service.

```yaml
# .github/workflows/fabric-kilocode.yml
jobs:
  resolve:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Call Kilocode API
        env:
          KILO_API_KEY: ${{ secrets.KILO_API_KEY }}
        run: |
          kilo run --auto \
            --model "anthropic/claude-sonnet-4-20250514" \
            --task "${{ github.event.issue.body }}"
      - name: Commit results
        run: |
          git add -A
          git commit -m "Fabric: resolved #${{ github.event.issue.number }}"
          git push
```

**What is preserved:** The entire platform — server, models, gateway, credits, telemetry.

**What is lost:** The Fabric's claim that the repository is the mind. If the reasoning happens on Kilocode's server, the repository is a client, not the seat of intelligence.

### Option C: Absorb the Genome, Build a Fabric-Native Platform

This is the recursive option. The Fabric does not absorb Kilocode as-is. It absorbs the architectural patterns — the Hono server model, the Zod namespace pattern, the registry-based tools, the pub/sub event bus, the multi-session state management — and builds its own platform-grade infrastructure.

**What is preserved:** The design wisdom. The patterns that make Kilocode scale to 1.5M users.

**What is lost:** The code itself. The community. The model integrations. The tested, battle-hardened implementation.

---

## 3. The Platform Paradox

The platform creates a paradox for the Fabric. The Fabric's thesis is "the repository is the mind." But a platform is designed to be the mind's **host** — the server that runs the reasoning, stores the sessions, routes the models, and manages the economy. Kilocode does not just respond to prompts; it **orchestrates** responses across multiple sessions, models, and clients.

If the Fabric absorbs the agent (Option A), it discards the orchestration that makes Kilocode valuable. If the Fabric composes with the platform (Option B), it cedes the "seat of intelligence" to Kilocode's server. If the Fabric absorbs the genome (Option C), it rebuilds from scratch.

The resolution lies in understanding what the Fabric actually governs:

| Layer | Who Governs | Who Executes |
|-------|------------|-------------|
| **Task initiation** | The Fabric (issue opened) | GitHub |
| **Agent reasoning** | Configurable | Kilocode agent loop or Fabric agent loop |
| **Tool execution** | The Fabric (committed tool config) | Actions runner |
| **State persistence** | The Fabric (commit graph) | Git |
| **Model routing** | Configurable | Kilo Gateway or direct provider |
| **Telemetry** | The Fabric (committed config) | PostHog/OTel or Fabric's own |

The answer is not one option but a **spectrum**. The Fabric can use Kilocode's agent loop while providing its own governance. The Fabric can use the Kilo Gateway for model routing while committing the routing configuration. The Fabric can consume Kilocode's SDK while treating every response as committed state.

---

## 4. The Server Question

Kilocode's architecture centers on a persistent HTTP server (`kilo serve`). All clients — TUI, VS Code, desktop, web — connect to this server via REST and SSE. The server holds:

- Active agent sessions with their state
- Provider connections with streaming
- Tool execution contexts
- MCP server connections
- Event bus subscriptions

GitHub Actions runners are ephemeral. They start, execute, and terminate. There is no persistent server. This is the fundamental architectural tension between Kilocode and the Fabric.

**Resolution:** The Fabric does not need the server to be persistent. It needs the server to be **instantiable**. For each issue, the Action starts a Kilocode server, processes the task, commits the results, and terminates. The session state is committed to the repository as JSONL or SQLite. The next issue loads the committed state and resumes.

This is the same pattern used for database migrations in CI: the database does not persist between runs, but the schema and data are committed and replayed. Kilocode's server does not persist between issues, but the sessions and configuration are committed and restored.

```
Issue #42 opened
  → Actions runner starts
    → kilo serve --headless
      → Load committed session state
      → Process issue body
      → Commit results + updated session
    → Server terminates
  → Runner stops
```

---

## 5. What the Fabric Gains from the Platform

Despite the tensions, the platform model offers the Fabric capabilities it does not have:

| Platform Capability | Fabric Gain |
|-------------------|------------|
| **Auto-generated SDK** | Type-safe API for external integrations |
| **Zod-validated functions** | Input validation at every boundary |
| **Pub/sub event bus** | Decoupled module communication |
| **Per-project state isolation** | Multi-repository agent management |
| **Structured error types** | Precise failure diagnostics |
| **Registry-based tools** | Dynamic tool discovery and composition |
| **Agent modes** (Architect/Coder/Debugger) | Task-appropriate reasoning strategies |

The platform is richer than any previous agent the Fabric has analyzed. It is not just an agent — it is an agent **factory**: a system that can instantiate different kinds of agents (modes) with different tool sets, model configurations, and behavioral parameters. The Fabric could leverage this to offer issue-type-specific agent behavior:

- `bug` label → Debugger mode
- `feature` label → Architect mode → Coder mode
- `refactor` label → Coder mode with conservative tool permissions

---

## 6. Summary

| Dimension | Agent (Previous Analyses) | Platform (Kilocode) |
|-----------|--------------------------|-------------------|
| **What the Fabric absorbs** | A reasoning loop | A server, SDK, gateway, and economy |
| **Source Plane action** | Fork or wrap | Absorb agent, compose with platform, or absorb genome |
| **Governance target** | The agent's actions | The platform's configuration |
| **Identity** | The agent has one | The platform has multiple (agent modes, client surfaces) |
| **Execution model** | Single loop | Multi-session, multi-client, persistent server |
| **Economic model** | Token costs | Token costs + credits + gateway fees + telemetry |
| **Composition** | Fabric wraps agent | Fabric composes with platform at multiple layers |

Kilocode is the first subject where the Fabric must decide not just how to govern the agent, but how to relate to an entire ecosystem. The answer is layered composition: absorb what fits, compose where it doesn't, and govern the boundary between them.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

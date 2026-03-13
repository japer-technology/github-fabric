# Agentic Orchestration

> [Kilocode Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [How?](../../question-how.md)

> Kilocode does not just run one agent — it orchestrates many. The Agent Manager spawns parallel sessions with git worktree isolation, each with its own model, tools, and branch. The Fabric runs one issue at a time. The question is how multi-session orchestration composes with issue-driven governance.

---

## 1. The Orchestration Architecture

Kilocode's orchestration operates at multiple levels:

### Level 1: Single Agent Session

A single session runs the agent loop: receive prompt → reason → call tools → produce response. This is the basic unit of execution, equivalent to what the Fabric already supports.

```typescript
// Single session lifecycle
const session = await Session.create({
  model: "anthropic/claude-sonnet-4-20250514",
  mode: "coder",
  tools: Tool.registry.all(),
});

await session.prompt("Refactor the authentication module");
// Agent reasons, calls read/write/edit/bash tools, produces response
```

### Level 2: Multi-Session Orchestration (Agent Manager)

The VS Code extension's Agent Manager creates multiple parallel sessions, each isolated in its own git worktree:

```
Agent Manager
├── Session A (worktree: feature/auth-refactor)
│     ├── Model: claude-sonnet-4
│     ├── Mode: coder
│     ├── Tools: read, write, edit, bash
│     └── Status: working on auth module
├── Session B (worktree: fix/pagination-bug)
│     ├── Model: gpt-4o
│     ├── Mode: debugger
│     ├── Tools: read, bash, search
│     └── Status: investigating bug
└── Session C (worktree: docs/api-reference)
      ├── Model: claude-haiku-3.5
      ├── Mode: architect
      ├── Tools: read, write
      └── Status: generating documentation
```

Each session gets:
- **Its own git branch** created via `git worktree add`
- **Its own working directory** isolated from other sessions
- **Its own model configuration** — different sessions can use different models
- **Its own tool permissions** — different modes enable different tools
- **Its own session state** — conversations are independent

### Level 3: Tool-Level Orchestration

Within a single session, the agent can invoke tools that themselves involve complex orchestration:

- **Bash execution** — Run terminal commands in a PTY (pseudo-terminal) with Bun
- **MCP servers** — Connect to external tool providers (browser automation, database queries, GitHub API)
- **File operations** — Read, write, edit, and search across the repository
- **Git operations** — Commit, branch, status, diff

---

## 2. The Fabric's Issue-Driven Model

The Fabric runs one agent per issue. The execution model is:

```
Issue #42 opened
  → GitHub Actions workflow triggers
    → Single agent session starts
      → Agent reads issue + comments
      → Agent reasons, calls tools
      → Agent commits results
    → Session ends
  → Issue updated with response
```

There is no multi-session orchestration. No Agent Manager. No parallel worktrees. The Fabric processes issues sequentially (or concurrently across different issues, but each issue gets one agent).

This is simpler than Kilocode's orchestration — but it maps cleanly to GitHub's existing model:

| GitHub Concept | Fabric Mapping |
|----------------|---------------|
| Issue | Task input |
| Issue comment | Follow-up input or agent response |
| Branch | Agent's working space |
| Pull Request | Agent's proposed changes |
| PR review | Human governance checkpoint |
| Merge | Approved changes enter main |

---

## 3. Composing Orchestration Models

Kilocode's multi-session model and the Fabric's issue-driven model can compose:

### Pattern A: One Issue = One Session (Simple)

The current Fabric model. Each issue triggers one agent session. The session processes the issue and commits results.

```
Issue #42 → Session → Commit → PR
```

### Pattern B: One Issue = One Orchestrated Session (Enhanced)

The issue triggers one session, but that session has access to Kilocode's full tool orchestration — MCP servers, multi-step reasoning, internal sub-tasks.

```
Issue #42 → Session
              ├── Step 1: Analyze (read files, search code)
              ├── Step 2: Plan (architect mode)
              ├── Step 3: Implement (coder mode)
              ├── Step 4: Validate (bash: run tests)
              └── Commit → PR
```

### Pattern C: One Issue = Multiple Parallel Sessions (Full Orchestration)

The issue triggers multiple parallel agent sessions, each in its own worktree, coordinated by a meta-agent. This mirrors Kilocode's Agent Manager.

```
Issue #42 ("Refactor authentication across 3 modules")
  → Meta-agent plans decomposition
    ├── Session A (worktree) → Refactor auth/login
    ├── Session B (worktree) → Refactor auth/session
    └── Session C (worktree) → Refactor auth/permissions
  → Meta-agent merges worktrees
  → Single PR with all changes
```

Pattern C is the most powerful but also the most expensive (3x Actions minutes, 3x token costs) and the most complex to govern (which session's decisions take priority when they conflict?).

---

## 4. Git Worktree Isolation

Kilocode's use of git worktrees for session isolation is architecturally significant. A worktree creates a separate working directory that shares the repository's Git history but has its own branch:

```bash
git worktree add ../session-a feature/session-a
git worktree add ../session-b fix/session-b
```

This means parallel sessions cannot accidentally overwrite each other's changes. Each session works on its own branch. Merge conflicts are resolved when branches are merged — either by the agent or by a human reviewer.

The Fabric can adopt this pattern directly. GitHub Actions runners have full git access. Worktrees are lightweight (just files + a branch pointer). The governance benefit is clear: each parallel session produces a separate, auditable branch.

```yaml
# Fabric multi-session orchestration
jobs:
  orchestrate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        subtask: [auth-login, auth-session, auth-permissions]
    steps:
      - uses: actions/checkout@v4
      - name: Create worktree
        run: git worktree add ./work-${{ matrix.subtask }} -b fabric/${{ matrix.subtask }}
      - name: Run agent session
        working-directory: ./work-${{ matrix.subtask }}
        run: kilo run --auto --task "${{ matrix.subtask }}"
      - name: Push branch
        run: git push origin fabric/${{ matrix.subtask }}
```

---

## 5. The Tool Registry

Kilocode's tool system uses a registry pattern:

```typescript
Tool.define("read_file", () => ({
  description: "Read file contents",
  parameters: z.object({ path: z.string() }),
  execute: async ({ path }) => {
    return await Bun.file(path).text();
  },
}));

Tool.define("write_file", () => ({
  description: "Write content to file",
  parameters: z.object({ path: z.string(), content: z.string() }),
  execute: async ({ path, content }) => {
    await Bun.write(path, content);
  },
}));
```

Every tool is:
- **Defined with a schema** — Zod validation for inputs
- **Registered in a central registry** — Discoverable at runtime
- **Mode-dependent** — Different agent modes expose different tool subsets

The Fabric can govern this registry through committed configuration:

```yaml
# .github-fabric/tools.yml
allowed_tools:
  - read_file
  - write_file
  - edit_file
  - bash        # with constraints
  - search_files

denied_tools:
  - delete_file  # too destructive for automated use

tool_constraints:
  bash:
    timeout: 60
    allowed_commands: ["npm test", "npm run lint", "go test"]
    denied_patterns: ["rm -rf", "curl", "wget"]
```

This composition — Kilocode's registry provides the capabilities, the Fabric's configuration governs which capabilities are available — follows the pattern established in the [Pi-Mono analysis](../pi-mono/the-extensible-mind.md): extensibility composed with governance.

---

## 6. MCP Integration

Kilocode supports the Model Context Protocol (MCP) for extending agent capabilities with external tools:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-browser"]
    }
  }
}
```

MCP servers are external processes that provide tools to the agent. The agent discovers available tools at runtime, calls them through the MCP protocol, and incorporates results into its reasoning.

For the Fabric, MCP servers present a governance opportunity and a governance challenge:

| Aspect | Opportunity | Challenge |
|--------|------------|-----------|
| **Tool discovery** | MCP servers declare their capabilities via schemas | The Fabric cannot audit tools it discovers at runtime |
| **External data** | MCP servers can access databases, APIs, browsers | External data sources are not committed state |
| **Extensibility** | New capabilities without code changes | New capabilities without review |

**Governance resolution:** MCP server configuration must be committed. The `mcpServers` block lives in a committed configuration file. Adding a new MCP server requires a commit, which requires a PR, which requires review. The tools provided by MCP servers are dynamic, but the decision to enable a particular MCP server is a governed decision.

---

## 7. Summary

| Dimension | Kilocode (Native) | Fabric (Governed) | Composed |
|-----------|-------------------|-------------------|----------|
| **Sessions** | Multi-session Agent Manager | One session per issue | Parallel sessions via matrix strategy |
| **Isolation** | Git worktree per session | Branch per issue | Worktree per parallel session |
| **Tools** | Registry with 20+ tools | Committed tool allowlist | Registry governed by configuration |
| **MCP** | Runtime tool discovery | No dynamic capabilities | MCP config committed; servers governed |
| **Modes** | Architect/Coder/Debugger | Single mode per run | Mode selected by issue label |
| **Coordination** | Agent Manager orchestrates | No built-in coordination | Meta-agent pattern for multi-session |
| **State** | SQLite + file-based | Committed session state | SQLite committed or session JSONL |

Kilocode's orchestration is richer than the Fabric's current model. But the Fabric's governance model is richer than Kilocode's. Composition produces orchestrated governance: parallel sessions with auditable branches, registered tools with committed allowlists, and MCP integration with committed server configuration.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

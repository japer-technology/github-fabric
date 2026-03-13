# Multi-Surface Architecture

> [Kilocode Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [Execution Plane](../../question-where.md)

> Kilocode runs everywhere — terminal, VS Code, desktop, browser. The Fabric runs in one place: GitHub Actions. When a multi-surface agent meets a single-surface runtime, the question is not what to cut but what the single surface must become.

---

## 1. Four Surfaces, One Server

Kilocode's architecture separates the server from its clients. A single `@kilocode/cli` process runs the Hono HTTP server, the agent loop, the tool registry, the session manager, and the provider connections. Four different clients connect to this server:

| Surface | Package | Interface | Connection |
|---------|---------|-----------|-----------|
| **Terminal TUI** | `@kilocode/cli` (in-process) | SolidJS + OpenTUI | Direct function calls |
| **VS Code** | `kilo-code` (extension) | SolidJS webview | HTTP + SSE to spawned CLI |
| **Desktop** | `@opencode-ai/desktop` | SolidJS + Tauri | HTTP + SSE to bundled CLI |
| **Web** | `@opencode-ai/app` | SolidJS browser | HTTP + SSE to remote CLI |

The separation is clean: the server handles reasoning, tool execution, and state management. The clients handle rendering, user input, and display. Communication is REST for commands and Server-Sent Events for streaming.

This is a well-established pattern — the language server protocol (LSP), the model context protocol (MCP), and the debug adapter protocol (DAP) all separate the intelligence from the surface. Kilocode applies this pattern at the application level.

---

## 2. The Fabric's Single Surface

The Fabric has one surface: GitHub. More precisely, it has one trigger surface (Issues, PRs, comments), one execution surface (Actions runners), and one persistence surface (the Git repository).

```
GitHub (single surface)
├── Trigger:    Issues · PRs · Comments · Workflow dispatch
├── Execution:  Actions runners (ephemeral Linux VMs)
├── Rendering:  Issue comments · PR reviews · Commit messages
└── Persistence: Git repository (committed state)
```

There is no terminal, no VS Code panel, no desktop window, no browser tab. The entire interaction happens through GitHub's existing interfaces — text in, text out, files committed.

When Kilocode is absorbed into the Fabric, three of its four surfaces become irrelevant:

| Kilocode Surface | Fabric Equivalent | Status |
|-----------------|-------------------|--------|
| Terminal TUI | None (no terminal user) | ❌ Not applicable |
| VS Code extension | None (no IDE connected to Actions) | ❌ Not applicable |
| Desktop app | None (no desktop in Actions) | ❌ Not applicable |
| HTTP API (headless server) | Actions runner calling `kilo serve` | ✅ Applicable |

The only Kilocode surface that maps to the Fabric is the **headless server** — `kilo serve` running without a connected TUI, VS Code, or desktop client. This is the same mode used for CI/CD integration, where Kilocode runs as `kilo run --auto --task "..."`.

---

## 3. What the Surfaces Provide

Each Kilocode surface provides capabilities that the headless mode lacks:

### 3.1. Terminal TUI

The terminal provides:
- **Real-time streaming** — Token-by-token output rendering
- **Interactive steering** — The user can interrupt, redirect, or provide additional context mid-generation
- **Visual diff rendering** — File changes shown inline with syntax highlighting
- **Model cycling** — Switch models on the fly during a conversation
- **Session branching** — Navigate the conversation tree, explore alternatives

**Fabric equivalent:** Issue comments. The Fabric can post streaming-like updates by editing a comment in place (progressive disclosure). The user can steer by posting a follow-up comment. But the latency is minutes, not milliseconds.

### 3.2. VS Code Extension

The VS Code extension provides:
- **Code context** — The extension sees the open file, cursor position, selected text, and workspace structure
- **Inline actions** — Apply suggested changes directly to the editor
- **Agent Manager** — Multi-session orchestration with git worktree isolation
- **Side-by-side chat** — Conversation panel alongside the code

**Fabric equivalent:** The repository. The Fabric has access to all files (not just the open one), but it has no cursor, no selection, no "currently viewing" context. The Fabric's context is the issue body, which must explicitly describe what the user wants.

### 3.3. Desktop App

The desktop app provides:
- **Native performance** — Tauri-compiled binary with native OS integration
- **Local file access** — Direct filesystem access without sandboxing
- **Persistent session** — The app stays open between tasks

**Fabric equivalent:** None. The Actions runner is ephemeral. There is no persistent local state between runs (except what is committed to the repository).

---

## 4. The Reduction

When Kilocode enters the Fabric, the multi-surface architecture reduces to:

```
Kilocode (native)                    Kilocode (in Fabric)
┌────────────────────────┐          ┌─────────────────────────┐
│ TUI · VS Code · Desktop│          │ GitHub Issues (input)    │
│ Web · HTTP API         │    →     │ Actions runner (execute)  │
│                        │          │ Issue comments (output)   │
│ Persistent server      │          │ Ephemeral server          │
│ Multi-session state    │          │ Committed session state   │
│ Real-time streaming    │          │ Progressive comments      │
│ Interactive steering   │          │ Follow-up comments        │
└────────────────────────┘          └─────────────────────────┘
```

This is a significant reduction. But it is also a **focusing**. The multi-surface architecture serves individual developers in their native environments. The Fabric serves the team through the repository. These are different audiences with different needs.

---

## 5. What Is Lost

The reduction has real costs:

| Lost Capability | Impact | Mitigation |
|-----------------|--------|------------|
| **Real-time streaming** | The user cannot see the agent think in real time | Post progressive updates as issue comment edits |
| **Interactive steering** | No mid-generation redirection | Use follow-up comments; agent re-reads issue thread |
| **Code context** (cursor, selection) | Agent cannot see what the user is looking at | Issue body must be explicit; AGENTS.md provides project context |
| **Model cycling** | Cannot switch models mid-conversation | Model is committed configuration; change via PR |
| **Visual diffs** | No inline rendering of changes | Commit diffs serve the same purpose, reviewable in PR |
| **Multi-session parallelism** | Single issue = single session | Multiple issues can run in parallel (one agent per issue) |
| **Persistent state** | Server terminates after each issue | Session state committed to repository; reloaded on next run |

None of these losses are fatal. Each has a mitigation that works within GitHub's interface. But the mitigations change the **temporal character** of the interaction — from real-time to asynchronous, from interactive to declarative.

---

## 6. What Is Gained

The single-surface constraint also provides capabilities the multi-surface architecture lacks:

| Gained Capability | Why It Matters |
|------------------|---------------|
| **Audit trail** | Every interaction is a commit — visible, diffable, revertible |
| **Multi-participant** | Anyone with repo access can observe, comment, and steer the agent |
| **Asynchronous by default** | No one needs to be online when the agent works |
| **Integrated code review** | Agent changes flow through PR review — human approval before merge |
| **Persistent memory** | The commit graph is permanent; no session expires |
| **Reproducibility** | Same issue + same committed state = same agent behavior |
| **Cross-agent coordination** | Multiple agents can reference each other's issues and commits |

The single surface is not a limitation — it is a **governance advantage**. The Fabric trades interactivity for accountability, speed for permanence, individual control for team collaboration.

---

## 7. The SDK Bridge

Kilocode's auto-generated SDK (`@kilocode/sdk`) provides a programmatic interface to the server. This is the bridge between the multi-surface architecture and the Fabric's single surface:

```typescript
// In a Fabric GitHub Action
import { KiloClient } from "@kilocode/sdk";

const client = new KiloClient({ baseUrl: "http://localhost:3000" });

// Create a session
const session = await client.sessions.create({
  model: "anthropic/claude-sonnet-4-20250514",
  mode: "coder",
});

// Send the issue body as a prompt
const response = await client.sessions.prompt({
  sessionId: session.id,
  message: issueBody,
});

// Commit the results
await exec("git add -A && git commit -m 'Fabric: resolved issue'");
```

The SDK abstracts away the multi-surface complexity. The Fabric does not need to care about TUI rendering, VS Code webviews, or Tauri windows. It calls the same API that all surfaces call — but through the SDK instead of a UI.

---

## 8. Summary

| Dimension | Kilocode (Native) | Kilocode (In Fabric) | Resolution |
|-----------|--------------------|---------------------|------------|
| **Surfaces** | 4 (TUI, VS Code, Desktop, Web) | 1 (GitHub Issues + Actions) | SDK bridges the gap |
| **Server** | Persistent | Ephemeral per issue | Session state committed to repo |
| **Streaming** | Real-time token-by-token | Progressive comment updates | Acceptable for async workflow |
| **Steering** | Interactive (interrupt/redirect) | Declarative (follow-up comments) | Different temporal model |
| **Context** | Cursor, selection, open file | Issue body, AGENTS.md, full repo | Explicit vs. implicit context |
| **Parallelism** | Agent Manager (multi-worktree) | Multiple issues (one agent each) | Natural mapping |
| **Governance** | User-controlled | Repository-governed | Fabric's primary value-add |

The multi-surface architecture is Kilocode's strength as a product. The single-surface architecture is the Fabric's strength as a governance framework. They are not in conflict — they serve different needs. The SDK is the bridge that lets the Fabric use Kilocode's intelligence without needing its surfaces.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

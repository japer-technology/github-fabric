# Terminal to Repository

> [Pi-Mono Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [Gateway as Persistent Mind (OpenClaw)](../openclaw/gateway-as-persistent-mind.md)

> Pi is built for the terminal. The Fabric is built for GitHub. The transformation from terminal to repository is not a port — it is a change of medium, like translating speech into writing.

---

## 1. Pi's Terminal Identity

Pi-coding-agent is a terminal-native application. Its identity is shaped by the terminal:

- **TUI rendering** — differential rendering with synchronized output, component-based layout, inline images
- **Keyboard interaction** — Ctrl+L for model selection, Ctrl+P for model cycling, Shift+Tab for thinking level, Escape for abort
- **Editor** — multi-line text input with autocomplete, file references (@-mentions), paste handling, syntax highlighting
- **Real-time streaming** — token-by-token text display, progressive tool call arguments, thinking block streaming
- **Visual feedback** — loading spinners, typing indicators, collapsible tool output, border colors indicating thinking level
- **Session navigation** — `/tree` command for interactive branch exploration within the TUI

The terminal is not just pi's display — it is pi's **interaction model**. The human and the agent share a real-time, bidirectional, keystroke-level communication channel. The human types; the agent streams. The human interrupts (steering messages); the agent responds. The human navigates history; the agent provides context.

---

## 2. The Fabric's Interface: GitHub Issues

The Fabric's interface is GitHub Issues. The interaction model is fundamentally different:

| Property | Terminal (Pi) | GitHub Issues (Fabric) |
|----------|---------------|----------------------|
| **Latency** | Milliseconds (keystroke to display) | Minutes (comment to response) |
| **Bandwidth** | Token-by-token streaming | Complete response per comment |
| **Interruption** | Steering messages (Enter while agent runs) | New comment on issue |
| **Navigation** | `/tree` (interactive TUI) | Issue timeline (linear scroll) |
| **Media** | Inline images (Kitty/iTerm2), paste | Image attachments, file links |
| **State visibility** | Footer (tokens, cost, model, context usage) | Committed metadata files |
| **Error recovery** | Escape to abort, `/tree` to branch | New comment with correction |
| **Multi-turn** | Continuous session | Sequential comments |
| **Syntax highlighting** | Terminal ANSI colors | GitHub Markdown rendering |
| **File references** | `@` autocomplete | Manual path references |

This is not a degradation — it is a **change of medium**. The terminal is conversational: fast, ephemeral, interactive. GitHub Issues is documentary: permanent, asynchronous, reviewable.

---

## 3. What Is Lost

The transformation from terminal to repository sacrifices several capabilities:

### Real-time Streaming

Pi streams tokens as they arrive. The human reads the response as it forms, watches the agent think, sees tool calls execute in real time. In the Fabric, the response appears as a complete comment after the agent finishes. The process of reasoning is invisible; only the result is visible.

**Mitigation:** The Fabric can commit intermediate state. A progress reaction (👀) signals that the agent is working. The session JSONL records the full reasoning trace. But the real-time experience is lost.

### Interactive Steering

Pi supports steering messages — the human can interrupt the agent mid-reasoning by pressing Enter to queue a message. The agent receives the steering message after the current tool completes and adjusts its course.

In the Fabric, steering is a new comment on the issue. The agent does not see it until the next invocation (when the workflow triggers on `issue_comment`). There is no mid-reasoning interruption — the agent completes its current reasoning before seeing the steering message.

**Mitigation:** The Fabric can implement a polling mechanism — the workflow checks for new comments periodically during long-running operations. But this is polling, not interruption, and it increases Actions minutes usage.

### Session Tree Navigation

Pi's `/tree` command provides interactive, real-time navigation of the session's branch history. The human can jump to any point, explore alternative branches, and continue from any location.

In the Fabric, session navigation is through git history and the committed session JSONL file. A human can read the file and manually specify a branch point in a comment. But the interactive, visual tree navigation is not available.

**Mitigation:** The Fabric could generate an HTML visualization of the session tree (similar to pi's `/export` or `/share` commands) and commit it or attach it to the issue. Navigation would be read-only but visual.

### Keyboard Shortcuts and Model Cycling

Pi's Ctrl+L, Ctrl+P, Shift+Tab — instant model switching, thinking level adjustment, and feature toggles — have no equivalent in GitHub Issues. Configuration changes require editing committed files or using special commands in comments.

**Mitigation:** The Fabric can define comment-based commands: `/model anthropic/claude-sonnet-4`, `/thinking high`, `/defcon 3`. These are slower but auditable — every configuration change is a committed event.

---

## 4. What Is Gained

The transformation also adds capabilities that the terminal does not have:

### Permanent Record

Every interaction is a GitHub issue comment with a permanent URL. Every state change is a git commit with a SHA. The terminal's conversation exists only in the local session file; the Fabric's conversation exists in the public (or private) repository.

### Multi-Participant

Terminal pi is a one-human, one-agent interaction. GitHub Issues supports multiple humans commenting, reviewing, reacting, and directing the agent. The Fabric's agent can serve a team, not just an individual.

### Asynchronous Operation

Terminal pi requires the human to be present at the keyboard. The Fabric's agent works when triggered — the human opens an issue, goes to lunch, and returns to find the work done. There is no requirement for real-time human presence.

### Code Review Integration

When pi edits code in the terminal, the changes are local. They must be manually committed and pushed. In the Fabric, code changes are committed automatically as part of the agent's response. They appear in diffs, can trigger CI, and can be reviewed through the standard pull request process.

### Access Control

Terminal pi inherits the user's filesystem permissions. Anyone at the keyboard has full access. The Fabric inherits GitHub's permission model — collaborator roles, branch protection, CODEOWNERS, required reviews. Access control is structural, not environmental.

### Audit Trail

Terminal pi's session file records what was said. The Fabric's commit graph records what was said **and what was done** — code changes, file modifications, configuration updates — all in the same auditable history.

---

## 5. The Four Modes, Reconsidered

Pi-coding-agent runs in four modes: interactive, print, JSON, and RPC. Each maps differently to the Fabric:

| Mode | Native Purpose | Fabric Mapping |
|------|---------------|----------------|
| **Interactive** | Human at terminal | ❌ Not applicable (no terminal in Actions) |
| **Print** | Single response, stdout | ✅ Single-turn: issue body → response comment |
| **JSON** | Event stream as JSONL | ✅ Structured output committed to session file |
| **RPC** | Process integration via stdin/stdout | ⚠️ Possible if the Fabric wraps pi as a subprocess |

The **print mode** is the most natural fit for the Fabric. The workflow passes the issue body (and comments) as input, pi processes and prints the response, and the Fabric captures the output as a comment and commits the session.

The **JSON mode** is useful for structured processing — the Fabric can parse the event stream to extract tool calls, token usage, and cost, committing them as structured metadata.

The **RPC mode** is the most powerful but also the most complex. OpenClaw uses RPC mode to integrate pi as a backend. The Fabric could do the same — running pi as a subprocess within the Actions workflow, communicating via JSONL over stdin/stdout. This enables multi-turn interactions within a single workflow run, at the cost of complexity.

---

## 6. Context Files in Both Worlds

Pi loads `AGENTS.md` files at startup — from the home directory, parent directories, and the current directory. These files provide project instructions, conventions, and common commands.

The Fabric also uses `AGENTS.md` — it is part of the committed repository state and loaded by the agent at each invocation. The mapping is direct:

| Pi Context File | Fabric Equivalent |
|----------------|-------------------|
| `~/.pi/agent/AGENTS.md` (global) | Not applicable (no persistent home directory) |
| Parent directory `AGENTS.md` files | Not applicable (the repo is the scope boundary) |
| Current directory `AGENTS.md` | `.github-fabric/AGENTS.md` (committed) |
| `.pi/SYSTEM.md` (project system prompt) | `.github-fabric/AGENTS.md` with system prompt section |
| `.pi/settings.json` (project settings) | `.github-fabric/config/settings.json` (committed) |

The Fabric's model is actually cleaner: there is one `AGENTS.md`, committed to the repository, defining the agent's identity and instructions. No global overrides, no directory walking, no layering. The committed file is the complete specification.

---

## 7. Summary

| Dimension | Terminal (Pi) | Repository (Fabric) | Assessment |
|-----------|---------------|---------------------|------------|
| **Latency** | Milliseconds | Minutes | Terminal wins |
| **Streaming** | Token-by-token | Complete response | Terminal wins |
| **Permanence** | Local session file | Git commits + issue comments | Fabric wins |
| **Participants** | One human | Many humans | Fabric wins |
| **Asynchronous** | No (requires presence) | Yes (trigger and wait) | Fabric wins |
| **Code review** | Manual commit/push | Automatic, integrated | Fabric wins |
| **Access control** | Filesystem permissions | GitHub permissions | Fabric wins |
| **Audit trail** | Session file | Full commit history | Fabric wins |
| **Steering** | Real-time interruption | Next-invocation comment | Terminal wins |
| **Navigation** | Interactive tree TUI | Git history | Terminal wins |
| **Configuration** | Keyboard shortcuts | Comment commands or committed config | Terminal wins (speed) / Fabric wins (auditability) |

The terminal is fast. The repository is permanent. The terminal is for the individual developer in the moment. The repository is for the team across time. Pi's transformation into the Fabric is the transformation from speech to writing — slower, more deliberate, and more durable.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

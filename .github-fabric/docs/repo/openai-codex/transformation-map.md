# Transformation Map

> [OpenAI Codex Index](./index.md) · [What Codex Teaches Fabric](./what-codex-teaches-fabric.md) · [Cost and Constraints](./cost-and-constraints.md)

> Codex is a compiled Rust binary with a legacy TypeScript CLI, an OS-level sandbox, and a non-interactive CI mode. The transformation from terminal tool to Fabric module is architecturally straightforward — Codex already has a headless mode — but the details reveal important choices about binary distribution, sandbox composition, and state management.

---

## 1. Source Plane

### 1.1 What Gets Ingested

| Component | Path | Size | Ingestion |
|-----------|------|------|-----------|
| Rust binary (pre-built) | Release artifact `codex-x86_64-unknown-linux-musl` | ~15 MB | Core — downloaded from GitHub Releases |
| AGENTS.md | `AGENTS.md` (repo root) | Variable | Core — read by Codex natively |
| .codex/ directory | `.codex/skills/` | Variable | Optional — project-specific skills |
| TypeScript SDK | `sdk/typescript/` | ~50 KB source | Optional — if programmatic API is needed |
| Shell Tool MCP | `shell-tool-mcp/` | ~30 KB source | Optional — if MCP integration is needed |
| System prompts | `codex-rs/core/prompt.md`, `*_prompt.md` | ~20–25 KB each | Reference — embedded in binary |
| Config schema | `codex-rs/core/config.schema.json` | ~70 KB | Reference — for configuration validation |
| Dockerfile | `codex-cli/Dockerfile` | ~1.5 KB | Optional — Linux sandbox base |

### 1.2 What Gets Excluded

| Component | Why |
|-----------|-----|
| Rust source (`codex-rs/`) | Pre-built binary used instead of compiling from source |
| Legacy TypeScript CLI (`codex-cli/`) | Superseded by Rust implementation |
| Bazel build files (`BUILD.bazel`, `MODULE.bazel`) | Not needed for pre-built binary |
| Development tooling (`.prettierrc`, `.codespellrc`, etc.) | Build-time only |
| `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Not needed for pre-built binary |
| `flake.nix`, `flake.lock` | Nix development environment, not runtime |
| Test fixtures and snapshot files | Validation-only |
| TUI frames and styles (`codex-rs/tui/`) | Terminal UI, not needed in headless mode |

### 1.3 Ingestion Strategy: Pre-Built Binary

Codex's Rust architecture enables an ingestion strategy unavailable to any previous Fabric module: **pre-built binary distribution.**

```
Source repo (openai/codex)
        │
        ▼ Download release artifact
.GITCODEX/
  bin/codex                  ← Pre-built Linux binary (~15 MB)
  config/                    ← Fabric-specific configuration
  state/                     ← Runtime state (transcripts, memory)
  lifecycle/                 ← Preflight, invocation, postflight
```

Unlike NanoClaw (which requires `npm install` + `tsc`) or OpenClaw (which requires `pnpm install` of 100+ packages), Codex requires **zero build steps** at invocation time. The binary is downloaded once from GitHub Releases and cached.

This is the Fabric's first zero-build module.

---

## 2. Transformation Plane

### 2.1 Interface Replacement

The primary transformation: replace the terminal REPL with GitHub Issues.

| Codex Native | Fabric Expression |
|-------------|-------------------|
| Terminal REPL (`codex`) | Not used — headless mode only |
| Interactive prompt | Issue body or comment text |
| `codex "task"` (command-line prompt) | Issue opened with task description |
| `codex -q "task"` (non-interactive) | Workflow invocation with issue context |
| Streaming terminal output | Issue comment posted on completion |
| `--approval-mode full-auto` | Default for Fabric invocation (governed by DEFCON) |
| User keyboard confirmation | Issue comment approval (DEFCON 4) or automatic (DEFCON 5) |
| Terminal diff display | Committed diff (viewable in git history) |

### 2.2 Configuration Mapping

| Codex Config | Source | Fabric Expression |
|-------------|--------|-------------------|
| `OPENAI_API_KEY` | Environment variable / `.env` | GitHub Secret `OPENAI_API_KEY` |
| `--model` / `config.yaml:model` | CLI flag / config file | `config/settings.json` → `model` |
| `--approval-mode` | CLI flag / config file | Derived from DEFCON level |
| `--provider` | CLI flag / config file | `config/settings.json` → `provider` |
| `AGENTS.md` (global) | `~/.codex/AGENTS.md` | Not available on runner; repo-level AGENTS.md used instead |
| `AGENTS.md` (repo) | Repo root | Preserved as-is (Codex reads it natively) |
| `.codex/skills/` | Repo `.codex/` directory | Preserved as-is (Codex reads it natively) |
| `CODEX_QUIET_MODE` | Environment variable | Always set to `1` in workflow (headless) |

### 2.3 State Serialization

Codex does not persist state natively (session state is volatile). The Fabric adds state management:

| State Type | Codex Native | Fabric Expression |
|-----------|-------------|-------------------|
| Conversation history | Local history file (optional) | `state/transcripts/{issue-number}.jsonl` |
| Agent output | Terminal stdout | Issue comment + `state/responses/{issue-number}.md` |
| File modifications | Direct file writes (in working directory) | Committed diffs in repository |
| Error logs | Terminal stderr / `DEBUG=true` output | `state/logs/{issue-number}.log` |

---

## 3. Execution Plane

### 3.1 Workflow Structure

```yaml
name: Codex Agent
on:
  issues:
    types: [opened]
  issue_comment:
    types: [created]

jobs:
  invoke:
    runs-on: ubuntu-latest
    if: |
      !contains(github.event.comment.user.login, '[bot]') &&
      contains(github.event.issue.labels.*.name, 'codex')
    steps:
      - uses: actions/checkout@v4

      - name: Preflight
        run: .GITCODEX/lifecycle/preflight.sh

      - name: Download Codex binary (cached)
        uses: actions/cache@v4
        with:
          path: .GITCODEX/bin/codex
          key: codex-${{ hashFiles('.GITCODEX/config/version') }}
          restore-keys: codex-
      
      - name: Fetch binary if not cached
        if: steps.cache.outputs.cache-hit != 'true'
        run: |
          VERSION=$(cat .GITCODEX/config/version)
          curl -sL "https://github.com/openai/codex/releases/download/${VERSION}/codex-x86_64-unknown-linux-musl.tar.gz" \
            | tar xz -C .GITCODEX/bin/
          chmod +x .GITCODEX/bin/codex

      - name: Invoke Codex
        run: |
          .GITCODEX/bin/codex \
            --approval-mode full-auto \
            --quiet \
            "$TASK"
        env:
          TASK: ${{ github.event.comment.body || github.event.issue.body }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          CODEX_QUIET_MODE: "1"

      - name: Commit state
        run: |
          git add -A
          git diff --cached --quiet || \
            git commit -m "codex: issue #${{ github.event.issue.number }}"
          git push

      - name: Post response
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const issueNumber = context.issue.number;
            const responsePath = `.GITCODEX/state/responses/${issueNumber}.md`;
            let body = '✅ Codex completed the task. See the commit diff for changes.';
            if (fs.existsSync(responsePath)) {
              body = fs.readFileSync(responsePath, 'utf8');
            }
            await github.rest.issues.createComment({
              ...context.repo,
              issue_number: issueNumber,
              body: body
            });
```

### 3.2 Invocation Flow

```
Issue opened/commented
        │
        ▼
Workflow triggered
        │
        ▼
Preflight checks
  • Sentinel file exists?
  • DEFCON level permits execution?
  • Collaborator check?
        │
        ▼
Binary download (cached)
  • ~15 MB pre-built Rust binary
  • Cached between invocations
  • No build step required
        │
        ▼
Codex executes (headless)
  • --approval-mode full-auto
  • --quiet (no terminal UI)
  • Reads repo AGENTS.md
  • Reads .codex/skills/
  • Sandbox active (if Docker available)
  • Modifies files in working directory
        │
        ▼
State committed to git
  • File modifications
  • Transcript logs
  • Response markdown
        │
        ▼
Response posted to issue
```

---

## 4. Directory Structure

```
.GITCODEX/
├── README.md                           ← Module documentation
├── GITCODEX-ENABLED.md                 ← Sentinel file (presence = active)
├── bin/
│   └── codex                           ← Pre-built Rust binary (~15 MB)
├── config/
│   ├── settings.json                   ← Model, provider, DEFCON, limits
│   └── version                         ← Codex release version to track
├── lifecycle/
│   ├── preflight.sh                    ← Sentinel + DEFCON + collaborator checks
│   ├── invoke.sh                       ← Binary execution with env setup
│   └── postflight.sh                   ← State commit + response posting
├── state/
│   ├── transcripts/
│   │   └── {issue-number}.jsonl        ← Conversation transcripts
│   ├── responses/
│   │   └── {issue-number}.md           ← Agent responses
│   └── logs/
│       └── {issue-number}.log          ← Execution logs
└── tests/
    └── phase0.test.js                  ← Structural validation
```

Note: `AGENTS.md` and `.codex/skills/` live at the repository root (not inside `.GITCODEX/`), where Codex expects to find them natively.

---

## 5. Transformation Comparison

| Dimension | OpenClaw Transformation | NanoClaw Transformation | Codex Transformation |
|-----------|------------------------|------------------------|---------------------|
| **Source size** | ~500 MB monorepo | ~125 KB source | ~15 MB binary |
| **Build time** | 1–3 min (pnpm workspace) | ~30s (single tsc) | 0s (pre-built binary) |
| **Dependencies** | 100+ npm packages | 6 npm packages | 0 (compiled into binary) |
| **Channel surgery** | Remove 22 implementations | Remove registry, add handler | Replace REPL with headless mode |
| **State migration** | SQLite + vectors → committed files | SQLite → committed files | No native state → add committed files |
| **Config normalization** | 53 config files → JSON | 0 configs → JSON (creation) | TOML/YAML config → JSON (mapping) |
| **Sandbox strategy** | Build container from Dockerfile | Reuse existing Dockerfile | Codex sandbox runs natively |
| **Runtime** | Node.js (interpreted) | Node.js (interpreted) | Rust binary (compiled) |

Codex's transformation is the simplest the Fabric has produced — simpler even than NanoClaw's. The pre-built binary eliminates the entire build phase. The existing headless mode eliminates the interface transformation. The existing AGENTS.md support eliminates the configuration migration. What remains is plumbing: connecting GitHub Issues to Codex's input and connecting Codex's output to git commits.

---

## 6. Summary

| Phase | What Happens | Complexity |
|-------|-------------|------------|
| **Source** | Download pre-built binary (~15 MB) | Minimal — no build, no dependencies |
| **Transform: Interface** | Replace terminal REPL with headless mode | None — `codex -q` already exists |
| **Transform: Config** | Map environment to workflow secrets | Low — straightforward env mapping |
| **Transform: State** | Add committed transcripts and responses | Low — create state directory structure |
| **Transform: AGENTS.md** | Preserve as-is | None — Codex reads it natively |
| **Execute: Workflow** | Event-triggered workflow with binary invocation | Standard Fabric pattern |
| **Execute: State commit** | Git add + commit + push in postflight | Standard Fabric pattern |

Codex is the Fabric's zero-build module. Every previous transformation spent significant effort on dependency installation, compilation, or container builds. Codex arrives as a single binary. The transformation is not architectural surgery — it is integration plumbing. This is what happens when the source agent was already designed for headless, sandboxed, repository-aware execution.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

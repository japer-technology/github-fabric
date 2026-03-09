# Transformation Map

> [NanoClaw Index](./index.md) · [What NanoClaw Teaches Fabric](./what-nanoclaw-teaches-fabric.md) · [Cost and Constraints](./cost-and-constraints.md)

> NanoClaw is the lightest agent the Fabric has transformed. The Source → Transformation → Execution pipeline is correspondingly minimal — but the minimalism reveals the Fabric's essential structure more clearly than any complex case.

---

## 1. Source Plane

### 1.1 What Gets Ingested

NanoClaw's source is a single Node.js repository with a flat structure:

| Component | Path | Size | Ingestion |
|-----------|------|------|-----------|
| Orchestrator | `src/index.ts` | ~18 KB | Core — required |
| Container runner | `src/container-runner.ts` | ~22 KB | Core — required |
| Database layer | `src/db.ts` | ~20 KB | Core — required |
| IPC handler | `src/ipc.ts` | ~15 KB | Core — required |
| Group queue | `src/group-queue.ts` | ~11 KB | Core — required |
| Mount security | `src/mount-security.ts` | ~11 KB | Core — required |
| Task scheduler | `src/task-scheduler.ts` | ~8 KB | Core — required |
| Container runtime detection | `src/container-runtime.ts` | ~4 KB | Core — required |
| Credential proxy | `src/credential-proxy.ts` | ~4 KB | Core — required |
| Sender allowlist | `src/sender-allowlist.ts` | ~3 KB | Core — required |
| Types | `src/types.ts` | ~3 KB | Core — required |
| Config | `src/config.ts` | ~2 KB | Transform — Fabric config replaces |
| Router | `src/router.ts` | ~1 KB | Transform — issue routing replaces channel routing |
| Channel registry | `src/channels/registry.ts` | Variable | Transform — GitHub Issues replaces channel system |
| Container Dockerfile | `container/Dockerfile` | ~2 KB | Core — required for container builds |
| Container agent runner | `container/agent-runner/` | Variable | Core — required |
| Container skills | `container/skills/` | Variable | Selective — browser, web tools |
| Group memory | `groups/*/CLAUDE.md` | Variable | Direct — committed as-is |
| Test files | `src/*.test.ts` | ~60 KB total | Validation — run in CI |
| Skills definitions | `.claude/skills/` | Variable | Reference — not ingested at runtime |

### 1.2 What Gets Excluded

| Component | Why |
|-----------|-----|
| Channel implementations (WhatsApp, Telegram, etc.) | Replaced by GitHub Issues |
| `launchd/` and systemd configs | Replaced by GitHub Actions workflow |
| `setup/` and `setup.sh` | Replaced by Fabric installation |
| `.husky/` pre-commit hooks | Replaced by Fabric CI |
| `.prettierrc`, `.nvmrc` | Development tooling, not runtime |
| `scripts/` (apply-skill, fix-drift, etc.) | Skill infrastructure, not needed in Fabric |
| `package-lock.json` | Regenerated during build |

### 1.3 Ingestion Strategy

NanoClaw's small size enables an ingestion strategy unavailable to larger agents: **full-source ingestion.**

```
Source repo (qwibitai/nanoclaw)
        │
        ▼ Clone + selective copy
.GITNANOCLAW/
  upstream/           ← Full source (minus excluded paths)
  config/             ← Fabric-specific configuration
  container/          ← Container build context
  state/              ← Runtime state (groups, sessions, memory)
  lifecycle/          ← Preflight, postflight, invocation scripts
```

Unlike OpenClaw (where selective ingestion is necessary due to size), NanoClaw can be ingested whole. The full source — all ~125 KB of it — fits comfortably within repository limits and build budgets.

---

## 2. Transformation Plane

### 2.1 Channel Replacement

The primary transformation: replace NanoClaw's multi-channel system with GitHub Issues.

| NanoClaw Native | Fabric Expression |
|----------------|-------------------|
| `src/channels/registry.ts` — auto-discovers channel implementations | Single channel: GitHub Issues via webhook/event |
| WhatsApp, Telegram, Discord, Slack, Gmail | Issue opened → trigger; issue comment → continuation |
| Trigger word (`@Andy`) in message body | Issue label or mention in comment |
| Per-channel message formatting | Markdown in issue comments |
| Typing indicators, reactions, presence | 👀 reaction on issue, comment when complete |
| Multi-channel routing | Not needed (single channel) |

### 2.2 State Serialization

NanoClaw uses SQLite for all persistent state. The Fabric serializes this to committed files:

| NanoClaw State | SQLite Table | Fabric Expression |
|---------------|-------------|-------------------|
| Messages | `messages` | Not stored (GitHub Issues is the message log) |
| Groups | `groups` | `state/groups/` directory structure |
| Sessions | `sessions` | `state/sessions/{group}/session.jsonl` |
| Tasks | `tasks` | `state/tasks/tasks.json` |
| Task runs | `task_runs` | `state/tasks/runs/{id}.json` |
| Group memory | `groups/*/CLAUDE.md` | `state/groups/{name}/CLAUDE.md` (committed directly) |

### 2.3 Container Build

NanoClaw's container is built from `container/Dockerfile`. In the Fabric:

```yaml
# .GITNANOCLAW/lifecycle/build-container.sh
docker build -t nanoclaw-agent ./container/
```

The container image is built once per upstream update (or cached). Each invocation uses the pre-built image.

### 2.4 Configuration Mapping

| NanoClaw Config | Source | Fabric Expression |
|----------------|--------|-------------------|
| `ASSISTANT_NAME` | `.env` | `config/settings.json` → `assistantName` |
| `ANTHROPIC_API_KEY` | `.env` | GitHub Secret `ANTHROPIC_API_KEY` |
| `ANTHROPIC_MODEL` | `.env` | `config/settings.json` → `model` |
| `POLL_INTERVAL` | `src/config.ts` | Not needed (event-driven, not polling) |
| `CONTAINER_RUNTIME` | Auto-detected | `config/settings.json` → `containerRuntime: "docker"` |
| `GROUP_CONCURRENCY_LIMIT` | `src/config.ts` | `config/settings.json` → `concurrencyLimit` |
| Mount allowlist | `~/.config/nanoclaw/mount-allowlist.json` | `config/mount-policy.json` (committed) |
| Blocked patterns | Hardcoded in `src/mount-security.ts` | `config/blocked-patterns.json` (committed) |

---

## 3. Execution Plane

### 3.1 Workflow Structure

```yaml
name: NanoClaw Agent
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
      contains(github.event.issue.labels.*.name, 'nanoclaw')
    steps:
      - uses: actions/checkout@v4
      
      - name: Preflight
        run: .GITNANOCLAW/lifecycle/preflight.sh
      
      - name: Build container (cached)
        uses: docker/build-push-action@v5
        with:
          context: .GITNANOCLAW/container/
          load: true
          tags: nanoclaw-agent:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Start credential proxy
        run: .GITNANOCLAW/lifecycle/start-proxy.sh
      
      - name: Invoke agent
        run: .GITNANOCLAW/lifecycle/invoke.sh
        env:
          ISSUE_NUMBER: ${{ github.event.issue.number }}
          COMMENT_BODY: ${{ github.event.comment.body }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      
      - name: Commit state
        run: |
          cd .GITNANOCLAW/state
          git add -A
          git diff --cached --quiet || git commit -m "state: issue #${{ github.event.issue.number }}"
          git push
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
Container build (cached)
        │
        ▼
Credential proxy started (host side)
        │
        ▼
Agent container spawned
  • Group memory mounted (read-write)
  • Project root mounted (read-only)
  • Credential proxy URL injected
  • Issue context passed as prompt
        │
        ▼
Claude Agent SDK executes
  • Reads group CLAUDE.md
  • Processes issue/comment
  • Uses tools (web, browser, file ops)
  • Writes response
        │
        ▼
Response posted to issue
        │
        ▼
State committed to git
  • Updated group memory
  • Session transcript
  • Task state (if modified)
        │
        ▼
Container destroyed
```

### 3.3 Scheduled Tasks

NanoClaw's task scheduler maps to GitHub Actions `schedule` triggers:

| NanoClaw Task Type | Fabric Expression |
|-------------------|-------------------|
| Cron expression | GitHub Actions `schedule` with cron syntax |
| Interval (ms) | Not directly supported — approximate with cron |
| One-time (ISO timestamp) | GitHub Actions `schedule` for nearest minute + state check |

```yaml
on:
  schedule:
    - cron: '0 9 * * 1-5'  # Weekday morning briefing
```

Scheduled tasks run the same invocation flow but without an issue context — instead, the task definition from `state/tasks/tasks.json` provides the prompt.

---

## 4. Directory Structure

```
.GITNANOCLAW/
├── README.md                           ← Module documentation
├── GITNANOCLAW-ENABLED.md              ← Sentinel file (presence = active)
├── config/
│   ├── settings.json                   ← Model, assistant name, DEFCON, limits
│   ├── mount-policy.json               ← Allowed mount paths
│   └── blocked-patterns.json           ← Blocked credential patterns
├── container/
│   ├── Dockerfile                      ← Agent container definition
│   ├── agent-runner/                   ← Container entry point
│   └── skills/                         ← In-container skills (browser, etc.)
├── upstream/
│   └── src/                            ← NanoClaw source (selectively copied)
├── lifecycle/
│   ├── preflight.sh                    ← Sentinel + DEFCON + collaborator checks
│   ├── invoke.sh                       ← Container spawn + agent execution
│   ├── start-proxy.sh                  ← Credential proxy launch
│   ├── postflight.sh                   ← State commit + cleanup
│   └── build-container.sh              ← Container image build
├── state/
│   ├── groups/
│   │   ├── main/
│   │   │   └── CLAUDE.md               ← Main group memory
│   │   └── global/
│   │       └── CLAUDE.md               ← Global memory
│   ├── sessions/
│   │   └── {group}/
│   │       └── session.jsonl           ← Session transcripts
│   ├── tasks/
│   │   ├── tasks.json                  ← Task definitions
│   │   └── runs/
│   │       └── {id}.json              ← Task execution records
│   └── memory.log                      ← Append-only memory
└── tests/
    └── phase0.test.js                  ← Structural validation
```

---

## 5. Transformation Comparison

| Dimension | OpenClaw Transformation | NanoClaw Transformation |
|-----------|------------------------|------------------------|
| **Source size** | ~500 MB monorepo | ~125 KB source |
| **Build time** | 1–3 min (pnpm workspace) | ~30s (single tsc) |
| **Dependencies** | 100+ npm packages | 6 npm packages |
| **Channel surgery** | Remove 22 channel implementations | Remove channel registry, add issue handler |
| **State migration** | SQLite + vector embeddings → committed files | SQLite → committed files (simpler schema) |
| **Config normalization** | 53 config files → committed JSON | 0 config files → committed JSON (creation, not normalization) |
| **Container strategy** | Build from complex Dockerfile | Build from minimal Dockerfile (already exists) |
| **Test adaptation** | Adapt Vitest suite for Actions | Adapt Vitest suite for Actions (same approach, less work) |

NanoClaw's transformation is an order of magnitude simpler than OpenClaw's. This confirms the [githubification lesson](https://github.com/japer-technology/githubification/blob/main/.githubification/lesson-from-nanoclaw.md)'s core insight: "The best agent to Githubify is one that was already designed to be understood by an AI."

---

## 6. Summary

| Phase | What Happens | Complexity |
|-------|-------------|------------|
| **Source** | Full-source ingestion (~125 KB) | Minimal — fits in one checkout |
| **Transform: Channels** | Replace multi-channel with GitHub Issues | Moderate — remove registry, add issue handler |
| **Transform: State** | Serialize SQLite to committed files | Moderate — JSONL sessions, JSON tasks |
| **Transform: Config** | Create committed config from zero-config source | Low — create settings.json, mount-policy.json |
| **Transform: Container** | Reuse existing Dockerfile with minor adjustments | Low — already designed for ephemeral containers |
| **Execute: Workflow** | Event-triggered workflow with container steps | Standard Fabric pattern |
| **Execute: Proxy** | Credential proxy on runner host | Direct reuse from NanoClaw |
| **Execute: State commit** | Git add + commit + push in postflight | Standard Fabric pattern |

NanoClaw's transformation map is the simplest the Fabric has produced. This is not because NanoClaw lacks capability — it provides multi-channel messaging, container isolation, scheduled tasks, agent swarms, and persistent memory. It is because NanoClaw's architecture already aligns with the Fabric's assumptions: ephemeral containers, serializable state, event-driven execution, and minimal complexity.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

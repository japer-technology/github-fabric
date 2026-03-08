# Transformation Map

> [OpenClaw Index](./index.md) · [Skills and Extensions](./skills-and-extensions.md) · [Cost and Constraints](./cost-and-constraints.md)

> The Source → Transformation → Execution pipeline for OpenClaw is the most complex the Fabric has attempted. This document maps the concrete plan.

---

## 1. Source Plane: The Genetic Material

### What Gets Ingested

The OpenClaw monorepo is the upstream genome. The Fabric ingests it **as a whole** — not as individual extensions or skills.

| Component | Path | Size (approx.) | Ingestion Method |
|-----------|------|----------------|------------------|
| Core runtime | `src/` | ~150 files | Clone from source, build |
| Extensions | `extensions/` | 35+ packages | Clone, selectively enable |
| Skills | `skills/` | 52+ directories | Clone, selectively activate |
| Config schemas | `*.schema.json` | Small | Clone, reference |
| Build pipeline | `tsdown.config.ts`, scripts | Small | Clone, execute at build |
| Dependencies | `pnpm-lock.yaml` | ~10K lines | `pnpm install` |
| Native apps | `apps/` | Large | **Culled** (not applicable) |
| Docs | `docs/` | Medium | **Culled** (not needed at runtime) |
| Tests | `test/`, `*.test.ts` | Medium | **Culled** (not needed at runtime) |
| Docker files | `Dockerfile*` | Small | **Culled** (Actions uses bare runner) |

### What Gets Culled

The cull rules for OpenClaw are more aggressive than for simpler modules because the upstream contains large components irrelevant to the Fabric context:

```yaml
# Conceptual cull manifest
cull:
  directories:
    - apps/                    # macOS/iOS/Android apps
    - docs/                    # Mintlify documentation (not runtime)
    - test/                    # Test infrastructure
    - test-fixtures/           # Test data
    - patches/                 # Dev patches
    - git-hooks/               # Local dev hooks
    - .vscode/                 # IDE config
    - .github/                 # Upstream CI (replaced by Fabric workflows)
    - Swabble/                 # Internal tooling
    - ui/                      # Control UI (not needed headless)
  files:
    - Dockerfile*              # Docker configs
    - docker-*                 # Docker helpers
    - fly.toml                 # Fly.io deploy
    - render.yaml              # Render deploy
    - "*.config.ts"            # Vitest configs (test infra)
    - pyproject.toml           # Python tooling
    - .pre-commit-config.yaml  # Dev hooks
    - zizmor.yml               # Security scanner config
  extensions:
    # Channel extensions not needed in Fabric
    - extensions/whatsapp
    - extensions/telegram
    - extensions/slack
    - extensions/discord
    - extensions/signal
    - extensions/bluebubbles
    - extensions/imessage
    - extensions/irc
    - extensions/msteams
    - extensions/matrix
    - extensions/feishu
    - extensions/line
    - extensions/mattermost
    - extensions/nextcloud-talk
    - extensions/nostr
    - extensions/synology-chat
    - extensions/tlon
    - extensions/twitch
    - extensions/zalo
    - extensions/zalouser
    - extensions/googlechat
    # Device/voice extensions not applicable
    - extensions/talk-voice
    - extensions/voice-call
    - extensions/phone-control
    - extensions/device-pair
    # Auth portal extensions (use GitHub secrets instead)
    - extensions/google-gemini-cli-auth
    - extensions/minimax-portal-auth
    - extensions/qwen-portal-auth
```

### What Gets Kept

| Component | Why |
|-----------|-----|
| `src/` core runtime | The agent's reasoning engine |
| `extensions/memory-core` | Semantic memory |
| `extensions/memory-lancedb` | Vector memory backend |
| `extensions/llm-task` | Sub-task delegation |
| `extensions/diffs` | Diff analysis |
| `extensions/lobster` | Advanced reasoning |
| `extensions/open-prose` | Text generation |
| `extensions/copilot-proxy` | Model proxy |
| `extensions/shared` | Shared extension library |
| `extensions/test-utils` | Runtime test utilities |
| `extensions/thread-ownership` | Thread management |
| `extensions/acpx` | Extended capabilities |
| `extensions/diagnostics-otel` | Observability |
| `skills/coding-agent` | Code generation |
| `skills/gh-issues` | Issue management |
| `skills/github` | GitHub operations |
| `skills/summarize` | Summarization |
| `skills/clawhub` | Skill discovery |
| `package.json`, `pnpm-workspace.yaml` | Dependency management |
| `tsconfig.json`, `tsdown.config.ts` | Build config |

---

## 2. Transformation Plane: Normalization

### Build Pipeline

The Fabric's transformation of OpenClaw requires a multi-stage build:

```
1. Clone upstream → .GITOPENCLAW/repo/openclaw/openclaw/  (gitignored)
2. Apply cull rules → remove unnecessary directories/files
3. pnpm install → install dependencies
4. pnpm build → compile TypeScript, bundle A2UI, generate plugin SDK
5. Validate build → check for missing exports, runtime errors
6. Configure → write Fabric-specific settings to config
```

This is significantly more complex than GMI's build (which is just `bun install`). The total build time on an Actions runner is approximately 2–4 minutes, depending on cache hits for `node_modules`.

### Configuration Normalization

OpenClaw's native configuration (`~/.config/openclaw/config.yaml` or environment variables) must be replaced with committed Fabric configuration:

| OpenClaw Config | Fabric Equivalent |
|----------------|-------------------|
| `~/.config/openclaw/config.yaml` | `.GITOPENCLAW/config/settings.json` (committed) |
| Environment variable `OPENAI_API_KEY` | GitHub secret `OPENAI_API_KEY` |
| Environment variable `ANTHROPIC_API_KEY` | GitHub secret `ANTHROPIC_API_KEY` |
| `gateway.bind: loopback` | Not applicable (no persistent Gateway) |
| `gateway.port: 18789` | Not applicable |
| `channels.*` config | Not applicable (single-channel) |
| `dmPolicy: pairing` | Not applicable (GitHub permissions replace DM pairing) |
| `model: claude-sonnet-4-20250514` | `.GITOPENCLAW/config/settings.json` `model` field |
| `thinkingLevel: high` | `.GITOPENCLAW/config/settings.json` `thinkingLevel` field |

### Session Model Normalization

| OpenClaw Native | Fabric Expression |
|----------------|-------------------|
| In-memory session objects | JSONL files in `.GITOPENCLAW/state/sessions/` |
| Session IDs | Generated per-issue, mapped in `.GITOPENCLAW/state/issues/<n>.json` |
| Pruning (automatic, in-memory) | Pruning at invocation time (load, prune, send, commit) |
| Group sessions | Not applicable (each issue is its own session) |
| Multi-channel sessions | Not applicable (single-channel) |

### Tool Surface Normalization

OpenClaw's 30+ tools are filtered for the Fabric context:

| Tool Category | Available in Fabric? | Notes |
|--------------|---------------------|-------|
| **File operations** (read, write, edit) | ✅ Yes | Core agent capability |
| **Code search** (grep, glob) | ✅ Yes | Core agent capability |
| **Browser automation** | ✅ Yes | Headless Chromium on Actions runner |
| **Web search / fetch** | ✅ Yes | Network egress available |
| **Memory search** | ✅ Yes | Memory committed to state |
| **Sub-agent orchestration** | ✅ Yes | Sequential agent chains on same runner |
| **Bash execution** | ✅ Yes | Full shell access on runner |
| **Canvas rendering** | ❌ No | No display on Actions runner |
| **Camera / screen recording** | ❌ No | No device peripherals |
| **Voice (TTS / STT)** | ❌ No | No audio surface |
| **Device control** | ❌ No | No companion device |
| **Cron scheduling** | ⚠️ Partial | Use Actions `schedule:` trigger instead |
| **Session tools** (sessions_list, sessions_send) | ⚠️ Partial | Single session per invocation |

The tool surface reduction is approximately 30+ → 20+ usable tools. The most important tools for repository work are all available.

---

## 3. Execution Plane: The Lifecycle Pipeline

### Workflow Structure

The Fabric's execution of OpenClaw follows the standard lifecycle pipeline:

```yaml
name: OpenClaw Agent
on:
  issues:
    types: [opened]
  issue_comment:
    types: [created]

jobs:
  agent:
    runs-on: ubuntu-latest
    steps:
      # 1. Guard
      - name: Check sentinel
        run: node .GITOPENCLAW/lifecycle/GITOPENCLAW-ENABLED.ts

      # 2. Validate
      - name: Preflight
        run: node .GITOPENCLAW/lifecycle/GITOPENCLAW-PREFLIGHT.ts

      # 3. Indicate
      - name: Add reaction
        run: node .GITOPENCLAW/lifecycle/GITOPENCLAW-INDICATOR.ts

      # 4. Build
      - name: Install and build OpenClaw
        run: |
          cd .GITOPENCLAW/repo/openclaw/openclaw
          pnpm install --frozen-lockfile
          pnpm build

      # 5. Execute
      - name: Run agent
        run: node .GITOPENCLAW/lifecycle/GITOPENCLAW-AGENT.ts
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      # 6. Commit
      - name: Commit state
        run: |
          git add .GITOPENCLAW/state/
          git commit -m "agent: respond to issue #${{ github.event.issue.number }}"
          git push
```

### Lifecycle Steps

| Step | Script | Duration | Purpose |
|------|--------|----------|---------|
| **Guard** | `GITOPENCLAW-ENABLED.ts` | <1s | Fail-closed sentinel check |
| **Validate** | `GITOPENCLAW-PREFLIGHT.ts` | <2s | Config present? Secrets set? Permissions OK? |
| **Indicate** | `GITOPENCLAW-INDICATOR.ts` | <1s | 👀 reaction on the issue |
| **Build** | `pnpm install && pnpm build` | 2–4 min | Full OpenClaw build from source |
| **Execute** | `GITOPENCLAW-AGENT.ts` | 30–120s | Load session, invoke agent, post reply |
| **Commit** | `git add && commit && push` | 5–15s | Persist session state to git |
| **Total** | | **3–7 min** | End-to-end response time |

### Concurrency Model

Multiple issues may trigger simultaneously. Each invocation:

1. Gets a unique concurrency group: `openclaw-issue-${{ github.event.issue.number }}`
2. Uses a push-retry loop with `git pull --rebase` (up to 10 attempts with exponential backoff)
3. Only modifies files under `.GITOPENCLAW/state/` (no conflicts with human commits)
4. Uses `memory.log` with `merge=union` git attribute for concurrent memory writes

---

## 4. Provenance Chain

Every interaction is fully traceable:

```
Issue #42 comment by @developer
  → Workflow run #12345 (pinned to workflow SHA)
    → OpenClaw upstream SHA abc123 (pinned in .GITOPENCLAW config)
      → Model: claude-sonnet-4-20250514 (committed config)
        → Session: .GITOPENCLAW/state/sessions/sess-42-abc.jsonl
          → Response: issue comment + state commit (SHA def456)
```

The provenance chain links:

1. **Human intent** (issue comment) to
2. **Workflow execution** (Actions run) to
3. **Upstream version** (OpenClaw SHA) to
4. **Model selection** (committed config) to
5. **Agent reasoning** (session transcript) to
6. **Output** (issue reply + committed state)

This is stronger provenance than any standalone OpenClaw instance can provide.

---

## 5. Summary

| Phase | Input | Output | Complexity |
|-------|-------|--------|-----------|
| **Source** | OpenClaw monorepo (500 MB+) | Culled repo (core + essential extensions + selected skills) | High — aggressive cull of 22 channels, apps, docs |
| **Transform** | Raw source + cull rules | Built runtime + Fabric config + normalized sessions | High — multi-stage build, config normalization |
| **Execute** | Issue event + committed state | Agent response + updated state commit | Medium — standard lifecycle pipeline |
| **Provenance** | All of the above | Traceable chain from human intent to committed output | Complete — every step is auditable |

The OpenClaw transformation map is the Fabric's most complex. It demonstrates that the Source → Transformation → Execution pipeline can handle a production-grade AI platform, not just lightweight agents. The cost is build time (~2–4 minutes per invocation) and configuration complexity (cull rules, extension selection, skill activation). The gain is the full intelligence of a 30+-tool AI assistant, governed by the Fabric's provenance and governance model.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

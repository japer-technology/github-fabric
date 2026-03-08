# Skills and Extensions

> [OpenClaw Index](./index.md) · [Transformation Map](./transformation-map.md) · [What OpenClaw Teaches Fabric](./what-openclaw-teaches-fabric.md)

> OpenClaw's plugin architecture is the most mature module composition system the Fabric has encountered. It reveals what "modules within modules" means — and why the Fabric's own module model benefits from the comparison.

---

## 1. The Extension Architecture

OpenClaw separates capabilities into three layers:

### Core Runtime (`src/`)

The Gateway, agent runtime, session management, CLI, media pipeline, and routing logic. This is the non-negotiable substrate — the minimum that must exist for anything to work.

### Extensions (`extensions/`)

35+ workspace packages that add channels, tools, and capabilities:

| Category | Extensions |
|----------|-----------|
| **Channels** | whatsapp, telegram, slack, discord, googlechat, signal, bluebubbles, imessage, irc, msteams, matrix, feishu, line, mattermost, nextcloud-talk, nostr, synology-chat, tlon, twitch, zalo, zalouser |
| **Tools** | llm-task, lobster, open-prose, phone-control, talk-voice, voice-call |
| **Memory** | memory-core, memory-lancedb |
| **Infrastructure** | acpx, copilot-proxy, device-pair, diagnostics-otel, diffs, thread-ownership |
| **Auth** | google-gemini-cli-auth, minimax-portal-auth, qwen-portal-auth |
| **Testing** | test-utils, shared |

Each extension is a self-contained pnpm workspace package with:

- Its own `package.json` (dependencies isolated from core)
- Its own source code (`src/`)
- Its own tests (colocated `*.test.ts`)
- A plugin manifest or entry point that registers with the Gateway

### Skills (`skills/`)

52+ skill directories providing domain-specific capabilities:

| Category | Examples |
|----------|---------|
| **Productivity** | apple-notes, apple-reminders, bear-notes, notion, obsidian, things-mac, trello |
| **Development** | coding-agent, gh-issues, github, skill-creator |
| **Communication** | discord, slack, imsg, wacli |
| **Media** | camsnap, gifgrep, songsee, spotify-player, video-frames |
| **System** | blucli, eightctl, tmux, healthcheck |
| **AI/LLM** | gemini, oracle, sag, summarize |
| **Other** | weather, goplaces, openhue, nano-banana-pro, blogwatcher |

Skills are lighter than extensions. They typically provide markdown instructions and tool definitions that the agent loads at invocation time, rather than runtime code that hooks into the Gateway.

---

## 2. The Composition Model

OpenClaw's architecture is a three-layer cake:

```
┌─────────────────────────────────────────────────────┐
│                    Skills (52+)                      │
│  (Markdown instructions + tool definitions)         │
├─────────────────────────────────────────────────────┤
│                  Extensions (35+)                    │
│  (TypeScript packages with runtime hooks)           │
├─────────────────────────────────────────────────────┤
│                  Core Runtime                        │
│  (Gateway, agent, sessions, CLI, media)             │
└─────────────────────────────────────────────────────┘
```

Each layer can be modified independently:

- Adding a skill does not require rebuilding the core.
- Adding an extension requires workspace installation but not core modification.
- Core changes may affect extensions but should not affect skills.

The [VISION.md](https://github.com/openclaw/openclaw/blob/main/VISION.md) makes the design philosophy explicit:

> Core stays lean; optional capability should usually ship as plugins.
> New skills should be published to ClawHub first, not added to core by default.
> Core skill additions should be rare and require a strong product or security reason.

This is a **centrifugal design** — capability is pushed outward from core to extensions to skills to the community registry (ClawHub). The core resists growth. Only what must be in core stays in core.

---

## 3. What This Means for the Fabric

The Fabric's module model treats each upstream repo as a single module with one invocation surface. OpenClaw's internal module composition challenges this in two ways:

### 3.1 Modules Within Modules

When the Fabric ingests OpenClaw, it ingests not one capability but a **capability tree**:

```
Fabric Module: openclaw
├── Core (gateway, agent, sessions)
├── Extensions
│   ├── memory-core (semantic memory)
│   ├── llm-task (LLM sub-tasks)
│   ├── diffs (diff analysis)
│   └── ... (35+ more)
└── Skills
    ├── coding-agent (code generation/review)
    ├── gh-issues (GitHub issue management)
    ├── github (GitHub integration)
    └── ... (52+ more)
```

The Fabric's invocation surface must decide:

- **Do all extensions load by default?** Some extensions (channel adapters) are irrelevant in the Fabric context. Others (memory-core, llm-task, diffs) are essential.
- **Which skills are activated?** The full 52-skill inventory is overkill for most invocations. The Fabric should select skills based on the task.
- **Can extensions/skills be toggled?** Committed configuration should control which capabilities are active.

### 3.2 The Selection Problem

In OpenClaw's native model, the onboarding wizard guides the user through selecting channels, configuring skills, and setting up extensions. In the Fabric, this selection must be **encoded in committed configuration**:

```json
// .GITOPENCLAW/config/settings.json (conceptual)
{
  "extensions": {
    "enabled": ["memory-core", "llm-task", "diffs"],
    "disabled": ["whatsapp", "telegram", "discord", "slack"]
  },
  "skills": {
    "enabled": ["coding-agent", "gh-issues", "github", "summarize"],
    "default": "coding-agent"
  }
}
```

This is a Fabric advantage. In OpenClaw's native model, the skill/extension selection is stored in a local config file that may drift between instances. In the Fabric, the selection is committed, reviewable, diffable, and consistent across all invocations.

---

## 4. The Plugin SDK as Module Interface

OpenClaw's Plugin SDK (`openclaw/plugin-sdk`) provides a TypeScript API for building extensions:

| SDK Export | Purpose |
|-----------|---------|
| `openclaw/plugin-sdk` | Core plugin API |
| `openclaw/plugin-sdk/core` | Core abstractions |
| `openclaw/plugin-sdk/compat` | Compatibility layer |
| `openclaw/plugin-sdk/test-utils` | Testing utilities |
| Per-channel SDKs | `openclaw/plugin-sdk/telegram`, `openclaw/plugin-sdk/discord`, etc. |

This SDK is the contract between OpenClaw's core and its extensions. It defines:

- How plugins register tools, hooks, and event handlers
- How plugins access the Gateway's services (sessions, config, media)
- How plugins expose configuration schemas
- How plugins are discovered and loaded

For the Fabric, the Plugin SDK is significant because it proves that **OpenClaw's capabilities are composable at the code level.** The Fabric can selectively load plugins based on committed configuration, and each plugin's contract with the core is well-defined.

---

## 5. ClawHub: The Community Registry

OpenClaw's [ClawHub](https://clawhub.com) is a skill registry where community-created skills are published and discovered:

> With ClawHub enabled, the agent can search for skills automatically and pull in new ones as needed.

This is the farthest point on the centrifugal axis: capabilities that live entirely outside the OpenClaw repository, discovered and installed at runtime.

For the Fabric, ClawHub presents both an opportunity and a governance question:

**Opportunity:** The Fabric expression of OpenClaw could search ClawHub for skills relevant to the current task, extending the agent's capabilities beyond what is committed to the repository.

**Governance question:** Skills pulled from ClawHub at runtime introduce an unaudited dependency. The Fabric's governance model requires that every capability be traceable, reviewable, and revertible. A skill pulled dynamically from an external registry bypasses this model.

**Resolution:** The Fabric should support ClawHub as a **discovery** mechanism but require that selected skills be **committed** to the repository before they can be used in production invocations. This preserves the Fabric's provenance guarantee while benefiting from the community's skill contributions.

```
1. Developer discovers a useful skill on ClawHub
2. Developer adds it to .GITOPENCLAW/skills/ (committed)
3. PR review → merge → skill is now part of the Fabric's auditable state
4. Agent can use the skill in subsequent invocations
```

---

## 6. Extension Categories in the Fabric

Not all extensions are equal in the Fabric context. They fall into three categories:

### Essential (Always Loaded)

| Extension | Why |
|-----------|-----|
| memory-core | Semantic memory is core to the agent's intelligence |
| llm-task | Sub-task delegation is a key reasoning capability |
| diffs | Diff analysis is native to repository work |

### Conditional (Task-Dependent)

| Extension | When |
|-----------|------|
| coding-agent skill | Code generation/review tasks |
| gh-issues skill | Issue management tasks |
| github skill | Repository operations |
| summarize skill | Content summarization |

### Not Applicable (Disabled in Fabric)

| Extension | Why |
|-----------|-----|
| All channel adapters | Fabric uses GitHub Issues, not messaging channels |
| talk-voice | No audio surface on Actions runners |
| voice-call | No telephony on Actions runners |
| device-pair | No companion device in Fabric model |
| phone-control | No phone in Fabric model |
| All auth portal extensions | Fabric uses GitHub secrets for auth |

This categorization is committed configuration — the Fabric's splice rules determine what gets activated, and changes to the selection are reviewable PRs.

---

## 7. Comparison: OpenClaw Composition vs. Agenticana Composition

| Dimension | OpenClaw | Agenticana |
|-----------|----------|-----------|
| **Composition unit** | Extensions (TypeScript packages) + Skills (markdown/tool defs) | Agent specs (YAML) + Skills (markdown) |
| **Registry** | ClawHub (community) | None (bundled only) |
| **SDK** | Full TypeScript Plugin SDK | None (agents are independent configs) |
| **Runtime hooks** | Plugin lifecycle hooks (register, activate, deactivate) | No runtime hooks (agents are invoked, not loaded) |
| **Internal routing** | Gateway routes messages to extensions | Swarm Dispatcher routes tasks to agents |
| **Composition model** | Centrifugal (push capability outward) | Centripetal (pull capability inward to agents) |
| **Fabric challenge** | Select which extensions/skills to activate per invocation | Route to the right agent per task |

OpenClaw's composition model is more mature than Agenticana's. It has a well-defined SDK, a community registry, lifecycle hooks, and per-extension isolation. The Fabric benefits from this maturity — the extension selection problem is well-structured, and the Plugin SDK provides clear boundaries for what the Fabric must manage.

---

## 8. Summary

| Aspect | OpenClaw Native | Fabric Expression |
|--------|----------------|-------------------|
| Extensions | 35+ loaded by Gateway | Subset selected by committed config |
| Skills | 52+ discoverable via ClawHub | Subset committed to `.GITOPENCLAW/skills/` |
| Plugin SDK | Full TypeScript API | Used by enabled extensions at invocation time |
| ClawHub | Dynamic discovery + install | Discovery → commit → use (provenance preserved) |
| Configuration | Local YAML/JSON | Committed JSON (reviewable, diffable) |
| Selection model | Onboarding wizard | Committed config in PR-reviewable files |

OpenClaw's plugin architecture demonstrates that a Fabric module can contain a rich internal composition model. The Fabric's contribution is to make that composition **governed** — the extension selection, skill activation, and configuration are all committed artifacts that inherit the Fabric's provenance, reviewability, and reproducibility guarantees.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

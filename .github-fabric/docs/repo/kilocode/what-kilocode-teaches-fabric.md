# What Kilocode Teaches Fabric

> [Kilocode Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> Kilocode is the first platform — not agent, not toolkit — that the Fabric has analyzed. What it teaches is not about a specific agent's behavior or a toolkit's components, but about the **boundary between a governed repository and a commercial ecosystem**.

---

## 1. The Platform Lesson: The Fabric Can Compose with Ecosystems

Every previous Fabric analysis absorbed a single system. Agenticana was absorbed as a swarm. OpenClaw was absorbed as a gateway. Pi-mono was absorbed as a toolkit. OpenAI Codex was absorbed as a vendor agent. NanoClaw was absorbed as a minimal agent.

Kilocode cannot be absorbed as a unit — it is too large. It has its own server, its own clients, its own SDK, its own gateway, its own economy, its own telemetry pipeline, and its own community of 1.5 million users. The Fabric cannot wrap Kilocode. It must **compose** with it.

The lesson: the Fabric's relationship to external systems is not always absorption. Sometimes it is composition — using the external system's capabilities while maintaining independent governance. The Fabric does not need to own the intelligence; it needs to govern how the intelligence is used.

This distinction becomes more important as the ecosystem of AI agents matures. The Fabric will increasingly encounter platforms, not just agents. It needs a composition model, not just an absorption model.

---

## 2. The Fork Lesson: Identity Is Not Monolithic

Kilocode's fork from OpenCode reveals that agent identity is **inherited, not created from nothing**. The core cognitive architecture (agent loop, tool registry, session management) comes from OpenCode. The platform layer (gateway, credits, telemetry, VS Code extension) comes from Kilo.

The lesson: when the Fabric evaluates an agent, it should ask not just "what does this agent do?" but **"where does this agent come from?"** Provenance matters. A forked agent carries its upstream's strengths and weaknesses. Understanding the fork reveals:

- Which capabilities are battle-tested (upstream)
- Which capabilities are new and potentially fragile (downstream)
- What the dependency chain looks like (Fabric → Kilocode → OpenCode)
- How upstream changes propagate (or don't)

The Fabric's governance model should include **lineage tracking**: recording not just the agent's version but its upstream origin and the degree of divergence. This is the difference between knowing what medicine you're taking and knowing the entire pharmaceutical supply chain.

---

## 3. The Surface Lesson: One Surface Is Enough

Kilocode runs on four surfaces: terminal, VS Code, desktop, and web. The Fabric runs on one: GitHub. The analysis reveals that the single-surface constraint is not a limitation — it is a **focusing**.

The multi-surface architecture serves individual developers in their preferred environment. The single-surface architecture serves the team through the repository. These are different audiences:

| Audience | Surface | Value |
|----------|---------|-------|
| Individual developer | Terminal, VS Code, Desktop | Speed, interactivity, flow state |
| Team | GitHub Issues + Actions | Permanence, auditability, collaboration |

The lesson: the Fabric does not need to replicate Kilocode's multi-surface experience. It needs to provide what multi-surface cannot — audit trails, team-wide visibility, integrated code review, and persistent memory. The SDK bridges the gap: the Fabric calls Kilocode's API headlessly, and GitHub provides the surface.

---

## 4. The Marketplace Lesson: Governance and Choice Compose

Kilocode offers 500+ models from 20+ providers. The Fabric pins a single model per configuration. These approaches seemed incompatible. They are not.

The composition is: **governed choice**. The Fabric uses Kilocode's model marketplace to access any model, but the choice is committed configuration — auditable, reviewable, reversible. The marketplace provides breadth; the Fabric provides discipline. Together they produce accountable model selection.

The broader lesson: every capability that an external system provides can be paired with a governance mechanism:

| External Capability | Fabric Governance |
|--------------------|-------------------|
| 500+ model marketplace | Committed model configuration |
| Dynamic model switching | Model changes require PR review |
| Gateway routing | Gateway usage declared in config |
| Credits billing | Cost limits in committed configuration |
| MCP tool discovery | MCP servers committed in config |
| Agent modes | Mode selected by committed label-to-mode mapping |

The pattern is consistent: **the platform provides the ability; the Fabric provides the accountability.**

---

## 5. The Orchestration Lesson: Parallel Work Needs Parallel Governance

Kilocode's Agent Manager runs parallel sessions with git worktree isolation. The Fabric processes one issue at a time. The composition reveals that parallel orchestration is possible in the Fabric — using matrix strategies, worktree branches, and meta-agents.

But the lesson is deeper: **parallel work needs parallel governance.** If three agent sessions run simultaneously, each producing changes on its own branch, the governance model must handle:

- Which session's decisions take priority when conflicts arise
- How changes are merged (automatically? with human review?)
- How cost is attributed (per session? per issue? per orchestration)
- How the audit trail records the multi-session coordination

The Fabric should not just absorb Kilocode's orchestration capabilities — it should govern them. Each parallel session should produce a separate, auditable branch. Merges should go through PR review. The orchestration decision itself (which tasks to parallelize, which models to assign) should be committed configuration.

---

## 6. The Commerce Lesson: Opacity Is the Enemy, Not Commerce

Kilocode has a commercial layer: credits, gateway, telemetry, analytics. The initial assumption was that commerce conflicts with governance. The analysis reveals that the conflict is not with commerce but with **opacity**.

The Fabric can use Kilocode's commercial gateway — as long as the usage is declared, configured, and auditable. The Fabric can allow Kilocode's telemetry — as long as the data flow is declared and the option to disable it is governed. The Fabric can work with credits billing — as long as cost limits are committed.

The lesson: **governance does not require independence from commercial systems. It requires transparency about commercial relationships.**

This has implications beyond Kilocode. Every AI agent the Fabric uses has a commercial relationship with an LLM provider. The Fabric already governs this through committed API key references and model configuration. Kilocode adds a second commercial layer (the gateway), which requires a second governance declaration. The pattern scales: each commercial dependency gets a committed configuration entry.

---

## 7. The Autonomy Lesson: The Auto Flag Needs a Governor

Kilocode's `--auto` flag disables all permission prompts. The agent executes terminal commands, modifies files, and creates commits without human approval. This is the mode designed for CI/CD — and it is the mode the Fabric would use.

The lesson: **unsupervised autonomy is powerful but must be bounded.** The Fabric's governance model provides the bounds:

- **Tool allowlists** — Committed configuration specifies which tools the agent may use
- **Command constraints** — Bash execution limited to approved commands
- **Cost limits** — Token and dollar budgets per issue
- **DEFCON levels** — Graduated autonomy matching the repository's readiness state
- **Review gates** — Agent changes go through PR review before merge

Kilocode provides the `--auto` capability. The Fabric provides the governance frame around it. Neither is sufficient alone: `--auto` without governance is a security risk; governance without `--auto` is a bottleneck. Together, they produce **bounded autonomy** — the agent acts freely within committed constraints.

---

## 8. Summary: The Seven Lessons

| # | Lesson | Source | Implication |
|---|--------|--------|-------------|
| 1 | The Fabric must compose, not just absorb | Platform as Agent | Develop a composition model for external platforms |
| 2 | Agent identity is inherited, not monolithic | The Forked Mind | Track agent lineage and upstream dependencies |
| 3 | One surface is enough for governance | Multi-Surface Architecture | GitHub provides the team surface; SDK bridges to agents |
| 4 | Governance and marketplace choice compose | Model Marketplace and Governance | Every capability pairs with a committed governance mechanism |
| 5 | Parallel work needs parallel governance | Agentic Orchestration | Multi-session requires per-session auditability |
| 6 | Opacity is the enemy, not commerce | The Commercial Mind | Commercial dependencies are fine if declared and governed |
| 7 | Unsupervised autonomy needs governance bounds | All documents | `--auto` + committed constraints = bounded autonomy |

Kilocode is not a mind the Fabric absorbs. It is the first **ecosystem** the Fabric must learn to coexist with — a commercial platform with its own gravity, its own users, and its own economy. What the Fabric learns is that coexistence requires not control but **governance**: declaring the relationship, configuring the boundary, and committing every decision to the audit trail.

The Fabric is richer for understanding that it does not need to own the intelligence. It needs to govern how the intelligence is used. That governance — committed, auditable, reversible — is the Fabric's unique contribution to a world of proliferating AI platforms.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

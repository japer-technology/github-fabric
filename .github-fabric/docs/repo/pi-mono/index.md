# Pi-Mono: Rethought from the Fabric

> [Docs Index](../../index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> A complete analysis of [pi-mono](https://github.com/badlogic/pi-mono) — a monorepo toolkit for building AI agents, containing a unified multi-provider LLM API, an agent runtime, an aggressively extensible coding agent, a self-managing Slack bot, a terminal UI framework, web UI components, and a GPU pod manager — reexamined through the architecture, governance, and philosophy of GitHub Fabric.

---

## Why This Analysis Exists

The [githubification](https://github.com/japer-technology/githubification) project asked how to make repositories run on GitHub as infrastructure. Previous Fabric analyses examined **agents** — systems that act, reason, and produce outputs. [Agenticana](../agenticana/index.md) was twenty agents sharing a memory bank. [OpenClaw](../openclaw/index.md) was a persistent multi-channel personal assistant. Both were candidates for absorption: the Fabric could wrap them, distill them, govern them.

Pi-mono is a different kind of challenge. It is not an agent. It is the **substrate from which agents are built**.

Pi-mono is a TypeScript monorepo containing seven packages: a unified LLM API that abstracts twenty-plus providers (`pi-ai`), a stateful agent runtime with tool execution and event streaming (`pi-agent-core`), a terminal coding agent with radical extensibility (`pi-coding-agent`), a self-managing Slack bot (`pi-mom`), a differential-rendering terminal UI framework (`pi-tui`), web UI components for chat interfaces (`pi-web-ui`), and a CLI for managing vLLM deployments on GPU pods (`pi-pods`). OpenClaw itself uses pi-mono's SDK — the coding agent's RPC mode and agent runtime power OpenClaw's backend.

When you rethink this system through the Fabric's lens, the question changes. The Fabric does not just absorb agents; it must also understand what agents are made of. Pi-mono is the raw material: the provider abstraction, the agent loop, the tool execution model, the session branching, the extension architecture. The question is not "how do you run pi on GitHub?" — it is **"what does the Fabric learn from the system that builds the agents the Fabric governs?"**

---

## Documents

| Document | Focus |
|----------|-------|
| [Toolkit as Substrate](./toolkit-as-substrate.md) | Why absorbing an agent toolkit is fundamentally different from absorbing an agent — and what it means for the Fabric's Source Plane |
| [The Extensible Mind](./the-extensible-mind.md) | Extensions, skills, prompt templates, themes, and pi packages — radical extensibility versus committed governance |
| [Provider Abstraction and Model Identity](./provider-abstraction-and-model-identity.md) | Twenty-plus LLM providers behind a single interface versus the Fabric's model-pinning discipline |
| [Sessions as Branching Memory](./sessions-as-branching-memory.md) | Pi's tree-structured JSONL sessions with compaction versus the commit graph as memory |
| [Self-Managing Agents](./self-managing-agents.md) | Mom installs her own tools, writes her own scripts, manages her own environment — the governance implications for the Fabric |
| [Terminal to Repository](./terminal-to-repository.md) | From the terminal TUI to GitHub Issues — what the coding agent loses and gains in the transformation |
| [What Pi-Mono Teaches Fabric](./what-pi-mono-teaches-fabric.md) | The synthesis: what the Fabric learns from absorbing the toolkit that builds its agents |

---

## The Source

[Pi-mono](https://github.com/badlogic/pi-mono) is a monorepo containing seven packages:

- **@mariozechner/pi-ai** — Unified multi-provider LLM API supporting OpenAI, Anthropic, Google, Vertex AI, Azure, Bedrock, Mistral, Groq, Cerebras, xAI, OpenRouter, MiniMax, GitHub Copilot, and any OpenAI-compatible endpoint. Auto-discovers tool-capable models, tracks tokens and cost, supports cross-provider handoffs, context serialization, streaming with partial JSON tool calls, and thinking/reasoning modes.
- **@mariozechner/pi-agent-core** — Stateful agent runtime with tool execution, event streaming, steering and follow-up message queues, custom message types via declaration merging, state management, session IDs, and both high-level (`Agent` class) and low-level (`agentLoop`) APIs.
- **@mariozechner/pi-coding-agent** — Interactive terminal coding agent running in four modes: interactive TUI, print, JSON, and RPC. Ships with read/write/edit/bash tools. Extensible via TypeScript extensions, Markdown skills, prompt templates, themes, and pi packages (npm/git installable). Sessions stored as branching JSONL with in-place tree navigation. Supports automatic compaction, context files (AGENTS.md), OAuth login, model cycling, and multi-provider subscriptions.
- **@mariozechner/pi-mom** — Self-managing Slack bot that installs its own tools, writes its own scripts, configures its own credentials, and maintains per-channel conversation history with working memory. Runs in Docker sandbox. Supports scheduled events, artifacts server, and infinite searchable history via grep.
- **@mariozechner/pi-tui** — Minimal terminal UI framework with differential rendering, synchronized output (CSI 2026), bracketed paste, component-based architecture (Text, Editor, Markdown, SelectList, Overlays), inline images (Kitty/iTerm2), IME support, and autocomplete.
- **@mariozechner/pi-web-ui** — Web components for AI chat interfaces built with mini-lit and Tailwind CSS v4. Provides ChatPanel, AgentInterface, ArtifactsPanel, JavaScript REPL, document extraction, IndexedDB storage, CORS proxy, model selectors, session management, and custom message renderers.
- **@mariozechner/pi-pods** — CLI for deploying and managing LLMs on GPU pods with automatic vLLM configuration. Supports DataCrunch, RunPod, and any SSH-accessible Ubuntu machine with NVIDIA GPUs. Manages multiple models per pod with smart GPU allocation.

The project philosophy is explicit: *"Pi is aggressively extensible so it doesn't have to dictate your workflow."* Features that other tools bake in — sub-agents, plan mode, MCP, permission popups, background bash — are deliberately omitted from the core and left to extensions. The CONTRIBUTING.md states: *"You must understand your code. If you can't explain what your changes do and how they interact with the rest of the system, your PR will be closed."*

---

## The Fabric Lens

Where Githubification asks "can this run on GitHub?", the Fabric asks:

1. **Source Plane** — How does the Fabric ingest a toolkit monorepo that is not itself an agent, but the raw material from which agents are constructed? What is the genetic material of a provider abstraction?
2. **Transformation Plane** — What happens when the Fabric does not absorb the agent, but the substrate the agent is built on? Is the transformation recursive — the Fabric governs agents that are built from a toolkit that the Fabric also governs?
3. **Execution Plane** — Pi runs in terminals, Docker sandboxes, GPU pods, and browsers. The Fabric runs in Actions. How do these execution surfaces compose rather than compete?
4. **Extensions** — Pi's defining philosophy is radical extensibility: anyone can replace any capability. How does this compose with the Fabric's commitment to governance, where every tool, every prompt, and every action is auditable?
5. **Providers** — Pi unifies twenty-plus LLM providers behind a single interface. The Fabric pins a single model per configuration. What is the relationship between provider abstraction and model governance?
6. **Sessions** — Pi's sessions are branching JSONL trees with compaction and in-place navigation. The Fabric's memory is the commit graph. Are these complementary or competing memory models?
7. **Self-Management** — Mom installs her own tools, writes her own scripts, manages her own credentials. This is the opposite of the Fabric's governance posture. How does the Fabric govern a system designed to govern itself?

These seven questions organize the analysis that follows.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

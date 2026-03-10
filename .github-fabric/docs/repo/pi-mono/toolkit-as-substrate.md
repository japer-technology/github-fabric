# Toolkit as Substrate

> [Pi-Mono Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [Source Plane](../../question-what.md)

> Pi-mono is not an agent. It is the material from which agents are made. Absorbing a toolkit into the Fabric is fundamentally different from absorbing an agent — it is absorbing the genome, not the organism.

---

## 1. Agents vs. Toolkits

Every previous Fabric analysis examined an **agent** — a system that receives input, reasons, acts, and produces output. Agenticana was twenty agents coordinated through a shared memory bank. OpenClaw was a persistent personal assistant with twenty-two channels and thirty tools. Both are organisms: they have a lifecycle, a boundary, an identity.

Pi-mono is not an organism. It is a **toolkit** — a collection of libraries, runtimes, and CLIs from which organisms are assembled. The seven packages form a dependency chain:

```
pi-ai                  ← Provider abstraction (foundation)
  └── pi-agent-core    ← Agent runtime (uses pi-ai for LLM calls)
        ├── pi-coding-agent  ← Terminal agent (uses agent-core)
        ├── pi-mom           ← Slack bot (uses agent-core)
        └── pi-web-ui        ← Web components (uses agent-core)
pi-tui                 ← Terminal UI (used by pi-coding-agent)
pi-pods                ← GPU pod manager (independent)
```

When the Fabric absorbs an agent, the pattern is established: ingest the source, transform the execution model, govern the output. But when the Fabric absorbs a toolkit, the question is different: **what is being absorbed?**

---

## 2. The Genetic Material of an Agent

If the Fabric treats the repository as the mind, then pi-mono is not a mind — it is the **DNA** from which minds are assembled. Each package encodes a capability:

| Package | Genetic Contribution |
|---------|---------------------|
| **pi-ai** | The ability to speak to any LLM provider — the vocal cords and auditory system |
| **pi-agent-core** | The agent loop — the cognitive cycle of perceive, reason, act |
| **pi-coding-agent** | A fully formed coding organism with tools, sessions, and extensions |
| **pi-tui** | The sensory surface for terminal environments |
| **pi-web-ui** | The sensory surface for browser environments |
| **pi-mom** | A self-managing organism that builds its own tools |
| **pi-pods** | The ability to provision raw compute — hardware management as a capability |

The Fabric's Source Plane must decide how to ingest this. Three options exist:

**Option A: Absorb the organisms.** Ignore the toolkit. Only absorb pi-coding-agent and pi-mom as agents. This is the pattern used for Agenticana and OpenClaw. It works, but it discards the compositional structure that makes pi-mono powerful.

**Option B: Absorb the genome.** Ingest the entire monorepo as a dependency. The Fabric's agent uses pi-ai for provider abstraction, pi-agent-core for the agent loop, and pi-coding-agent's tools. The toolkit is not transformed — it is **consumed**.

**Option C: Absorb the architecture.** The Fabric does not use pi-mono's code directly. Instead, it absorbs the architectural patterns: the provider abstraction model, the tool execution model, the session branching model, the extension architecture. The toolkit becomes a reference implementation.

Each option has different implications for the Source Plane, and the correct choice depends on what the Fabric is trying to become.

---

## 3. Option B in Detail: The Toolkit as Dependency

This is the most architecturally interesting option. If the Fabric uses pi-mono as a dependency, the relationship inverts: instead of the Fabric absorbing pi-mono, pi-mono becomes the **engine** inside the Fabric.

Consider the execution flow:

```
Issue opened (#42: "Refactor the authentication module")
  → GitHub Actions workflow triggers
    → Runner installs pi-mono packages (npm install)
      → Fabric lifecycle (sentinel check, DEFCON validation)
        → pi-agent-core Agent initialized with:
            - model from pi-ai (provider abstraction)
            - tools from pi-coding-agent (read, write, edit, bash)
            - session loaded from committed JSONL
            - system prompt from AGENTS.md
        → agent.prompt(issue body + comments)
        → Agent reasons, calls tools, produces output
      → Fabric commits results (session update, code changes)
    → Issue comment posted with response
```

In this model:

- **pi-ai** provides the provider abstraction. The Fabric's configuration specifies the provider and model; pi-ai handles the API details, token counting, cost tracking, and cross-provider handoffs.
- **pi-agent-core** provides the agent loop. The Fabric does not need to implement tool dispatch, message management, or streaming — pi-agent-core handles it.
- **pi-coding-agent** provides the tools. Read, write, edit, bash — the same tools that work in the terminal work in Actions.
- The Fabric provides **governance**. Sentinel files, DEFCON levels, the Four Laws, committed state, auditable history.

This is a genuine composition: pi-mono provides capability, the Fabric provides governance. Neither subsumes the other.

---

## 4. The Dependency Inversion

There is a philosophical tension here. The Fabric's thesis is "the repo is the mind." If pi-mono is a dependency, the mind depends on external code that is not committed to the repository. The mind has an external dependency.

This is not unique to pi-mono — any Fabric agent that uses an LLM provider depends on an external API. But pi-mono makes the dependency explicit and structural: the agent loop itself, the tool execution model, the session management — all come from an external package.

The resolution is version pinning. If the Fabric pins pi-mono to a specific version (e.g., `@mariozechner/pi-agent-core@0.15.3`), then the dependency is **reproducible**. Any invocation with the same pinned version, the same committed state, and the same input will produce the same output (modulo LLM nondeterminism). The genetic material is versioned, even if it lives in a different repository.

This is analogous to how biological organisms depend on external DNA (mitochondrial DNA, viral insertions). The genome is not entirely self-contained — and that is fine, as long as the dependencies are stable and well-understood.

---

## 5. What the Fabric Cannot Absorb

Not everything in pi-mono maps to the Fabric's model:

| Pi-mono Capability | Fabric Mapping | Absorbable? |
|-------------------|----------------|-------------|
| **LLM provider abstraction** | Yes — Fabric specifies provider/model in config | ✅ Direct mapping |
| **Agent loop** | Yes — drives the Fabric's reasoning cycle | ✅ Direct mapping |
| **Read/write/edit/bash tools** | Yes — operate on the repository filesystem | ✅ Direct mapping |
| **Terminal TUI** | No — Actions runners have no terminal | ❌ Not applicable |
| **Interactive mode** | No — no human at the keyboard during Actions | ❌ Not applicable |
| **Browser extensions** | No — no browser in Actions | ❌ Not applicable |
| **GPU pod management** | No — Fabric does not manage hardware | ❌ Different domain |
| **Web UI components** | No — no browser rendering in Actions | ❌ Different domain |
| **Session branching** | Partially — JSONL sessions can be committed | ⚠️ Partial mapping |
| **Extensions** | Partially — can be committed as code | ⚠️ Governance tension |
| **Skills** | Partially — Markdown files that instruct models | ⚠️ Governance tension |
| **Mom (self-managing)** | Complex — self-management conflicts with governance | ⚠️ Deep tension |

The toolkit contains more than the Fabric can use. This is expected — a toolkit serves many execution environments, and the Fabric is one. The act of absorption is also an act of **selection**: choosing which genetic material to express in the Fabric's environment.

---

## 6. The Recursive Question

Pi-mono powers OpenClaw. OpenClaw has already been analyzed by the Fabric. If the Fabric absorbs pi-mono as a dependency, and OpenClaw uses pi-mono as its runtime, then the Fabric's governance extends transitively:

```
Fabric governs → OpenClaw (agent) → uses pi-mono (toolkit) → which the Fabric also consumes
```

This is not a contradiction — it is a **layered architecture**. The Fabric governs the agent (OpenClaw) at the application layer and consumes the toolkit (pi-mono) at the infrastructure layer. The governance is at the agent level; the toolkit is a shared dependency that both the Fabric and OpenClaw rely on.

The implication is that pi-mono occupies a unique position in the Fabric's ecosystem: it is simultaneously a **source** (something to analyze and learn from), a **dependency** (something the Fabric can use), and a **reference implementation** (something that shapes how the Fabric thinks about agent architecture).

---

## 7. Summary

| Dimension | Agent (OpenClaw, Agenticana) | Toolkit (Pi-mono) |
|-----------|-----------------------------|--------------------|
| **What is absorbed** | A running system | A library of capabilities |
| **Source Plane action** | Fork or wrap | Depend or reference |
| **Transformation** | Distill execution model | Select applicable components |
| **Governance target** | The agent's actions | The agent's construction |
| **Identity** | The agent has one | The toolkit enables many |
| **Versioning** | The agent is pinned | The packages are pinned |
| **Recursive relationship** | Agent uses toolkit | Toolkit powers agent that Fabric governs |

Pi-mono is not a mind to absorb. It is the material from which minds are built. The Fabric's relationship to it is not absorption but **composition** — selecting the right genetic material, pinning the version, and governing the organism that results.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

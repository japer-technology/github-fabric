# Channels as Surfaces

> [Moltis Index](./index.md) · [The Repo Is the Mind](../../the-repo-is-the-mind.md) · [The Four Laws](../../the-four-laws-of-ai.md)

> Moltis communicates through seven channels: Web UI, Telegram, Discord, WhatsApp, MS Teams, Slack, and API. The Fabric communicates through one: GitHub Issues. When seven channels collapse to one, what disappears is immediacy. What concentrates is **accountability**.

---

## 1. The Channel Inventory

Moltis's communication architecture is designed for reach. Each channel is a separate crate with its own protocol implementation:

| Channel | Crate | LoC | Protocol | Latency | Persistence |
|---------|-------|-----|----------|---------|-------------|
| Web UI | `moltis-web` | 4.5K | HTTP/WS | Real-time | Session-scoped |
| Telegram | `moltis-telegram` | Part of channels | Bot API | Seconds | Platform-persisted |
| Discord | `moltis-discord` | Part of channels | Gateway WS | Seconds | Platform-persisted |
| WhatsApp | `moltis-whatsapp` | Part of channels | Cloud API | Seconds | Platform-persisted |
| MS Teams | `moltis-msteams` | Part of channels | Bot Framework | Seconds | Platform-persisted |
| Slack | `moltis-slack` | Part of channels | Events API | Seconds | Platform-persisted |
| REST API | `moltis-gateway` | 36.1K | HTTP/WS | Milliseconds | Caller-managed |
| Voice | `moltis-voice` | 6.0K | TTS/STT | Real-time | Ephemeral |

The `moltis-channels` crate (14.9K LoC combined) provides a unified abstraction over five messaging platforms. Each channel adapter translates platform-specific events into Moltis's internal message format, routes them to the chat engine, and translates responses back.

The architecture is hub-and-spoke:

```
Telegram ──┐
Discord  ──┤
WhatsApp ──┤
MS Teams ──┼──▶ Gateway ──▶ Chat Engine ──▶ Agent Runner
Slack    ──┤
Web UI   ──┤
API      ──┘
```

Every channel converges on the same gateway server. The agent does not know — and does not need to know — which channel originated the request.

---

## 2. The Single-Surface Constraint

The Fabric has one surface: GitHub Issues. A user opens an issue. The Fabric reads the issue body. The agent executes. Results appear as PR or issue comment. There is no Telegram, no Discord, no voice. There is one text-based, asynchronous interface backed by a version control system.

This seems like a severe limitation. Moltis users can talk to their AI from a phone (Telegram), a team workspace (Slack, Discord, Teams), a browser (Web UI), or by voice. Fabric users must navigate to GitHub, write markdown, and wait.

But the constraint produces properties that multi-channel architectures sacrifice:

| Property | Multi-Channel (Moltis) | Single-Surface (Fabric) |
|----------|----------------------|------------------------|
| **Audit trail** | Fragmented across 7 platforms | Unified in Git |
| **Access control** | Per-platform auth models | GitHub permissions (unified) |
| **Conversation history** | Platform-dependent retention | Git history (permanent) |
| **Team visibility** | Whoever is in that channel | Anyone with repo access |
| **Searchability** | Per-platform search (if available) | Git log + GitHub search |
| **Reproducibility** | Depends on platform's data access | `git log --all` |
| **Cross-reference** | Manual links between platforms | Issue/PR numbers, mentions |

The single surface is not a limitation of the Fabric — it is the **source of its governance properties**. Every interaction that passes through GitHub Issues becomes part of the permanent, searchable, cross-referenceable record.

---

## 3. What Multi-Channel Provides

The seven channels are not redundant — they serve different contexts:

### 3a. Immediacy (Telegram, WhatsApp)

Mobile messaging channels provide instant, informal access to the AI. A user can ask a question from their phone while walking. The response arrives in seconds. This is valuable for quick queries, status checks, and lightweight interactions.

The Fabric cannot match this. Opening a GitHub issue from a phone is possible but friction-heavy. The Fabric is designed for deliberate, structured interactions — not hallway conversations.

### 3b. Team Context (Slack, Discord, MS Teams)

Workplace messaging channels embed the AI in the team's communication flow. A team member asks a question in a Discord server or Slack channel, and the AI responds where the team can see it. Context is shared. Follow-ups happen naturally.

The Fabric partially matches this through GitHub Issues — team members can see issues, comment, and collaborate. But the interaction style is different: issues are structured work items, not conversations.

### 3c. Rich Interaction (Web UI, Voice)

The Web UI provides a full-featured chat interface with streaming responses, conversation history, and a setup wizard. Voice I/O (15+ TTS and STT providers) enables hands-free interaction.

The Fabric has no equivalent. GitHub Issues do not stream. They do not support voice. The interaction is batch — you submit, you wait, you read the result.

### 3d. Programmatic Access (API)

The REST API enables integration with custom tools, automation scripts, and third-party services. This is the most flexible channel — any system that can make HTTP requests can interact with Moltis.

The Fabric's equivalent is the GitHub API + workflow dispatch. It is equally programmable, though the interaction model is event-driven (issue created → workflow runs → result committed) rather than request-response.

---

## 4. The Collapse: What Disappears

When seven channels collapse to GitHub Issues, three capabilities disappear:

### 4a. Real-Time Conversation

Moltis's channels support real-time, streaming, back-and-forth conversation. The user sends a message, the agent starts responding immediately, the user can follow up mid-stream. This is the natural interaction pattern for chat.

GitHub Issues are batch operations. The user writes the issue body, submits, and waits for the agent to complete its work. There is no mid-stream interaction, no "wait, actually do this instead." Each issue is a **complete task specification**, not a conversation turn.

### 4b. Informal Access

Telegram and WhatsApp are informal channels. Users interact with Moltis the same way they interact with friends — short messages, emoji, voice notes. This low friction encourages frequent use.

GitHub Issues are formal. They have titles, bodies, labels, and assignees. Writing an issue is a deliberate act. This formality discourages casual interaction but encourages **precise task definition**.

### 4c. Voice

Voice I/O requires real-time streaming, low latency, and a persistent connection. None of these are available through GitHub Issues. The Fabric is text-only and asynchronous.

---

## 5. The Concentration: What Intensifies

When seven channels collapse to one, the remaining channel becomes **extraordinarily powerful**:

### 5a. Complete Decision Record

Every task specification is an issue. Every result is a commit. Every review is a PR comment. Every decision is traceable from request through execution to deployment. No other channel provides this level of decision traceability.

### 5b. Built-In Review

GitHub's PR review workflow means that every agent output passes through human inspection before it affects the codebase. Multi-channel architectures have no equivalent — the agent's response in Telegram is the final output. There is no review gate.

### 5c. Institutional Permanence

GitHub Issues and Git history persist as long as the repository exists. Telegram messages can be deleted. Discord servers can be abandoned. Slack has retention policies. The Fabric's single surface is also its **longest-lived surface**.

### 5d. Cross-Reference Graph

GitHub's native cross-referencing — issue mentions, PR links, commit references — creates a navigable graph of decisions. Issue #42 references PR #43, which closes issue #41 and was triggered by commit `abc123`. This graph does not exist across seven disconnected channels.

---

## 6. The Composition: Channel as Trigger, Repository as Record

The resolution is not to replace Moltis's channels with GitHub Issues, but to compose them:

```
Telegram ──┐                    ┌──▶ GitHub Issue (record)
Discord  ──┤                    │
WhatsApp ──┼──▶ Moltis ──▶ Git commit ──▶ PR (review)
Slack    ──┤    Gateway         │
Web UI   ──┤                    └──▶ Audit trail (permanent)
Voice    ──┘
```

In this model:

- **Channels provide reach** — users interact with the AI through whatever surface is convenient.
- **The repository provides record** — every significant action the AI takes is committed to Git, creating the audit trail.
- **Moltis bridges the gap** — the gateway receives requests from any channel and, when the action is significant (code change, configuration update, tool execution), creates a Git commit and/or GitHub Issue.

The Fabric does not need to eliminate Moltis's channels. It needs to ensure that the channels **converge on the repository**. The Telegram message that triggers a code change should produce the same Git commit as the GitHub Issue that triggers the same change. The channel is the trigger; the repository is the record.

---

## 7. The Lesson: Surfaces Are for People, Records Are for Governance

Moltis's seven channels exist because different people prefer different communication surfaces. The developer uses the Web UI. The manager checks Slack. The user on the go uses Telegram. The automation script uses the API. The accessibility-focused user uses voice.

The Fabric's single surface exists because governance requires a single source of truth. You cannot audit seven channels independently and produce a coherent decision record. You can audit one repository and know exactly what happened.

The composition preserves both values: **let people choose their surface, but route all governance-significant actions through the repository.** The channel is for the human. The record is for the institution. Moltis provides the channels. The Fabric provides the record. Together, they serve both audiences.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

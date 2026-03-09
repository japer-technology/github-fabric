# Channels as Sensory Organs

> [OpenClaw Index](./index.md) · [What OpenClaw Teaches Fabric](./what-openclaw-teaches-fabric.md) · [Transformation Map](./transformation-map.md)

> Twenty-two messaging channels are not integrations. They are the senses through which the assistant perceives its owner's world. When the Fabric narrows them to one, it does not cripple the mind — it focuses it.

---

## 1. The Channel Inventory

OpenClaw's channel surface is its most distinctive architectural feature. No other Fabric case study brings anything comparable:

| Channel | Library / Protocol | Extension Location |
|---------|-------------------|-------------------|
| WhatsApp | Baileys (Web API) | `extensions/whatsapp` |
| Telegram | grammY | `extensions/telegram` |
| Slack | Bolt | `extensions/slack` |
| Discord | discord.js | `extensions/discord` |
| Google Chat | Chat API | `extensions/googlechat` |
| Signal | signal-cli | `extensions/signal` |
| BlueBubbles (iMessage) | BlueBubbles API | `extensions/bluebubbles` |
| iMessage (legacy) | imsg CLI | `extensions/imessage` |
| IRC | irc-framework | `extensions/irc` |
| Microsoft Teams | Bot Framework | `extensions/msteams` |
| Matrix | matrix-js-sdk | `extensions/matrix` |
| Feishu | Feishu API | `extensions/feishu` |
| LINE | LINE Messaging API | `extensions/line` |
| Mattermost | Mattermost API | `extensions/mattermost` |
| Nextcloud Talk | Talk API | `extensions/nextcloud-talk` |
| Nostr | nostr-tools | `extensions/nostr` |
| Synology Chat | Synology API | `extensions/synology-chat` |
| Tlon | Tlon API | `extensions/tlon` |
| Twitch | tmi.js | `extensions/twitch` |
| Zalo | Zalo API | `extensions/zalo` |
| Zalo Personal | Zalo API | `extensions/zalouser` |
| WebChat | Built-in web UI | `src/web` |

Each channel is a workspace package under `extensions/` with its own `package.json`, source code, and tests. The shared extension library (`extensions/shared`) provides common abstractions for message formatting, chunking, media handling, and routing.

---

## 2. The Channel Architecture

Each channel implements a consistent contract:

```
Inbound message → Channel adapter → Gateway router → Agent session → Response → Channel adapter → Outbound message
```

The Gateway does not care which channel delivered the message. By the time it reaches the agent, the message is a normalized object with:

- A sender identity (channel-specific, mapped to an internal account ID)
- A text body (or media reference)
- A session key (channel + peer combination)
- Metadata (group vs. DM, thread ID, reply reference)

This normalization is the channel architecture's key insight: **the agent reasons about messages, not about channels.** A question from WhatsApp and the same question from Telegram produce the same reasoning chain. Only the delivery format differs.

---

## 3. What the Fabric Keeps

When the Fabric distills OpenClaw, it replaces twenty-two channels with one: **GitHub Issues.**

This is not arbitrary. GitHub Issues naturally provides:

| Channel Property | GitHub Issues Equivalent |
|-----------------|------------------------|
| Inbound message | Issue comment |
| Outbound message | Issue comment reply |
| Session identity | Issue number |
| Thread continuity | Issue thread (all comments on one issue) |
| Sender identity | GitHub username (authenticated, verified) |
| Media attachments | Issue attachments (images, files, logs) |
| Notification | GitHub notification system (email, mobile, web) |
| Search | GitHub issue search (labels, full-text, filters) |
| History | Complete — every comment is permanent and datable |
| Access control | Repository collaborator permissions |
| Formatting | Markdown with code blocks, tables, and images |

For developer workflows, GitHub Issues is not a degraded channel — it is the **native channel.** The developer is already in the repository. The issue is already the context. The notification system is already configured. There is no friction of switching to a separate messaging app.

---

## 4. What the Fabric Loses

The reduction from twenty-two to one is significant for non-developer use cases:

### 4.1 Real-Time Conversational Flow

WhatsApp, Telegram, and Discord support rapid-fire back-and-forth messaging with typing indicators, read receipts, and sub-second delivery. GitHub Issues supports threaded comments with latency measured in minutes. The interaction model shifts from **conversation** to **correspondence.**

### 4.2 Voice

OpenClaw supports Voice Wake (wake words on macOS/iOS) and Talk Mode (continuous voice on Android). The Gateway processes audio through transcription, TTS, and streaming voice responses. GitHub Issues has no audio surface.

### 4.3 Rich Media Interactions

OpenClaw processes images inline (describe, analyze, OCR), handles audio (transcribe, summarize), and processes video (frame extraction, analysis). GitHub Issues supports image attachments but not the rich, inline media interactions that messaging channels enable.

### 4.4 Group Dynamics

OpenClaw handles group chats with mention gating, activation modes, reply tags, and per-channel routing. GitHub Issues has no direct analogue — an issue is typically a one-on-one or one-to-many interaction, not a group conversation with the agent as one participant.

### 4.5 Proactive Outreach

In its native model, OpenClaw can proactively send messages — cron-triggered reminders, wakeup alerts, webhook-driven notifications. In the Fabric, the agent is reactive only: it responds to issue events but does not initiate contact. (Partial mitigation: a scheduled workflow can open or comment on issues.)

---

## 5. The Sensory Organ Metaphor

The reduction from twenty-two channels to one is best understood through the metaphor of sensory organs:

- In its native habitat, OpenClaw has **twenty-two senses** — it perceives its owner's world through WhatsApp messages, Discord pings, Telegram chats, Slack threads, and more. Each channel is a different modality, providing a different quality of information.

- In the Fabric, the assistant has **one sense** — it perceives the developer's world through GitHub Issues. But this is the sense that matters most for the Fabric's purpose. A surgeon does not need twenty-two senses to operate; a focused, high-acuity sense in the right domain is more valuable than broad but shallow perception.

The Fabric's channel reduction is not sensory deprivation. It is **sensory specialization.**

---

## 6. The Multi-Channel Bridge (Future Architecture)

The [Gateway as Persistent Mind](./gateway-as-persistent-mind.md) document explores the hybrid architecture where a persistent Gateway provides real-time multi-channel presence while the Fabric provides governance and audit. In this model, the channels return — but under Fabric governance:

```
WhatsApp / Telegram / Discord / Slack
              │
              ▼
    Gateway (persistent)  ←──── Fabric governance (committed config)
              │
              ├── Route to agent session
              ├── Process with OpenClaw runtime
              ├── Commit interaction to git
              └── Sync state with Fabric
```

This preserves the multi-channel richness while adding the Fabric's guarantees:

- Every interaction is committed (auditable).
- Channel configuration is reviewable (committed YAML/JSON).
- DM pairing and allowlists are governed policy (Four Laws compliance).
- The agent's memory accumulates in git regardless of which channel the message came from.

The channels become sensory organs **governed by the mind** (the repository), not autonomous connections that exist outside the audit trail.

---

## 7. Channel Routing as Fabric Pattern

OpenClaw's multi-agent routing — the ability to route different channels, accounts, or peers to different agent configurations — maps naturally to the Fabric's module system:

| OpenClaw Routing | Fabric Equivalent |
|-----------------|-------------------|
| Route WhatsApp to agent A, Discord to agent B | Different workflow triggers or label-based routing within one Fabric module |
| Per-channel session isolation | Per-label or per-assignee state isolation in `.GITOPENCLAW/state/` |
| Per-channel model override | Committed config with per-label model settings |
| Group activation modes | GitHub mentions (@agent) in issue threads |
| DM pairing per channel | Collaborator permission check per issue author |

The routing logic is not lost in distillation — it is simplified. GitHub Issues does not need twenty-two routing rules. It needs one: **is the commenter a collaborator?** The simplification is itself a governance benefit.

---

## 8. Summary

| Aspect | OpenClaw Native | Fabric Expression |
|--------|----------------|-------------------|
| Channel count | 22+ | 1 (GitHub Issues) |
| Channel diversity | Messaging, voice, video, IoT | Text + images |
| Interaction model | Real-time conversation | Threaded correspondence |
| Routing complexity | Per-channel, per-account, per-group | Per-issue (labels, authors) |
| Media support | Full (audio, video, images, PDFs) | Images and file attachments |
| Proactive capability | Cron, webhooks, wakeups | Scheduled workflows |
| Governance | DM pairing, allowlists, trust levels | Collaborator permissions |
| Session model | Continuous across channels | Per-issue sessions committed to git |
| Benefit of reduction | — | Focus, simplicity, auditability |

Twenty-two channels give OpenClaw omnipresence. One channel gives the Fabric focus. For the repository as the mind, focus is what matters.

---

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japer-technology/github-fabric/main/.github-fabric/logo.png" alt="GitHub Fabric" width="500">
  </picture>
</p>

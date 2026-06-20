# SBC Tech v2 — Build Overview & Handoff Master

> **Audience:** the laptop-agent (and future Francis) building SBC Tech v2.
> **Read this first.** Every other doc (`01..12`) is a single feature and assumes
> the rules, vocabulary, and phase order defined here.

> **⚠️ BASE DECISION (2026-06-14) — supersedes older "fork `web/`" language.**
> The base is **`fathah/hermes-desktop`** (Electron desktop GUI for the same
> NousResearch/hermes-agent), **not** the agent's `web/` dashboard. Rationale,
> file citations, and the GO call are in **`APPENDIX_HERMES_DESKTOP.md`** — read
> it alongside this doc. The biggest consequence: **hermes-desktop has NO plugin
> SDK.** Where docs `02–12` say "plugin," read it as **"a screen/component module
> inside our fork."** OpenUI inline (`01`) is still the signature renderer change,
> and it is a fork in *any* base — so this choice costs us nothing on the #1 goal.

---

## 1. What we are building (one paragraph)

SBC Tech v2 is a **fork of `fathah/hermes-desktop`** (MIT — an Electron desktop
app that installs, configures, and chats with **NousResearch/hermes-agent**; local
agent clone at `C:\Users\maf001h\Desktop\apps\_clones\hermes-agent`). We inherit
hermes-desktop's polished chassis for free (~90% of the surface — installer,
sessions, memory+providers, models, schedules, gateways, token footer), then add
**12 features** as **screen/component modules in the fork** plus the **OpenUI
renderer change** in the chat path — re-skin to the SBC Tech theme, and polish to
the "Wibey" smoothness bar. We do **not** rebuild the agent: orchestration, models,
MCP, cron, skills, memory, or the multi-platform gateway all come from the upstream
hermes-agent (reached via the desktop app's main-process API / IPC + the agent's
HTTP/SSE on `127.0.0.1:8642`).

**North star:** a single, smooth, bring-your-own-model agent cockpit that *feels*
like Wibey (no modal gauntlets, no reloads, instant feedback) and renders rich
generative UI inline via OpenUI.

> **🎯 v2.0 MVP (the only thing that defines "done enough to switch to daily"):**
> **Phase 0 + Phase 1** — the fork boots on Mac, SBC Tech-skinned, and the chat
> **generates + renders + interacts with OpenUI inline like Wibey.** That's it.
> The other 10 features (Phases 2–6) are an explicit **post-MVP backlog** — add
> them when you feel the itch, not before. v2 is a **personal** app (hermes-agent
> brain, BYO-model); the Walmart v1 (`code_puppy_gui`) stays the work tool — no
> Walmart/BQ/Store-Trapped/Element-Gateway carryover here.

---

## 2. The golden rules (violate these and the build rots)

| # | Rule | Why |
|---|------|-----|
| 1 | **Never edit the upstream hermes-agent.** Agent behavior is upstream; if you feel the urge, it belongs in an MCP tool or a skill. We fork the *desktop frontend*, not the agent. | Keeps the agent upstream-mergeable. |
| 2 | **We fork `hermes-desktop` wholesale (no plugin SDK exists).** So discipline is internal: add features as **new screens/components**, keep deltas isolated, and **pin the upstream commit**. The OpenUI chat-renderer branch (`01`) stays the most surgical change. | The whole repo is the fork; isolation keeps upstream merges feasible. |
| 3 | **Re-skin via the existing `ThemeProvider` + Tailwind theme tokens**, never by hand-editing component styles. | Upstream-safe theming. |
| 4 | **Reuse Hermes primitives — no parallel systems.** PIV + Workflows reuse `checkpoint_manager`; Memory reuses the Hermes store + `session_search`; Workshop reuses `delegation.status`. | DRY. The whole thesis of v2. |
| 5 | **One OpenUI renderer, two mount points.** Inline-in-chat (`01`) and the Artifacts side canvas (`09`) share `@openuidev/react-lang`. Not two engines. | DRY. |
| 6 | **WCAG 2.2 AA on every surface** — icon-only buttons get `aria-label`, animations respect `prefers-reduced-motion`. | Non-negotiable. |
| 7 | **Personal project.** This is NOT Walmart infra → the Element Gateway / LLM-boundary rule does **not** apply. Bring-your-own-model freely (ChatGPT sub + Anthropic API + opencode providers). | Removes a constraint that applies to the *other* SBC Tech work. |

---

## 3. What we inherit for free (do not rebuild)

**From `hermes-desktop` (the fork base — UI chassis):**
- **Desktop chassis** — Electron 39 + React 19 + TS 5.9 + Tailwind 4 + Vite 7 + better-sqlite3 (FTS5). Hardcoded `screens/`: Chat, Sessions, Agents/Profiles, Models, Providers, Skills, Tools, Memory, Soul, Schedules, Gateway, Office, Settings, Install/Setup, Kanban, Discover.
- **Already-built polish** — guided installer, **token-usage footer** (≈ feature ④), sessions **FTS5 search**, big **memory system + providers** (≈ ⑪), **SOUL.md persona editor**, models/providers setup, cron **schedules** (≈ part of ⑫), **16 messaging gateways**, log viewer, backup/import, i18n.
- **Streaming pipeline** — SSE parsed in the **main** process (`src/main/sse-parser.ts`, `run-stream.ts`; shared `src/shared/chat-stream.ts`) → renderer via IPC (`window.hermesAPI`) → `screens/Chat/dashboardEventAdapter.ts`.
- **Inline interactive-card precedent** — `screens/Chat/ClarifyCard.tsx` already renders a non-markdown interactive React card in the chat stream that submits back into the run pipeline. **This is the pattern OpenUI inline (`01`) copies.**
- **NO plugin SDK** — adding features = editing the fork's source (new screens/components). Deliberate trade (see `APPENDIX_HERMES_DESKTOP` §A).

**From the upstream `hermes-agent` (the brain, via the desktop API / IPC / HTTP-SSE):**
- **Orchestrator brain** — `delegate_tool.py`; `delegation.status`, `delegation.pause`, `subagent.interrupt`. Spawns isolated sub-agents, parallelizes.
- **ACP adapter** — `acp_adapter/`; Hermes speaks Agent Client Protocol (the seam opencode/claude-code/gemini use). The Workshop is a window onto ACP/delegation traffic.
- **Bring-your-own-model** — native.
- **Memory** — `MEMORY.md`/`USER.md`/`SOUL.md` + `memory_tool.py` + Honcho user-modeling + `session_search` (`tools/session_search_tool.py`) + profiles (HERMES_HOME dirs) + context files.
- **Checkpoints** — `checkpoint_manager.py` (~61 KB): pause/resume engine. Powers PIV (`05`) AND Workflows (`12`).
- **Blueprints** — `tools/blueprints.py`: a skill with `metadata.hermes.blueprint.schedule` registers a Suggested Cron Job (used for the nightly daily-summary in `12`).
- **Slash commands** — `gateway/slash_commands.py` (~170 KB): home for `/profile /daily /notes /memory` (`11`).
- **Skills hub, cron, analytics, logs, env-keys, webhooks, themes/presets + ThemeSwitcher.**

---

## 4. The 12 features (the deltas we add)

> All "mechanism" = **a screen/component module in the fork** (no plugin SDK).
> **Status** is the honest build stance: **BUILD** = net-new · **ADOPT** = take
> what hermes-desktop ships + restyle · **EXTEND** = build on an existing capability.

| # | Feature | Status | Notes | Phase | Doc |
|---|---------|--------|-------|-------|-----|
| ① | OpenUI inline generative UI (generate + render + interact) | **BUILD** | the signature; renderer branch in `MessageRow` + always-on OpenUI context file; precedent `ClarifyCard` | **1 🎯MVP** | `01` |
| ② | Workshop pane | **BUILD** | live view + pause/interrupt shipped; one-off sub-agent chat parked | 2 | `02` |
| ③ | Session branching + lineage tree + Wibey tabs | **BUILD** | new screen; one session model, two entry points | 3 | `03` |
| ④ | Token / quota header pill | **ADOPT** | first header-pill pass shipped; click breakdown + threshold state | 2 | `04` |
| ⑤ | PIV loop (Plan→Implement→Validate) | **BUILD** | reuses upstream `checkpoint_manager`; renders PlanCard via ① | 3 | `05` |
| ⑥ | Knowledge Base (upload + viewer + URL ingest) | **EXTEND** | builds on existing sessions FTS5 search; no 2nd engine | 4 | `06` |
| ⑦ | Embedded terminal + CLI handoff (Send to opencode) | **BUILD** | binds hermes-desktop's real PTY (`terminal-launcher.ts`) | 4 | `07` |
| ⑧ | Prompt library / presets | **BUILD** | seeded from `memory/setting/prompts/`; Favorites parked (`08` §8) | 4 | `08` |
| ⑨ | Artifacts canvas | **BUILD** | shares the ① OpenUI renderer (2nd mount) | **1 🎯MVP** | `09` |
| ⑩ | Graphiti knowledge graph + Timeline | **BUILD** | the one heavy dep (Neo4j); criteria-first | 6 (last) | `10` |
| ⑪ | Personal Memory bridge | **ADOPT** | adopt hermes-desktop Memory UI + providers + SOUL.md; port only `/profile /daily /notes /memory` ergonomics | 4 | `11` |
| ⑫ | Workflows (build + execute) | **EXTEND** | extends existing cron/schedules; skill + slash + checkpoints | 4 | `12` |

> **MVP = ① + ⑨ (Phase 1) on the Phase-0 foundation.** Everything else is
> post-MVP backlog — independent deltas, build in any order.

**Dropped (do not build):** Confluence ingest (replaced by plain webpage fetch via
Hermes `web_tools`); the standalone Diff pane (not wanted). **Likely delete on
fork:** the three.js `Office`/Claw3d screen (bundle weight) and `posthog-js`
telemetry.

**Wibey is NOT a feature** — it's a UX quality bar (smooth, frictionless agent
launch + interaction). It's the north star for the Workshop + agent-launch flow.

---

## 5. Phase / build order

> **MVP = Phase 0 + 1.** Phases 2–6 are the **post-MVP backlog** (build any time,
> in any order you like — they're independent deltas, not a dependency chain).

| Phase | Build | Delivers |
|-------|-------|----------|
| **0 — Foundation** 🎯MVP | Fork `hermes-desktop` + pin + strip telemetry + boot `electron-vite dev` + hello-component + SBC Tech skin | A working SBC Tech-skinned desktop app (loop proven) |
| **1 — Signature** 🎯MVP | OpenUI inline ① (generate + render) + Artifacts ⑨ | Generative UI, one renderer, two mounts |
| **2 — Cockpit** | Workshop ② (read-only) + token pill ④ | Watch the orchestrator |
| **3 — Workbench DNA** | Branching ③ + PIV ⑤ | Fork timelines + structured plans |
| **4 — Knowledge & tools** | KB ⑥ + terminal ⑦ + prompts ⑧ + memory ⑪ + workflows ⑫ | The analyst toolkit + Francis's brain |
| **6 — Graph** | Graphiti ⑩ + Neo4j | Temporal lineage ("how did X evolve") |

> Phase 5 (Polish) folds into each phase's exit criteria (Wibey pass + a11y).
> Workshop read-only, pause, and interrupt are shipped. One-off sub-agent chat is
> deliberately parked for later and is not required to close Phase 2.

---

## 6. Phase 0 — Foundation (do this first, in order)

| Step | Do | Proves |
|------|-----|--------|
| 0.1 | Fork `fathah/hermes-desktop`, clone, set `upstream`, **pin a commit** (don't track `main`) | You own a pinned fork, not a moving target |
| 0.2 | `npm install` → `npm run dev` (electron-vite). Confirm chat works against a local/remote hermes-agent | Inherited chassis runs as-is |
| 0.3 | **Strip `posthog-js`** telemetry; optionally delete the `Office` (three.js) screen + deps | De-baggaged, slimmer bundle |
| 0.4 | Smallest source edit: render an SBC Tech marker in the header component | The source-edit loop works → every later feature attaches the same way |
| 0.5 | Re-skin via `ThemeProvider` + Tailwind theme tokens | SBC Tech skin = theme tokens, not hand-edits |
| 0.6 | Verify all green, then `git commit` the pinned fork + marker + skin | Foundation loop is reproducible + pinned |

**Exit criteria (all green):** ✅ pinned fork of hermes-desktop boots via
`electron-vite dev` · ✅ telemetry stripped · ✅ SBC Tech marker renders (source-edit
loop proven) · ✅ SBC Tech skin applies via theme tokens · ✅ committed. Hit them all →
start Phase 1.

> **No plugin seam here** — unlike the old `web/` plan, the "hello" proof is a
> direct source edit to the header component (there is no `@hermes/plugin-sdk` in
> hermes-desktop). The OpenUI chat-renderer branch (`01`) is the next change and
> the most surgical one — see `01_OPENUI_INLINE` + `APPENDIX_HERMES_DESKTOP` §B for
> the exact file (`screens/Chat/MessageRow.tsx`).

---

## 7. Per-doc anatomy (what every `01..12` contains)

Each feature doc follows the same shape so the laptop-agent can pick up any one
cold:

1. **What & why** — one paragraph, the user-visible outcome.
2. **Hermes primitive(s) it reuses** — the explicit anti-parallel-system mapping.
3. **Attach mechanism** — plugin / fork / theme, plus exact slot or seam.
4. **Build steps** — ordered, each with a "proves" check.
5. **Files touched** — and whether any are backend (should be ~never).
6. **Acceptance criteria** — green/red gates.
7. **Open questions / risks.**

---

## 8. Status & open items

### Current build status (2026-06-19)

- **Phase 0 — Foundation:** complete and committed.
- **Phase 1 — Signature MVP:** complete enough to move beyond MVP; OpenUI inline,
  interactions, accessibility pass, and Artifacts canvas are committed.
- **Phase 2 — Cockpit:** mostly complete. Workshop live view, pause/interrupt
  controls, and Token Pill first pass are committed. One-off sub-agent chat is
  parked for a later steering pass.
- **Next major phase:** Phase 3 — Branching + PIV, unless a stabilization pass is
  chosen first.

### Original handoff status

- **Scope:** COMPLETE and locked. 12 features, feasibility proven against real code
  (upstream: `delegate_tool`, `session_search`, `checkpoint_manager`, `blueprints`;
  base: hermes-desktop `MessageRow`/`AgentMarkdown`/`ClarifyCard`, SSE pipeline).
- **Base:** **fork `fathah/hermes-desktop`** (GO — see `APPENDIX_HERMES_DESKTOP`).
  Supersedes the earlier "fork `web/`" path. Trade accepted: no plugin SDK → all
  deltas are source edits.
- **Open reconciliation:** docs `02–12` still use "plugin"/slot wording from the
  `web/` era. Each is valid as a *capability* but should be re-read as
  "screen/component module." Reconcile per-feature during the walk-through.
- **Confirmed:** Artifacts shares the OpenUI renderer (✅); Workshop ships
  read-only first (✅); OpenUI inline has a working precedent (`ClarifyCard`) ✅.
- **Resolved (2026-06-14):**
  - **Target platform = macOS** (Francis's M4 Max). Phase 0 boot is on Mac, not Windows.
  - **OpenUI library confirmed** = `thesysdev/openui` (MIT, well-governed, no crypto).
    Package = **`@openuidev/react-lang` v0.2.6** (verified live) + `@openuidev/react-ui`
    (built-in components), `@openuidev/lang-core`, `@openuidev/cli`. Pin `0.2.x`.
  - **Terminal = real interactive PTY** (`src/main/terminal-launcher.ts`) — confirmed.
    No sidecar needed; the dock binds directly so any CLI runs (see `07`).
- **Reachy Mini** is a *future personal bolt-on*, NOT a v2 feature. See
  `docs/dawg-house-v2/APPENDIX_REACHY.md` if/when parked. Do not let it touch the
  build queue.

> Next deliverable after this doc set: execute Phase 0.

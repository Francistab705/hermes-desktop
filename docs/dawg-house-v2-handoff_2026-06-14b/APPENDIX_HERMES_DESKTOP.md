# Appendix — Evaluating `fathah/hermes-desktop` as the DAWG House v2 base

> **Investigation only — no code changed.** Deep dive performed 2026-06-14 by
> reading the v2 plan (`00`–`12`), the local upstream clone
> (`_clones/hermes-agent`, remote = NousResearch/hermes-agent), and the public
> repo `fathah/hermes-desktop` (fetched via the Walmart proxy, `/contents` API).
> Question: should v2 fork `hermes-desktop` instead of the Hermes `web/` dashboard,
> given **OpenUI inline is the #1 goal**?

---

## TL;DR — recommendation

**GO — fork `fathah/hermes-desktop` as the base.** It is the same upstream agent
(NousResearch/hermes-agent), the same stack the plan already targets (React 19 +
TS + Tailwind 4 + Vite + SQLite/FTS5), and — the decisive find — **it already
renders an interactive, non-markdown React card inline in the chat stream
(`ClarifyCard.tsx`)**. That is *exactly* the mechanism OpenUI inline needs
(submit-and-interact-in-the-window like Wibey), so the hardest part of the #1 goal
has a working precedent to copy.

**The one cost you accept:** `hermes-desktop` has **no plugin/slot SDK** (unlike
Hermes `web/`, which ships `@hermes/plugin-sdk`). Its UI is hardcoded `screens/`.
So the v2 thesis shifts from *"11 plugins + 1 fork"* to *"a maintained fork where
features are added as screens/components."* For a **personal** daily-driver that
is an acceptable trade — you get a polished installer, sessions, memory, providers,
schedules, and gateways for free, and you were going to fork the renderer for
OpenUI anyway.

**If you valued the plugin architecture above all**, stay on Hermes `web/`. But
OpenUI inline is the priority, and that is a renderer fork in **either** base —
so the plugin SDK doesn't save the feature you care most about.

---

## A) Extensibility — is there a plugin/slot system?

**No.** Evidence:

- `src/renderer/src/screens/` is a fixed set of hardcoded directories: `Chat`,
  `Agents`, `Memory`, `Models`, `Providers`, `Skills`, `Tools`, `Schedules`,
  `Gateway`, `Office`, `Sessions`, `Settings`, `Setup`, `Install`, `Kanban`,
  `Discover`, `Soul`, `Welcome`, `Layout`, `SplashScreen`. Adding a screen = adding
  a directory + wiring it into `App.tsx`/`Layout`.
- No `plugins/`, no `registerSlot`, no registry-of-components anywhere in
  `src/renderer` or `src/main`. (`src/main/registry.ts` + `src/shared/registry.ts`
  are the **model/provider** registry, not a UI plugin system.)
- `package.json` has no plugin-SDK dependency.

**Implication:** every DAWG delta (Workshop, PIV, Artifacts, KB, etc.) is added by
**editing the fork's source**, not by dropping in a plugin. This breaks Golden
Rule #2's letter ("exactly one sanctioned fork") — in this base, the *whole repo*
is your fork. That is normal for an app fork and fine for a personal build; just
go in eyes-open that upstream merges become manual.

---

## B) OpenUI fork surface — where the branch goes

The chat render path is clean and shallow:

```
screens/Chat/Chat.tsx           (orchestrator, ~22 KB)
  └─ screens/Chat/MessageList.tsx
       └─ screens/Chat/MessageRow.tsx        ← the per-message branch point
            └─ components/AgentMarkdown.tsx  ← current renderer: react-markdown + remark-gfm
```

- **`AgentMarkdown.tsx`** renders assistant text via `react-markdown` + `remarkGfm`,
  with a lazy-loaded `react-syntax-highlighter` `CodeBlock` and a `DiffView`.
- **The injection point** is `MessageRow.tsx` (or the top of `AgentMarkdown`):

  ```tsx
  // MessageRow.tsx — the one surgical branch
  import { Renderer, createLibrary } from "@openuidev/react-lang";
  import * as genui from "../../components/genui"; // ported DAWG library
  const library = createLibrary(genui);
  const isOpenUI = (t: string) => /^\s*root\s*=/.test(t);

  return isOpenUI(content)
    ? <Renderer source={content} library={library} streaming={isStreaming} />
    : <AgentMarkdown content={content} />;   // untouched fallback
  ```

- **Streaming model:** SSE is parsed in the **main** process
  (`src/main/sse-parser.ts`, `src/main/run-stream.ts`, shared types in
  `src/shared/chat-stream.ts`) and pushed to the renderer over IPC
  (`window.hermesAPI`), assembled by `screens/Chat/dashboardEventAdapter.ts`. The
  renderer receives **assembled text props** as tokens arrive — so the
  streaming-aware `@openuidev` `Renderer` (materializes partial trees) drops in
  without touching the transport. No new SSE work.

### The killer precedent: `ClarifyCard.tsx`

`screens/Chat/ClarifyCard.tsx` (+ its test) is an **interactive React card already
rendered inline in the message stream** — it presents options and submits a
response back into the chat pipeline. This proves three things you need for
OpenUI inline:

1. The message stream can render arbitrary interactive React (not just markdown).
2. There is an existing pattern for a card to **call back into the send/run
   pipeline** (i.e., "submit and interact in the window" already works here).
3. You can copy `ClarifyCard`'s wiring to make OpenUI components (e.g. `FollowUps`,
   `Form`) fire messages — the Wibey behavior — instead of inventing it.

This single file is the strongest argument for choosing `hermes-desktop`.

---

## C) Fork cost — what hitting the #1 goal actually requires

| # | Task | Where | Notes |
|---|------|-------|-------|
| 1 | `npm i @openuidev/react-lang` | `package.json` | confirm prop names vs installed version |
| 2 | Port DAWG genui library → `src/renderer/src/components/genui/` | new dir | from `frontend/src/components/genui/` (Stack, ChartCard, DataTable, KPIRow, Callout, CodeBlock, Form, Timeline, PlanCard, FollowUps) |
| 3 | Add the `isOpenUI` branch | `screens/Chat/MessageRow.tsx` | the one detector + `Renderer` |
| 4 | Wire interactive callbacks (submit-in-window) | copy `ClarifyCard.tsx` pattern | make `FollowUps`/`Form` dispatch into the send pipeline (Wibey) |
| 5 | Theme the genui components to DAWG tokens | Tailwind 4 theme | reuse hermes-desktop's `ThemeProvider` |
| 6 | a11y pass (WCAG 2.2 AA) + streaming flicker test | Chat | partial-tree paint stability |

**npm deps to add:** `@openuidev/react-lang` (+ whatever it peer-deps). Everything
else (react-markdown fallback, syntax highlighter, SQLite, streaming) already
exists.

**Risks:**
- `@openuidev/react-lang` API drift (`source` vs `code`, streaming flag) — verify.
- Telemetry: `posthog-js` is a dependency → the app phones home to PostHog by
  default. For a personal build, **rip it out or null the key** in your fork.
- Heavy deps: `three`, `@react-three/fiber`, `troika-three-text` power the 3D
  "Office" (Claw3d). You'll likely delete that screen to slim the bundle.
- No plugin SDK → all other features are source edits (see A).

---

## D) Base comparison

| Criterion | Fork `hermes-desktop` (Electron) | Fork Hermes `web/` (browser) | Thin Electron shell around `web/` |
|---|---|---|---|
| **Form factor** | Native desktop app (matches the M4-Max daily-driver vision) | Browser tab | Desktop, but you build the shell |
| **Features inherited free** | **~90%** — installer, sessions+FTS5, memory+providers, SOUL.md, models, providers, schedules/cron, 16 gateways, token footer, log viewer, backup | ~80% — dashboard pages + plugin SDK | ~80% (same as web/) + you own the shell plumbing |
| **OpenUI inline work** | **Identical** renderer fork; **+ `ClarifyCard` precedent** | Identical renderer fork; no inline-card precedent found | Identical renderer fork |
| **Plugin SDK** | ❌ none — features = source edits | ✅ `@hermes/plugin-sdk` (registerSlot) | ✅ (web/ retains it) |
| **Upstream-merge cost** | Manual (whole-repo fork) | Low for plugins, manual for the 1 fork | Low for web/ plugins; shell is yours |
| **Extra baggage** | PostHog telemetry, 3D Office, $HD token in README | minimal | minimal |
| **Effort to first OpenUI demo** | **Lowest** (precedent + polished chat) | Medium | Highest (build shell first) |

**Read:** OpenUI is a wash across all three (it's a renderer fork everywhere).
`hermes-desktop` wins on *inherited polish* and *a working interactive-inline-card
precedent*; it loses on *plugin cleanliness*. For a personal desktop daily driver
where OpenUI inline is the point, the precedent + polish outweigh the plugin SDK.

---

## E) Due diligence

- **License:** MIT (per repo badge + `LICENSE`). ✅ Fork-friendly. *(Verify the
  `LICENSE` file text on fork.)*
- **Activity / maturity:** ~12k stars, active; README warns *"in active
  development… some things might break."* Treat upstream as a moving target — pin
  a commit when you fork.
- **Telemetry:** `posthog-js` ships in `dependencies` → the app sends analytics by
  default. **Remove/disable in your personal fork.**
- **Crypto token:** README advertises a `$HD` token (bankr.bot). It's marketing,
  not in the code path, but it signals the project has a token-hype dimension —
  weigh that for "is this my long-term foundation." Doesn't block a pinned fork.
- **Coupling:** depends on upstream `hermes-agent` for all agent behavior (good —
  same as your plan). Desktop-specific concerns (installer, SSH remote, sandbox
  scripts, GPU fallback) are extra surface you inherit but can ignore.

**Verdict:** safe to build on **as a pinned personal fork** with telemetry stripped.
Not something to treat as an upstream you blindly track.

---

## If we fork `hermes-desktop` — concrete step list

1. **Fork + pin.** Fork on GitHub, clone, `git remote add upstream …`, pin to a
   known-good commit (don't float on `main`).
2. **Boot it.** `npm install` → `npm run dev` (electron-vite). Confirm chat works
   against a local/remote Hermes.
3. **De-baggage.** Remove `posthog-js` calls; optionally delete the `Office`
   (Claw3d/three.js) screen + deps to slim the bundle.
4. **OpenUI inline (the #1 goal):** add `@openuidev/react-lang`, port `genui/`,
   add the `isOpenUI` branch in `MessageRow.tsx`, and wire interactive callbacks by
   copying `ClarifyCard.tsx`. Ship the Wibey submit-in-window demo.
5. **Re-skin** to DAWG tokens via the existing `ThemeProvider`/Tailwind theme.
6. **Then layer the remaining deltas as screens/components** (Artifacts shares the
   OpenUI renderer; PIV reuses upstream `checkpoint_manager`; Workshop reads
   `delegation.status`; KB; branching/tabs; CLI handoff). Each is a source edit, not
   a plugin.
7. **a11y + tests** per existing Vitest setup; add streaming-stability checks.

---

## GO / NO-GO

**GO on `hermes-desktop` as the base** — *given OpenUI inline is the top priority.*
The interactive-inline-card precedent (`ClarifyCard`) plus ~90% inherited polish
make it the fastest path to the Wibey submit-and-interact goal, and the OpenUI
fork is identical work in any base. **Accept** the loss of the plugin SDK (features
become source edits) and **strip** telemetry on fork.

**Open risks to track:** `@openuidev/react-lang` is **confirmed** (v0.2.6,
thesysdev/openui, MIT, no crypto) — pin `0.2.x` and verify props · upstream
hermes-desktop churn (pin it) · bundle weight from three.js Office (delete) ·
PostHog (remove) · whole-repo fork means manual upstream merges. **Resolved:**
target = macOS (M4 Max); terminal-launcher.ts is a real PTY (no sidecar).

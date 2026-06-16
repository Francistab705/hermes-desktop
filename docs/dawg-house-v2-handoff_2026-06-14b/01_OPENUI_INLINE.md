# 01 — OpenUI Inline Generative UI (Feature ①)

> **Phase:** 1 (Signature) · **Mechanism:** the ONE sanctioned source fork +
> npm package · **Pairs with:** `09_ARTIFACTS` (same renderer, second mount point)

---

## 1. What & why

Code Puppy / DAWG House answers are richer than markdown: KPI rows, charts, data
tables, callouts, timelines, plan cards. **OpenUI Lang** is the compact,
streaming-friendly DSL that expresses those as a single `root = Component(...)`
expression. This feature makes the chat stream **render OpenUI inline** — when an
assistant message is OpenUI Lang, it materializes as live React components instead
of a code fence; when it's plain markdown, it falls back to the normal renderer.

User-visible outcome: ask "summarize Q1 pet sales" → get a `KPIRow + ChartCard +
Callout + FollowUps`, rendered inline, streaming left-to-right.

> **Feature ① has TWO halves — don't ship only one.** *Rendering* (below) is the
> back half. *Generation* (§2.5) is the front half: the agent must be **taught** to
> emit OpenUI Lang, or the renderer never has anything to render. MVP = both.

---

## 2.5 The generation side (teach the agent to emit OpenUI Lang)

The renderer only fires when an assistant reply *starts with* `root = …`. For that
to ever happen, **hermes-agent must know the OpenUI Lang DSL + your component
library signatures.** This is a prompt/context concern, not a UI one.

**Mechanism (LOCKED — always-on context file, not a skill):**
- The OpenUI spec lives as an **always-on context file mounted on the DAWG
  hermes-agent profile** — NOT a skill. Rationale: you *always* want the agent able
  to choose UI, so it must be in-context every turn; an auto-surfaced skill could
  miss. (A skill only makes sense if you later want UI gated to specific tasks.)
- Its body is *exactly* the kind of spec this very project's system prompt already
  uses: the **"OpenUI Lang quick reference"** (syntax, positional-args rule,
  `root =` first-token rule, never-mix-with-markdown) **+ the DAWG component library
  signatures** (Stack, ChartCard, DataTable, StatTile, KPIRow, FollowUps, Callout,
  CodeBlock, Form, Timeline, PlanCard) **+ the "when to emit OpenUI vs markdown"
  guidance.**
- Mount it via hermes-desktop's context-files / profile config (always-on for the
  DAWG profile).
- **Single source of truth:** `@openuidev/react-lang`'s `createLibrary` can emit
  prompt instructions *from the registered components* (OpenUI's "prompt generation
  from your library"). Prefer generating the signature block from the library so the
  **prompt and the renderer never drift**. Hand-maintained specs rot.
- **Interaction loop (the Wibey bit):** interactive components (`FollowUps`, `Form`)
  dispatch a new message back into the run — copy `ClarifyCard.tsx`'s callback
  wiring. Generation + render + interact = the full loop.

> Without §2.5 the renderer is a beautiful engine with no fuel. Build it in the
> same Phase-1 pass as the renderer.

---

## 2. Hermes primitive(s) it reuses

- Hermes already renders assistant messages through a **markdown renderer**
  (`web/src/.../Markdown.tsx`, mounted by `ChatPage.tsx`). We don't replace it —
  we **wrap** it with a detector.
- Streaming tokens already arrive over the gateway WS. The OpenUI renderer is
  **streaming-aware** (`@openuidev/react-lang` materializes partial trees), so it
  rides the existing token stream with no new transport.

---

## 3. The package + the components

- **npm:** `@openuidev/react-lang` (v0.2.6, **verified live**) → exports `Renderer` +
  `createLibrary`. Source: `thesysdev/openui` (MIT, well-governed, no crypto token).
  Siblings if useful: `@openuidev/react-ui` (built-in chart/form/table components —
  may save porting some genui), `@openuidev/lang-core`, `@openuidev/cli` (scaffolder).
- **Components to port:** copy the existing DAWG House genui library from
  `frontend/src/components/genui/` (the V1 set: `Stack, ChartCard, DataTable,
  StatTile, KPIRow, FollowUps, Callout, CodeBlock, Form, Timeline, PlanCard`).
  These are already written and battle-tested — this is a copy-paste + wire-up,
  not a rewrite.
- Register them via `createLibrary({ Stack, ChartCard, ... })` once, export the
  configured `Renderer`.

---

## 4. Why this is a fork, not a plugin

There is no plugin SDK in hermes-desktop, and even if there were, slots sit *around*
the chat, not *inside* a message bubble. To swap the renderer **per assistant
message** you edit the message-rendering path directly — `screens/Chat/MessageRow.tsx`
(which currently renders `components/AgentMarkdown.tsx`). Keep it surgical: a
detector + a branch. The interactive-card precedent is `screens/Chat/ClarifyCard.tsx`.

---

## 5. The seam (detector + branch)

```tsx
// src/renderer/src/screens/Chat/MessageRow.tsx  (the branch point)
import { Renderer, createLibrary } from "@openuidev/react-lang";
import * as genui from "../../components/genui";   // ported DAWG library
import AgentMarkdown from "../../components/AgentMarkdown"; // the existing renderer

const library = createLibrary(genui);

// Heuristic: an OpenUI message's first non-whitespace token is `root =`.
function isOpenUI(text: string): boolean {
  return /^\s*root\s*=/.test(text);
}

export function MessageBody({ content, streaming }: {
  content: string; streaming: boolean;
}) {
  if (isOpenUI(content)) {
    // Renderer is streaming-aware: pass partial content as it arrives.
    return <Renderer source={content} library={library} streaming={streaming} />;
  }
  return <Markdown>{content}</Markdown>;   // untouched fallback path
}
```

**Detector contract:** OpenUI replies are guaranteed to start with `root =` as the
very first token (this is enforced by the system prompt that produces them). Plain
prose never does. The detector is therefore a cheap prefix test — no parsing
needed to decide the branch.

---

## 6. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 1.0 | **Generation:** author the OpenUI context-file/skill (DSL ref + library signatures + when-to-emit), mount it on the DAWG hermes-agent profile | The agent can *produce* `root = …` (front half) |
| 1.1 | `npm i @openuidev/react-lang` in the fork | Package resolves |
| 1.2 | Port DAWG genui library → `src/renderer/src/components/genui/`, fix imports | Component library compiles |
| 1.3 | Add the detector + `createLibrary` wire-up (in `MessageRow`/a `MessageBody` helper) | Renderer instantiates |
| 1.4 | Branch the render path in `screens/Chat/MessageRow.tsx` (OpenUI → `Renderer`, else → `AgentMarkdown`) | OpenUI renders; markdown still falls back |
| 1.5 | Wire interactive callbacks (copy `ClarifyCard.tsx`) so `FollowUps`/`Form` dispatch new messages | Submit-and-interact-in-window (Wibey) works |
| 1.6 | Stream test: reply emits a `Stack([...])` token-by-token | Partial tree materializes mid-stream, no flicker |
| 1.7 | a11y pass: chart text alternatives, contrast AA, `prefers-reduced-motion` | WCAG 2.2 AA |
| 1.8 | Commit | Pinned + documented |

---

## 7. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| OpenUI context-file/skill (on the DAWG hermes-agent profile) | new | Agent-side config (not a fork) |
| `package.json` (+ lockfile) | edit (add dep) | No |
| `src/renderer/src/components/genui/*` | new (ported) | No |
| `src/renderer/src/screens/Chat/MessageRow.tsx` | **edit** (the detector branch) | No |
| (reuse) `src/renderer/src/screens/Chat/ClarifyCard.tsx` | pattern to copy for interactivity | No |

---

## 8. Acceptance criteria

- ✅ An assistant message beginning `root = …` renders as live components.
- ✅ **Generation works:** with the OpenUI context/skill mounted, the agent actually
  *emits* `root = …` for UI-shaped answers (not just markdown).
- ✅ **Interactive:** clicking a `FollowUps` chip / submitting a `Form` dispatches a
  new message into the run (Wibey submit-in-window).
- ✅ A normal markdown message renders exactly as before (zero regression).
- ✅ Streaming: partial component trees appear as tokens arrive; final paint is
  stable (no full re-render flash).
- ✅ All ported components render with the DAWG theme tokens (no hard-coded
  colors — pull from the theme).
- ✅ WCAG 2.2 AA on every component.
- ✅ The renderer branch is isolated to `MessageRow.tsx` and the generation spec
  is a single mounted context/skill (both noted in `00` Rule 2's ledger).

---

## 9. Open questions / risks

- **Renderer API:** package confirmed = `@openuidev/react-lang` v0.2.6 (pin `0.2.x`).
  Still confirm exact prop names (`source` vs `code`, streaming flag) against the
  installed version — the seam above is illustrative, and 0.2.x may still move.
- **Markdown-with-embedded-OpenUI:** the rule is "never mix" — a reply is *either*
  OpenUI *or* markdown. The detector enforces that; don't try to render both in one
  bubble.
- **Theme coupling:** ensure ported components read DAWG theme tokens, not the
  old DAWG House Tailwind classes, so they re-skin via `themes/presets.ts`.

# SBC Tech v2 — Handoff Doc Set

Build SBC Tech v2 as a **fork of `fathah/hermes-desktop`** (Electron desktop GUI
for the same NousResearch/hermes-agent) + 12 added features. **Start with
`00_OVERVIEW.md`** — it defines the rules, the phases, and what we inherit for free.
Then work the feature docs in phase order.

> **Base decision (2026-06-14):** fork `hermes-desktop`, NOT the agent's `web/`
> dashboard. Full rationale + GO call in **`APPENDIX_HERMES_DESKTOP.md`**. Key
> consequence: hermes-desktop has **no plugin SDK**, so every feature is a
> **screen/component module in the fork**, not a plugin. OpenUI inline (`01`) is a
> renderer change in any base — so this choice costs nothing on the #1 goal, and
> wins ~90% inherited polish + a working inline-card precedent (`ClarifyCard.tsx`).

## Read order

1. **`00_OVERVIEW.md`** — master plan, golden rules, Phase 0 steps. **Read first.**
2. Then per phase:

| Phase | Docs |
|-------|------|
| 0 — Foundation | `00` §6 |
| 1 — Signature | `01_OPENUI_INLINE` |
| 2 — Cockpit | `02_WORKSHOP`, `04_TOKEN_PILL` |
| 3 — Branching | `03_BRANCHING` |
| 4 — PIV Loop | `05_PIV` |
| 5 — Knowledge Base | `06_KNOWLEDGE_BASE` |
| 6 — Terminal Handoff | `07_TERMINAL` |
| 7 — Prompt Library | `08_PROMPT_LIBRARY` |
| 8 — Personal Memory Bridge | `11_PERSONAL_MEMORY` |
| 9 — Workflows | `12_WORKFLOWS` |
| 10 — Saved Artifacts | `09_ARTIFACTS` |
| 11 — Sub-agent Chat | `02_WORKSHOP` §Phase 11 Follow-up |
| 12 — Graph (last) | `10_KNOWLEDGE_GRAPH` |

Appendix: `APPENDIX_HERMES_DESKTOP.md` — **base-choice deep dive (GO)**: why we
fork hermes-desktop, the OpenUI fork surface, fork cost, and risks. **Read with `00`.**
Appendix: `APPENDIX_REACHY.md` — a **future personal bolt-on**, NOT a build-queue
feature. Parked so it's not forgotten.

## The thesis in one line

Inherit hermes-desktop's chassis for free (~90%); add the deltas as
**screens/components in the fork** (+ the OpenUI renderer change in the chat path);
re-skin via the Tailwind theme; polish to the Wibey feel. **Reuse primitives —
never build a parallel system** (adopt/extend what hermes-desktop already ships).

## Golden rules (full list in `00` §2)

1. Never edit the upstream hermes-agent (fork the desktop frontend, not the agent).
2. We fork hermes-desktop wholesale (no plugin SDK) — features = isolated screens/components; pin upstream.
3. Re-skin via the existing `ThemeProvider` + Tailwind tokens, not hand-edited styles.
4. Reuse primitives — no parallel systems (PIV/Workflows → `checkpoint_manager`;
   Memory → adopt hermes-desktop memory + `session_search`; Workshop → `delegation.status`).
5. One OpenUI renderer, reused everywhere (inline `01` + saved artifacts `09`).
6. WCAG 2.2 AA everywhere.
7. Personal project → no Element Gateway / LLM-boundary constraint; bring-your-own-model.

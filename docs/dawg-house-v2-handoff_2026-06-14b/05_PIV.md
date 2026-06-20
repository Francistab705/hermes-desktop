# 05 — PIV Loop: Plan → Implement → Validate (Feature ⑤)

> **Phase:** 5 (PIV Loop) · **Mechanism:** new screen/component module reusing
> `checkpoint_manager` (no fork) · **Source:** DAWG House Epic 29 (shipped 2026-05-31, ADR 0003)

---

## 1. What & why

A structured agent loop: the agent first emits a **PlanCard** (the PLAN phase),
the human reviews/approves, then it **Implements**, then it **Validates** by
running a concrete check. Turns "vibe coding" into a reviewable, checkpointed
workflow. The PlanCard is an OpenUI component (renders via feature ①).

---

## 2. Hermes primitive(s) it reuses

- **`checkpoint_manager.py`** (~61 KB) — the pause/resume engine. PIV phases are
  checkpoints: PLAN (pause for approval) → IMPLEMENT → VALIDATE (run the strategy).
  **Same engine that powers Workflows (`12`)** — no parallel orchestration.
- **OpenUI renderer (`01`)** — `PlanCard` is emitted as the `root` of the reply
  during the PLAN phase and rendered inline.

---

## 3. The PlanCard contract (already specced)

```
PlanCard(
  title,                // short name of the change
  intent,              // 1–2 sentences: WHY, not HOW
  steps: [{label, detail}],   // 1–10 ordered steps
  files_to_touch: [string],   // may be empty for investigation-only
  validation_strategy,        // a RUNNABLE instruction — becomes the VALIDATE prompt
)
```

- Emit a PlanCard **only** during the PLAN phase (the runtime enrichment header
  signals when).
- `validation_strategy` is not prose — it's the literal command/prompt that fires
  in VALIDATE (e.g. `uv run pytest tests/test_x.py -v`).

---

## 4. Attach mechanism

- Plugin that:
  - injects PLAN-phase UI (approve / edit / reject the PlanCard) via a chat slot,
  - drives checkpoint transitions through the SDK `api` client into
    `checkpoint_manager`,
  - renders phase state (PLAN ⏸ / IMPLEMENT ▶ / VALIDATE ✅❌).

---

## 4.5 Global PIV mode toggle (ON / OFF)

PIV is a *mode*, not always-on. v1 surfaces a header control ("**PIV mode: OFF**")
that globally arms/disarms the loop:

- **OFF (default):** the agent answers normally — no PlanCard, no checkpoints.
- **ON:** the agent enters the PLAN→IMPLEMENT→VALIDATE loop for actionable
  requests (emits a PlanCard as `root` in the PLAN phase).

Mechanism: a header toggle (direct mount in hermes-desktop's header component) backed by a single UI
flag (`pivStore`/`uiStore`). When ON, the run injects the PLAN-phase enrichment
header that tells the agent to emit a PlanCard; when OFF, that header is absent
and nothing else changes. **No backend edit** — the flag just gates which prompt
enrichment is sent. State persists across reloads (local setting).

---

## 5. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 5.1 | Render PlanCard inline (depends on `01`) with Approve/Edit/Reject | Plan is reviewable |
| 5.1b | Global **PIV mode** toggle in the header (ON/OFF) gating PLAN-phase enrichment | PIV is an armable mode, off by default |
| 5.2 | On Approve → create a checkpoint, advance to IMPLEMENT | Checkpoint engine drives phases |
| 5.3 | After implement → run `validation_strategy`, capture pass/fail | Validation is concrete |
| 5.4 | Phase indicator + ability to pause/resume mid-loop | Steerable loop |
| 5.5 | Reject/edit loops back to PLAN | Closed loop |
| 5.6 | a11y + commit | WCAG 2.2 AA |

---

## 6. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| `web/plugins/piv/index.tsx` | new | No |
| `web/plugins/piv/PlanReview.tsx` | new | No |
| `web/plugins/piv/phaseMachine.ts` | new | No |
| `web/src/components/genui/PlanCard.tsx` | ported in `01` | No |

---

## 7. Acceptance criteria

- ✅ PLAN phase emits exactly one PlanCard as `root`; rendered inline.
- ✅ Global PIV-mode toggle arms/disarms the loop (OFF by default); OFF = normal
  answers, ON = PLAN→IMPLEMENT→VALIDATE. Toggle state persists across reloads.
- ✅ Approve advances via `checkpoint_manager` (not a bespoke state store).
- ✅ VALIDATE runs the literal `validation_strategy` and reports pass/fail.
- ✅ Pause/resume works mid-loop; reject returns to PLAN.
- ✅ Shares the checkpoint engine with Workflows (`12`) — verify no duplicate
  orchestration code.
- ✅ WCAG 2.2 AA.

---

## 8. Open questions / risks

- Confirm `checkpoint_manager` exposes the phase/checkpoint API the plugin needs
  through the gateway (it should — it's the same surface Workflows uses).
- Guard against emitting PlanCards outside the PLAN phase (system-prompt rule).

# 04 — Token / Quota Header Pill (Feature ④)

> **Phase:** 2 (Cockpit) · **Mechanism:** **ADOPT + restyle** the existing
> hermes-desktop token footer (do NOT rebuild) · extend only with quota/breakdown
> **Status:** Phase 2 closed. First header-pill pass shipped in `033884f`.

---

## 1. What & why

> **Base note:** hermes-desktop already ships a live token-usage footer (prompt/
> completion counts + cost) plus a `/usage` slash command. **Adopt it** — restyle to
> the DAWG header pill, add only click-to-expand breakdown + quota states. Rebuilding
> a parallel meter would violate Rule 4 (DRY).

A small always-visible pill in the header showing live token usage / quota for the
current model + session — so Francis never gets surprised by burn. Click to expand
a breakdown (per-model, per-session, remaining quota for the ChatGPT sub /
Anthropic API).

---

## 2. Hermes primitive(s) it reuses

- Hermes already tracks usage for **Analytics** (`AnalyticsPage`) and meters model
  calls. The pill is a **compact live read** of that same data — not a new meter.
- Bring-your-own-model means quota differs per provider; read provider/usage from
  the existing models/analytics API.

---

## 3. Attach mechanism

- `registerSlot("header-right", "token-pill", <TokenPill/>)`.
- Poll or subscribe to the usage endpoint via the SDK `api` client / `buildWsUrl`.

---

## 4. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 4.1 | Mount `TokenPill` in the Chat header | ✅ pill renders in header |
| 4.2 | Wire to existing chat usage/context state | ✅ live numbers appear when usage is available |
| 4.3 | Click → popover breakdown (provider/model/context/cache/cost) | ✅ detail works |
| 4.4 | Threshold color states (ok / warn / critical) using semantic tokens | ✅ at-a-glance burn |
| 4.5 | a11y: `aria-label`, contrast AA, non-color signal for state | ✅ baseline WCAG pass |
| 4.6 | Commit | ✅ shipped in `033884f` |

---

## 5. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| `web/plugins/token-pill/index.tsx` | new | No |
| `web/plugins/token-pill/TokenPill.tsx` | new | No |

---

## 6. Acceptance criteria

- ✅ Pill always visible in `header-right`, updates live.
- ✅ Click reveals a per-model / quota breakdown.
- ✅ Color state has a non-color companion cue (icon/text) for a11y.
- ✅ WCAG 2.2 AA.

Note: remaining-quota semantics are still provider-dependent. The shipped pill
shows "Unknown quota" when the provider does not expose a reliable remaining
quota value.

**Phase 2 closeout:** accepted. Further quota-provider precision is polish, not a
Phase 2 blocker.

---

## 7. Open questions / risks

- Confirm the usage read surface (REST endpoint vs WS) on Hermes Analytics.
- Quota semantics differ ChatGPT-sub vs Anthropic-API — handle "unknown quota"
  gracefully (show usage, hide remaining).

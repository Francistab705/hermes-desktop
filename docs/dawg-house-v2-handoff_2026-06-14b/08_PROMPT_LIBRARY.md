# 08 — Prompt Library / Presets (Feature ⑧)

> **Phase:** 4 (Knowledge & tools) · **Mechanism:** new screen/component module in the fork ·
> **Source:** LibreChat (the pattern, not the code)

---

## 1. What & why

A library of saved, reusable prompts/presets Francis can pick, parameterize, and
fire into a chat — his muscle-memory kickoffs (role, communication, sql, code,
workflow starters) made one click away.

---

## 2. Relationship to Personal Memory (`11`)

- Francis's `memory/setting/prompts/*.md` (role.md, sql.md, code.md, …) are the
  seed content for this library.
- **Always-on** prompts (role, communication) map to Hermes **context files**
  (`11`) — they shape every conversation, not picked from a library.
- **Topical** prompts (sql, code, workflow) become **library presets** here AND/OR
  Hermes skills (`11` inject mapping). The prompt library is the *manual picker*;
  skills are the *auto-surfaced* path. Both ride the same content — DRY.

---

## 3. Attach mechanism

- Plugin page `Prompts` + a `chat:top` quick-picker (insert preset into composer).
- Storage: plugin data dir (JSON/SQLite). Optional sync from
  `memory/setting/prompts/`.

---

## 4. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 8.1 | Prompts page: list/create/edit/delete presets | CRUD works |
| 8.2 | Seed from `memory/setting/prompts/*.md` | Existing kickoffs available |
| 8.3 | Variables/placeholders in presets (fill before send) | Parameterized prompts |
| 8.4 | `chat:top` quick-picker inserts a preset into the composer | One-click fire |
| 8.5 | a11y + commit | WCAG 2.2 AA |

---

## 5. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| `web/plugins/prompts/index.tsx` | new | No |
| `web/plugins/prompts/Library.tsx`, `QuickPicker.tsx` | new | No |

---

## 6. Acceptance criteria

- ✅ Full CRUD on presets; seeded from existing prompt files.
- ✅ Placeholder variables filled before insertion.
- ✅ Quick-picker inserts into the composer without a reload.
- ✅ No duplication of always-on context (those live as context files in `11`).
- ✅ WCAG 2.2 AA.

---

## 7. Open questions / risks

- Decide the single source of truth for topical prompt content: library store vs
  skills body. Pick one and reference (don't copy) from the other.

---

## 8. Future / deferred — Favorites (NOT building yet)

> **Status: parked.** Structure noted so it's a cheap drop-in later; do NOT build
> in the first pass (YAGNI).

v1 has a `favoritesStore.ts` — a way to star/pin things for quick access. When we
want it, the cheapest path is to **ride on this Prompt Library** rather than stand
up a separate feature:

- A `favorite: boolean` flag on each preset record (the library store already
  persists presets — add one field).
- A "★ Favorites" filter at the top of the `Prompts` page + a favorites-first
  ordering in the `chat:top` quick-picker.
- If favorites later need to span more than presets (sessions, KB docs, queries),
  *then* promote it to its own small store — but not before there's a real second
  use case.

**Build trigger:** only when Francis actually misses it. Until then, the seam is
the `favorite` flag + a filter — nothing else.

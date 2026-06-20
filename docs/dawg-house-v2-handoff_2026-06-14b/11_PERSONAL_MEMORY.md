# 11 — Personal Memory Bridge (Feature ⑪)

> **Phase:** 9 (Personal Memory Bridge) · **Mechanism:** **Approach C (hybrid)** —
> Hermes OWNS the store; we port only Francis's distinctive *ergonomics* as a thin
> layer · This is the richest-specced feature (4 banked decision drawers).

---

## 1. What & why

> **Base note:** hermes-desktop already ships a **Memory screen** (view/edit
> entries, user-profile memory, capacity), **memory providers** (Honcho, Mem0, etc.),
> and a **SOUL.md persona editor**. **Adopt those UIs as-is**; this feature ports
> only Francis's *ergonomics* (the `/profile /daily /notes /memory` commands +
> inject mapping) on top. Do NOT build a parallel memory UI (Rule 4, DRY).

Bring Francis's personal-memory muscle memory into Hermes **without standing up a
parallel memory system**. He has: a durable profile, daily logs, a notes inbox,
reusable preference files pulled into prompts via `→ inject:`, toggled by
`.enabled.json`, and four commands: `/profile`, `/daily`, `/notes`, `/memory`.

**Decision (Approach C, locked):** Hermes is the single source of truth for "who is
Francis" (`MEMORY.md` / `USER.md` / `SOUL.md` + `memory_tool.py` + Honcho +
`session_search` + profiles + context files). Do **not** run the old
`markdown_memory` plugin in parallel (that's two sources of truth = DRY violation).
Port only the **ergonomics** on top of Hermes.

---

## 2. Content migration map

| Francis's thing | Migrates to (Hermes) |
|-----------------|----------------------|
| Durable profile (`Profile — Francis`) | `USER.md` |
| `/daily` log, `/notes` inbox | Hermes memory store |
| `preferences/*.md` (store_trapped, airtable, analytical_readiness) | Hermes **context files** (always-on) or **skills** (topical) — see §4 |
| `prompts/*.md` (role, communication, sql, code, workflow) | context files (always-on) / prompt library `08` (topical) |

---

## 3. The four commands → Hermes slash commands

Home: `gateway/slash_commands.py` (~170 KB). Implement each as a slash command:

| Command | Behavior | Maps to |
|---------|----------|---------|
| `/profile <text>` | append to durable profile (overwrite-merge, never duplicate) | write `USER.md` via `memory_tool` |
| `/daily <text>` | append to today's notes log | memory store (dated) |
| `/notes <text>` | quick note to inbox | memory store (inbox) |
| `/memory <query>` | search memory (`--history`, `--all`) | **fan-out** — see §5 |

---

## 4. The `→ inject:` mechanism → split by behavior

Francis's thin-prompt directive (`→ inject: preferences/X.md`, toggled by
`.enabled.json`) splits into **two** Hermes mappings:

1. **Always-on injects** (role.md, communication.md — wanted *every* session) →
   Hermes **context files** (they natively "shape every conversation").
2. **Topical/conditional injects** (airtable.md, sql.md, store_trapped.md — only
   when doing that work) → Hermes **skills**, where each preference file becomes a
   skill whose *body* is the preference content. Hermes **auto-surfaces skills by
   relevance** OR fires them by slash command. **This is an upgrade:** today injects
   are manual (`→ inject:`); Hermes can auto-load topical context by relevance.
3. **`.enabled.json` toggle** → Hermes **skill enable/disable** + context-file
   selection (same gesture).

> Worked examples to write into this doc when building: `airtable`, `sql`,
> `store_trapped` preference files becoming skills.

---

## 5. `/memory <query>` → ONE command, fan-out across THREE+ native backends

Verified against `tools/session_search_tool.py`. **No new search engine.**

Hermes `session_search()` is a **single tool, 4 modes** inferred from args:
- **DISCOVERY** — `query="..."` → core search.
- **READ** — `session_id` (no anchor) → dump a whole past conversation.
- **SCROLL** — `session_id` + `around_message_id` (+ window) → jump to a moment
  with a context window.
- **BROWSE** — no args → list/browse recent sessions.
- Plus `profile=` → **cross-profile** search (reads another profile's sessions,
  resolves `@session:<profile>/<id>` links).

`/memory <query>` fans out and unifies:

| Flag | Backend | Hermes mechanism |
|------|---------|------------------|
| `--history` | conversation history | `session_search` Discovery/Read/Scroll (richer than today — scroll + context windows for free) |
| `--all` | across everything | `session_search(profile=…)` cross-profile |
| (default) | notes / profile / daily | Hermes memory store (where this feature migrates them) |
| (default) | KB docs | KB index (feature `06`, its own search) |

Result: `/memory` is one slash command that queries history + cross-profile +
memory store + KB and unifies results. **Upgrade over today**, zero new engine.

---

## 6. Daily log + summary (folds into `11` + `12`)

Francis chose **both triggers**:
- **Daily LOG:** `/daily <text>` append → this doc (slash command + memory store).
- **Daily SUMMARY:** ONE skill (`daily-summary`: read today's notes + today's runs
  → write a digest), fired **two ways off the same recipe**:
  1. on-demand via `/daily-summary` (a `12` workflow), AND
  2. automatic nightly via a Hermes **blueprint** (skill + cron frontmatter, e.g.
     `metadata.hermes.blueprint.schedule: "0 18 * * *"`, `deliver: origin`).
- Blueprint = native (`tools/blueprints.py`). Same recipe, manual + scheduled,
  zero duplication.

---

## 7. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 11.1 | Migrate profile → `USER.md`; daily/notes/inbox → memory store | Single source of truth |
| 11.2 | Implement `/profile /daily /notes` slash commands | Muscle memory works |
| 11.3 | Implement `/memory` fan-out (history + cross-profile + store + KB) | Unified search |
| 11.4 | Always-on prefs → context files; topical prefs → skills | Inject mechanism mapped |
| 11.5 | `.enabled.json` → skill enable/disable + context selection | Toggle preserved |
| 11.6 | `daily-summary` skill + blueprint schedule (with `12`) | Both triggers live |
| 11.7 | a11y on any UI + commit | WCAG 2.2 AA |

---

## 8. Acceptance criteria

- ✅ No parallel memory system — Hermes store is the only source of truth.
- ✅ All four commands work as slash commands.
- ✅ `/memory` fans out across history + cross-profile + store + KB, unified.
- ✅ Always-on prefs shape every session (context files); topical prefs auto-surface
  or fire by command (skills).
- ✅ `.enabled.json` semantics preserved via skill toggles.
- ✅ `daily-summary` runs on-demand AND nightly via blueprint, one recipe.

---

## 9. Open questions / risks

- Confirm `USER.md` overwrite-merge semantics (profile must never duplicate).
- Decide content-of-record for topical prefs: skill body vs prompt library (`08`) —
  reference, don't copy.

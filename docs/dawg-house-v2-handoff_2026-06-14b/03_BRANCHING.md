# 03 — Session Branching + Lineage Tree (Feature ③)

> **Phase:** 4 (Branching) · **Mechanism:** new screen/component module in the fork ·
> **Source:** DAWG House Epic 23 (dynamic session branching, ADR 0002 no-merge stance)

---

## 1. What & why

Fork a conversation at any message into a new branch, explore an alternative, and
see the whole lineage as a tree. Core to Francis's original vision: a "headless
brain that saves to a graph, trackable, fork from there." Branching = roll
forward/back through conversational time without destroying the original.

**ADR 0002 stance (carried from Epic 23): NO merge.** Branches diverge; you don't
merge them back. Keeps lineage a clean tree, not a tangled DAG.

---

## 2. Hermes primitive(s) it reuses

- **Sessions** — Hermes `SessionsPage` + the session store already persist
  conversations. A branch is a **new session that records its parent + fork point**.
- **`session_search`** (`tools/session_search_tool.py`) — already supports
  `session_id` (read a whole session) and `around_message_id` (scroll to a moment).
  Branching reuses the same anchor concept (fork at `message_id`).

No new persistence engine — branches are sessions with lineage metadata.

---

## 2.5 Tabs as session containers (the Wibey gesture)

Wibey opens work in **tabs**, where each tab is a live session. That's the
missing UI primitive here — and it unifies cleanly with branching because a tab
and a branch are the **same underlying thing (a session)**, opened two ways:

| Gesture | What it creates | Lineage metadata |
|---------|-----------------|------------------|
| **New tab** (Wibey-style) | a fresh **root** session | `{parent_session_id: null}` |
| **Branch from here** | a session **forked at a message** | `{parent_session_id, fork_message_id}` |

So: **a tab is the *container* for a session; a branch is a tab whose session has
a parent.** One session model, two entry points — no new persistence (DRY). The
tab strip is the *linear* view of what's open right now; the lineage tree (§1) is
the *zoomed-out map* of how those sessions relate. "Branch from here" simply
opens the new forked session **in a new tab**.

---

## 3. Attach mechanism

- Plugin page `Lineage` (top-level) + a `chat:top` (or message-level) slot for the
  "Branch from here" affordance.
- Lineage tree reads session metadata (parent_session_id, fork_message_id) via the
  SDK `api` client.
- **Tab strip** (a `header-left` or `chat:top` slot): open / close / switch live
  sessions. A new tab creates a root session; "branch from here" opens the forked
  session in a new tab. Tabs and the lineage tree read the **same** session store.

---

## 4. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 3.1 | Add a "Branch from here" action at a message | Fork point is selectable |
| 3.2 | Create a new session carrying `{parent_session_id, fork_message_id}` (copy history up to fork) | Branch exists, original untouched |
| 3.3 | Tab strip: new-tab = root session; switch/close tabs without losing state | Wibey multi-session gesture works |
| 3.4 | Lineage tree view: render parent→children, current branch highlighted | Tree is navigable |
| 3.5 | "Branch from here" opens the forked session in a NEW tab | Tabs + branching unified |
| 3.6 | Enforce no-merge (ADR 0002): no merge UI, branches are terminal leaves | Stance honored |
| 3.7 | a11y: keyboard-navigable tree (`aria` roles) + tab strip (`role="tab"`, arrow-key nav) + commit | WCAG 2.2 AA |

---

## 5. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| `web/plugins/lineage/index.tsx` | new | No |
| `web/plugins/lineage/LineageTree.tsx` | new | No |
| `web/plugins/lineage/branchFromMessage.ts` | new | No |
| `web/plugins/lineage/TabStrip.tsx` | new | No |

If Hermes's session API can't store parent/fork metadata, prefer a **plugin-side
store** (KB/SQLite or plugin storage) over a backend edit. Branch metadata is the
only state to persist beyond what Hermes already keeps.

---

## 6. Acceptance criteria

- ✅ Any message can be a fork point; forking creates a new session with history up
  to that point.
- ✅ Original session is never mutated by a branch.
- ✅ Lineage tree shows the full ancestry; current branch is highlighted.
- ✅ Tab strip opens/switches/closes live sessions; new tab = root session, and
  "branch from here" opens the forked session in a new tab (one session model).
- ✅ No merge affordance anywhere (ADR 0002).
- ✅ Tree AND tab strip are keyboard-navigable (`role="tab"`, arrow keys); WCAG 2.2 AA.

---

## 7. Open questions / risks

- **Where lineage metadata lives** — Hermes session record vs plugin store.
  Confirm the session schema; default to plugin store to avoid a backend fork.
- **History copy vs reference** — copy history up to fork (simple, isolated) vs
  reference parent (storage-light). Epic 23 chose copy; keep it.

# 02 — Workshop Pane (Feature ②)

> **Phase:** 2 (Cockpit) · **Mechanism:** new screen/component module in the fork ·
> **Status:** Phase 2 closed. Live view + pause/interrupt shipped; one-off
> sub-agent chat pushed to Phase 11.

---

## 1. What & why

The Workshop is a window onto the orchestrator's brain: watch the main agent
delegate to sub-agents, see the traffic between them, pause new delegation
spawns, and interrupt a running sub-agent. It's the cockpit that makes the
"orchestrator + specialized CLIs" vision visible and steerable. **Wibey quality
bar applies here most of all:** no modal gauntlets, instant feedback, live
stream.

One-off direct chat with a selected sub-agent is intentionally split into its own
Phase 11 steering pass. It is not required for Phase 2 closure, and Phase 2 is now
closed.

---

## 2. Hermes primitive(s) it reuses

- **`delegation.status`** RPC — the read stream of orchestrator→sub-agent traffic.
- **Agent API via the desktop main process / IPC** — stream `delegation.status` through hermes-desktop's main-process client (same path `run-stream.ts`/`dashboardEventAdapter.ts` use), surfaced via `window.hermesAPI`. (No `buildWsUrl` — that was the `web/` plugin SDK.)
- **ACP adapter** (`acp_adapter/`) — Hermes speaks Agent Client Protocol; the
  Workshop is a viewer onto ACP/delegation events.
- Phase 2 intervention: **`delegation.pause`** + **`subagent.interrupt`** RPCs.

No new orchestration. We consume what `delegate_tool.py` already emits.

---

## 3. Attach mechanism

- `register({ id: "workshop", name: "Workshop", ... })` → adds a **top-level page**.
- `registerSlot("header-left", ...)` → a nav link to the Workshop.
- The page opens a WS via `buildWsUrl("delegation.status")` and renders the live
  delegation tree.

---

## 4. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 2.1 | Register a `Workshop` page + header-left nav link | ✅ page mounts |
| 2.2 | Read delegation status through the desktop main process / dashboard RPC path | ✅ live traffic arrives |
| 2.3 | Render a delegation tree: main agent → sub-agents, with live status badges | ✅ orchestration is visible |
| 2.4 | Render per-delegation message stream | ✅ you can watch a sub-agent work |
| 2.5 | a11y + Wibey pass (no reloads, live updates, reduced-motion) | ✅ baseline quality met |
| 2.6 | Commit read-only Workshop | ✅ shipped in `ced1a1c` |
| 2.7 | Add Pause / Interrupt buttons wired to `delegation.pause` + `subagent.interrupt` | ✅ shipped in `033884f` |

### Phase 11 Follow-up

| Step | Do | Proves |
|------|-----|--------|
| 11.1 | One-off direct chat with a selected sub-agent (side-channel, not a detour) | Direct steer works without hijacking the main run. |

---

## 5. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| `web/plugins/workshop/index.tsx` | new | No |
| `web/plugins/workshop/DelegationTree.tsx` | new | No |
| `web/plugins/workshop/components/*` | new | No |

All plugin. **Zero backend edits.**

---

## 6. Acceptance criteria

- ✅ Workshop page reachable from a header-left nav link.
- ✅ Live `delegation.status` stream renders a delegation tree that updates without
  reload.
- ✅ Read-only path shipped before controls.
- ✅ Pause/interrupt call the real RPCs.
- ➡️ One-off chat is Phase 11 and must be side-channel when built; it must not
  hijack the main run.
- ✅ WCAG 2.2 AA; respects `prefers-reduced-motion` for any animated edges.

**Phase 2 closeout:** accepted. Move to Phase 3 Branching when ready.

---

## 7. Open questions / risks

- **Exact `delegation.status` frame schema** — confirm fields against
  `delegate_tool.py` output before designing the tree node model.
- **One-off chat semantics** — decide "detour" (pauses main) vs "side-channel"
  (parallel). Memory says **side-channel**. Honor that.
- **Back-pressure** — high-fan-out delegations could flood the WS; debounce/virtualize
  the tree.

# 02 — Workshop Pane (Feature ②)

> **Phase:** 2 (Cockpit) · **Mechanism:** new screen/component module in the fork ·
> **Ships read-only FIRST**; pause/interrupt + one-off sub-agent chat = phase 2.

---

## 1. What & why

The Workshop is a window onto the orchestrator's brain: watch the main agent
delegate to sub-agents, see the traffic between them, and (phase 2) intervene —
pause a delegation, interrupt a sub-agent, or open a one-off direct chat with a
sub-agent. It's the cockpit that makes the "orchestrator + specialized CLIs"
vision visible and steerable. **Wibey quality bar applies here most of all:** no
modal gauntlets, instant feedback, live stream.

---

## 2. Hermes primitive(s) it reuses

- **`delegation.status`** RPC — the read stream of orchestrator→sub-agent traffic.
- **Agent API via the desktop main process / IPC** — stream `delegation.status` through hermes-desktop's main-process client (same path `run-stream.ts`/`dashboardEventAdapter.ts` use), surfaced via `window.hermesAPI`. (No `buildWsUrl` — that was the `web/` plugin SDK.)
- **ACP adapter** (`acp_adapter/`) — Hermes speaks Agent Client Protocol; the
  Workshop is a viewer onto ACP/delegation events.
- Phase 2 intervention: **`delegation.pause`** + **`subagent.interrupt`** RPCs
  (already exist — we just call them).

No new orchestration. We consume what `delegate_tool.py` already emits.

---

## 3. Attach mechanism

- `register({ id: "workshop", name: "Workshop", ... })` → adds a **top-level page**.
- `registerSlot("header-left", ...)` → a nav link to the Workshop.
- The page opens a WS via `buildWsUrl("delegation.status")` and renders the live
  delegation tree.

---

## 4. Build steps (read-only first)

| Step | Do | Proves |
|------|-----|--------|
| 2.1 | Register a `Workshop` page + header-left nav link | Plugin page mounts |
| 2.2 | Open `buildWsUrl` to `delegation.status`, log frames | Live traffic arrives |
| 2.3 | Render a delegation tree: main agent → sub-agents, with live status badges | Orchestration is visible |
| 2.4 | Render per-delegation message stream (read-only) | You can watch a sub-agent work |
| 2.5 | a11y + Wibey pass (no reloads, live updates, reduced-motion) | Quality bar met |
| 2.6 | Commit (read-only Workshop done) | Phase 1 of feature shipped |

### Phase 2 of the feature (after read-only ships)
| 2.7 | Add Pause / Interrupt buttons wired to `delegation.pause` + `subagent.interrupt` | Intervention works |
| 2.8 | One-off direct chat with a selected sub-agent (side-channel, not a detour) | Direct steer works |

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
- ✅ Read-only first: no pause/interrupt buttons until the read path is solid.
- ✅ Phase 2: pause/interrupt call the real RPCs; one-off chat is a side-channel
  that doesn't hijack the main run.
- ✅ WCAG 2.2 AA; respects `prefers-reduced-motion` for any animated edges.

---

## 7. Open questions / risks

- **Exact `delegation.status` frame schema** — confirm fields against
  `delegate_tool.py` output before designing the tree node model.
- **One-off chat semantics** — decide "detour" (pauses main) vs "side-channel"
  (parallel). Memory says **side-channel**. Honor that.
- **Back-pressure** — high-fan-out delegations could flood the WS; debounce/virtualize
  the tree.

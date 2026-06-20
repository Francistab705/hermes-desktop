# 07 — Embedded Terminal + CLI Handoff Lane (Feature ⑧)

> **Phase:** 6 (Terminal Handoff) · **Mechanism:** new screen/component module
> binding to hermes-desktop's **real PTY** (`terminal-launcher.ts`) · **Cross-ref:**
> `02_WORKSHOP` (handoff = manual delegation the Workshop visualizes)

---

## 1. What & why

> **Base note (CONFIRMED 2026-06-14):** hermes-desktop's `src/main/terminal-launcher.ts`
> is a **real interactive PTY**. So the dock binds **directly** — any CLI runs, no
> sidecar needed. (The sidecar fallback below is kept only as a historical note.)

Not just "a terminal in the dashboard" — a **handoff lane**. Three layers, smallest
to largest:

1. **A real user shell.** An xterm.js dock where Francis runs *any* CLI —
   `opencode`, `gh`, `claude`, `uv`, whatever — not just a viewer onto Hermes's
   agent commands.
2. **"Send to CLI" from the UI.** Push something *out of a Hermes chat* (a prompt,
   a plan, a file context) **directly into another CLI** like `opencode` — no
   copy-paste — so a workstream flows **Hermes → opencode → back**.
3. **(Follow-up) Structured agent-to-agent handoff over ACP** — the "do it right"
   upgrade once string-injection proves the flow.

**Goal:** keep a workstream moving without leaving the cockpit — the Wibey "no
ceremony" bar applies.

---

## 2. Hermes primitive(s) it reuses

- **hermes-desktop's real PTY** (`src/main/terminal-launcher.ts`, **confirmed**) —
  a genuine interactive PTY that accepts arbitrary stdin. The dock binds straight to
  it (any CLI runs). *Historical fallback (not needed): if it had been launch-only,
  a tiny PTY sidecar/MCP process — never a core fork — would have filled the gap.*
- **`buildWsUrl`** — stream PTY stdout/stdin over an auth'd WebSocket.
- **ACP adapter** (`acp_adapter/`) — Hermes already speaks Agent Client Protocol,
  and opencode / claude-code / gemini are ACP clients. That's the seam for the
  Layer-3 *structured* handoff (carries context/files, not just a string).

No new orchestration. The Layer-2 "send to opencode" is **you doing a manual
delegation** — the same act `02_WORKSHOP` visualizes. Cross-reference them so they
don't become two parallel handoff mechanisms.

---

## 3. Attach mechanism

- Plugin registering a `pre-main` or bottom dock slot (collapsible drawer) hosting
  an `xterm.js` instance bound to the PTY WS (Layer 1).
- A **"Send to CLI"** action on any Hermes message / selection (a message-level
  button or `chat:bottom` control) that writes the text into the target CLI's
  **stdin** in the dock (Layer 2).
- (Follow-up) An ACP handoff path that opens a structured session with the target
  agent instead of piping a raw string (Layer 3).

---

## 4. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 7.1 | **Confirm the PTY**: does `terminal_tool` accept arbitrary interactive stdin? If not, stand up a PTY sidecar (separate process, no core fork) | Real shell, not a viewer |
| 7.2 | Add `xterm` + `xterm-addon-fit`; mount in a collapsible dock bound to the PTY WS (`buildWsUrl`) | Any CLI runs (`opencode`, `gh`, `uv`…) |
| 7.3 | Resize/fit handling + scrollback | Usable terminal |
| 7.4 | **"Send to CLI"** action: inject a Hermes message/selection into a running CLI's stdin (MVP target: `opencode`) | Hermes → opencode handoff, no copy-paste |
| 7.5 | Surface agent-initiated commands in the same dock (read) | Unified shell view |
| 7.6 | (Follow-up) ACP structured handoff via `acp_adapter` — carries context/files, not just a string | "Do it right" upgrade seam |
| 7.7 | a11y: focus management, screen-reader announce, contrast | WCAG 2.2 AA |
| 7.8 | Commit | Done |

---

## 5. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| `web/plugins/terminal/index.tsx` | new | No |
| `web/plugins/terminal/TerminalDock.tsx` | new | No |
| `web/plugins/terminal/SendToCli.tsx` | new | No |
| `pty_sidecar/` (only if `terminal_tool` isn't a true interactive PTY) | new process | Sidecar, **not** a Hermes-core edit |

---

## 6. Acceptance criteria

- ✅ Collapsible dock running a **real interactive shell** — arbitrary CLIs work
  (`opencode`, `gh`, `claude`, `uv`), not only agent-run commands.
- ✅ "Send to CLI" pushes a Hermes message/selection into a running CLI's stdin
  with no copy-paste (MVP: `opencode`).
- ✅ Resizes correctly; scrollback works; agent-run commands visible in the same
  surface.
- ✅ ACP structured-handoff path is documented as the follow-up (not required for
  MVP, but the seam is named).
- ✅ No Hermes-core fork — PTY comes from `terminal_tool` or a sidecar.
- ✅ Keyboard focus + screen-reader friendly; WCAG 2.2 AA.

---

## 7. Open questions / risks

- **Is `terminal_tool` a true PTY?** Confirm it exposes interactive stdin over the
  gateway WS (vs request/response). This decides Layer 1 — direct bind vs sidecar.
- **String-injection vs ACP.** Layer 2 (pipe a string to stdin) is the MVP; Layer 3
  (ACP structured handoff) is the upgrade. Don't over-build Layer 3 on day one
  (YAGNI) — just keep the seam.
- **Overlap with `02_WORKSHOP`.** "Send to opencode" is a manual delegation; make
  sure it and the Workshop don't fork into two handoff systems.
- **Security:** personal local instance — still scope the shell to the workspace,
  never the home root / system dirs.

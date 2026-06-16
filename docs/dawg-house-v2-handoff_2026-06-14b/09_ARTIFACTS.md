# 09 — Artifacts Canvas (Feature ⑨)

> **Phase:** 1 (Signature, with `01`) · **Mechanism:** new screen/component module that
> **shares the OpenUI renderer** (no second engine) · **Source:** LibreChat (pattern)

---

## 1. What & why

A pinned side canvas for "artifacts" — larger generated outputs (a full report, a
big chart, a document) that you want to keep visible while the chat scrolls on.
Think LibreChat's artifacts panel, but rendered with **the same OpenUI engine** as
inline chat.

---

## 2. THE key decision (locked)

**One renderer, two mount points.** The Artifacts canvas does NOT get its own
rendering system. It mounts the **same `@openuidev/react-lang` `Renderer` +
library** from `01`, just in a pinned side panel instead of inline in the stream.

- Inline mount → `01` (in the message bubble).
- Pinned mount → `09` (side canvas).
- Same components, same parser, same theme. DRY (Rule 5 in `00`).

---

## 3. Attach mechanism

- Plugin registering an `overlay` / right-rail slot for the canvas.
- A "pin to canvas" action on any OpenUI message moves/duplicates its `root`
  expression into the canvas mount.

---

## 4. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 9.1 | Register a right-rail/overlay canvas panel | Canvas mounts |
| 9.2 | Reuse `createLibrary(genui)` + `Renderer` from `01` | No second engine |
| 9.3 | "Pin to canvas" action on OpenUI messages | Move artifact to canvas |
| 9.4 | Canvas persists across chat scroll; resizable | Stays visible |
| 9.5 | a11y (focus order between chat ↔ canvas) + commit | WCAG 2.2 AA |

---

## 5. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| `web/plugins/artifacts/index.tsx` | new | No |
| `web/plugins/artifacts/Canvas.tsx` | new | No |
| (reuses) `web/src/components/genui/*` + `Renderer` | from `01` | No |

---

## 6. Acceptance criteria

- ✅ Canvas renders OpenUI via the **same** renderer + library as inline (verify no
  duplicate parser/engine in the bundle).
- ✅ Any OpenUI message can be pinned to the canvas.
- ✅ Canvas survives chat scroll; resizable.
- ✅ Focus order between chat and canvas is sane; WCAG 2.2 AA.

---

## 7. Open questions / risks

- **Pin = move or copy?** Default: copy (artifact stays in history AND on canvas).
- **Multiple artifacts** — tabs or stack in the canvas? Start with one slot; add
  tabs only if needed (YAGNI).

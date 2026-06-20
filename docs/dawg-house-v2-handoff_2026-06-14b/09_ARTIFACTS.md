# 09 — Saved Artifacts Library (Feature ⑨)

> **Phase:** 5 (Saved workspace) · **Mechanism:** new screen/component module that
> **shares the OpenUI renderer** (no second engine) · **Status:** promoted out of
> Phase 1; build later as a persistent library/tab.

---

## 1. What & why

A saved library for generated OpenUI artifacts — dashboards, reports, plans,
tables, charts, and working cards that should outlive the chat scroll. Think of
it like a screenshots/photos tab for generated UI: save an artifact, browse it
later, reopen it, and keep building from it.

This is bigger than a temporary "pin to side canvas" action. Pinning is useful as
a short-term interaction, but the real product shape is a persistent Artifacts
tab with saved items.

---

## 2. THE key decision (locked)

**One renderer, multiple saved mounts.** The Artifacts library does NOT get its
own rendering system. It mounts the **same `@openuidev/react-lang` `Renderer` +
library** from `01`, just from persisted saved artifact records instead of the
live chat message stream.

- Inline mount → `01` (in the message bubble).
- Saved mount → `09` (Artifacts tab/library/detail view).
- Same components, same parser, same theme. DRY (Rule 5 in `00`).

---

## 3. Attach mechanism

- New top-level Artifacts tab/screen in the hermes-desktop fork.
- A "Save artifact" action on OpenUI messages stores the OpenUI source plus
  metadata.
- Library view lists saved artifacts like photos/screenshots: title, thumbnail or
  compact preview, source session, created date, and tags.
- Detail view re-renders the saved artifact with the same OpenUI renderer.

---

## 4. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 9.1 | Define saved artifact record shape and storage location | Persistence seam exists |
| 9.2 | Add "Save artifact" action on OpenUI messages | Chat can create saved artifacts |
| 9.3 | Add top-level Artifacts tab/library | Saved artifacts are browsable |
| 9.4 | Add artifact detail view using the shared OpenUI renderer | No second engine |
| 9.5 | Add rename/delete/tag/search basics | Library behaves like a real saved workspace |
| 9.6 | a11y + Wibey pass + commit | WCAG 2.2 AA |

---

## 5. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| `src/renderer/src/screens/Artifacts/*` | new | No |
| `src/main/artifacts.ts` or equivalent IPC/storage module | new | Yes, desktop-local storage only |
| `src/shared/artifacts.ts` | new | Shared types |
| (reuses) `src/renderer/src/components/genui/*` + `Renderer` | from `01` | No |

---

## 6. Acceptance criteria

- ✅ Any OpenUI message can be saved as an artifact.
- ✅ Saved artifacts persist across app restarts.
- ✅ Artifacts tab lists saved artifacts with useful titles/previews.
- ✅ Artifact detail renders via the **same** renderer + library as inline (verify
  no duplicate parser/engine in the bundle).
- ✅ Rename/delete/tag/search basics work.
- ✅ Focus order and keyboard navigation are sane; WCAG 2.2 AA.

---

## 7. Open questions / risks

- **Storage:** desktop-local first (`HERMES_HOME` or app data) vs remote profile
  sync later. Start local unless there is a strong reason to sync.
- **Preview generation:** render live thumbnails later if expensive; MVP can use
  title/type/date rows.
- **Relationship to chat:** save should copy the artifact source and retain a
  source session/message pointer when available.

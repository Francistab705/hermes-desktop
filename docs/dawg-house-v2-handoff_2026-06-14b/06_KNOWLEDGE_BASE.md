# 06 — Knowledge Base: Upload + Hybrid Search + Viewer (Feature ⑥)

> **Phase:** 5 (Knowledge Base) · **Mechanism:** **EXTEND** the existing search +
> new screen/component module in the fork
> (no fork) · **Source:** DAWG House Epics 18/22 (KB doc viewer, KB services)

---

## 1. What & why

> **Base note:** hermes-desktop already has sessions **FTS5 full-text search** + the
> memory store/embedder. **Extend that engine** — add doc-upload, the viewer, and URL
> ingest; do NOT stand up a second search stack (Rule 4, DRY).

Upload reference docs (schemas, Confluence exports, framework guides), index them
for **hybrid search** (keyword + semantic), and read them in an in-app viewer with
pop-out. This is Francis's existing KB (the `memory/knowledge_base/` corpus:
replen schema, COIM, Omni hierarchy, site-traffic, store-trapped framework, etc.).

> **Dropped:** Confluence *ingest* pipeline. Replaced by **plain webpage fetch via
> Hermes `web_tools`** — paste a URL, fetch the page, add it as a KB doc. No
> Confluence-specific connector.

---

## 2. Hermes primitive(s) it reuses

- **Hermes `web_tools`** — fetch a webpage → markdown for ingest (replaces the
  Confluence connector).
- **Hermes memory / file store** — KB docs persist alongside Hermes's own storage;
  reuse its embedding/index path where available (Hermes ships a local embedder
  story; KB can share `all-MiniLM-L6-v2` rather than standing up a second one).
- **`session_search` fan-out** — KB search is one of the backends `/memory --all`
  fans out to (see `11`).

---

## 3. Attach mechanism

- Plugin page `Knowledge Base` (top-level) with: upload dropzone, search bar,
  results list, doc viewer + pop-out.
- Index lives in the plugin's data dir (SQLite + vector) or shares Hermes's index.

---

## 4. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 6.1 | KB page: list existing docs from the corpus dir | Corpus visible |
| 6.2 | Upload: file dropzone → store + index (chunk → embed) | New docs ingest |
| 6.3 | URL ingest via `web_tools`: paste URL → fetch → markdown → index | Confluence-replacement works |
| 6.4 | Hybrid search: keyword + semantic, ranked | Relevant retrieval |
| 6.5 | Doc viewer + pop-out window (carry Epic 18 behavior) | Readable in-app |
| 6.6 | Expose KB search to the `/memory --all` fan-out (`11`) | Unified search |
| 6.7 | a11y + commit | WCAG 2.2 AA |

---

## 5. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| `web/plugins/kb/index.tsx` | new | No |
| `web/plugins/kb/Viewer.tsx`, `Search.tsx`, `Upload.tsx` | new | No |
| `web/plugins/kb/index/*` (chunk/embed/store) | new | No (plugin-local) |

Prefer the plugin's own data dir + Hermes's local embedder over any backend edit.

---

## 6. Acceptance criteria

- ✅ Existing corpus lists and opens in the viewer (+ pop-out).
- ✅ File upload and URL fetch (`web_tools`) both ingest + index.
- ✅ Hybrid search returns ranked keyword + semantic hits.
- ✅ KB search participates in `/memory --all` fan-out.
- ✅ No Confluence-specific connector exists (dropped).
- ✅ WCAG 2.2 AA.

---

## 7. Open questions / risks

- **Index location** — share Hermes's embedder/index vs plugin-local. Default:
  reuse Hermes local embedder (`all-MiniLM-L6-v2`) to avoid a second model.
- **Large docs** (e.g. the 162 KB COIM file) — chunk sensibly; cap viewer render
  with virtualization.

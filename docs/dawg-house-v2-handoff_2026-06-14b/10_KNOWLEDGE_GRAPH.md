# 10 — Graphiti Knowledge Graph + Timeline (Feature ⑩)

> **Phase:** 11 (build LAST) · **Mechanism:** new screen/component module + **Neo4j infra**
> (the one heavy dependency) · **Source:** DAWG House Epics 21/26/27

---

## 1. What & why

A **temporal entity/lineage graph**: how a metric formula evolved, which columns
feed it, which git commit changed it, which Confluence version defined it. The
spine of Francis's original vision — "a headless brain that saves to a graph,
trackable, fork from there." Answers "how did X evolve?" with a **Timeline**
OpenUI component.

> **Doc written now, BUILD deferred to Phase 11.** Every other feature is a plugin
> or a 1-file fork; this one drags in a running **Neo4j** instance. That's why it's
> last — but Francis explicitly wants the full scope captured up front, not bolted
> on later.

---

## 2. Distinct from Hermes's built-in memory

- **Hermes memory** (`11`): SQLite + FTS5 session search + Honcho user-modeling =
  *conversational* memory (what was said, who Francis is).
- **Graphiti** (`10`): a *temporal entity/lineage* graph (how artifacts evolved
  over time, typed relationships). **They complement, not replace.**

---

## 3. What to port (from DAWG House `services/history/`, ~30 files)

- **Client/backends:** `graphiti_client.py`, `history_backend.py`.
- **Ingest lanes (episodes):** `git_episodes.py`, `confluence_versions.py`,
  `run_episodes.py`, `kb_episodes.py`, `metric_episodes.py`, `column_episodes.py`,
  `ingest_runner.py`.
- **Embedding:** `local_embedder.py` (`all-MiniLM-L6-v2`) — same embedder KB (`06`)
  reuses.
- **Query/read surface:** `question_router.py`, `graph_query.py`,
  `graph_openui.py`, `graph_scope.py`, `graph_traversal.py`, `graph_schema.py`
  (**12 typed labels + 12 edges**).
- **MCP tools:** `mcp_semantic_tools.py` + `mcp_decision_tools.py` (**9 MCP tools**).
- **UI:** the `/graph` explorer + the **Timeline** OpenUI component (already in the
  genui set from `01`).

> Note Brain V2 (Epic 30) pushback: the live Neo4j explorer showed a "death-star +
> space debris" topology and the Store-Trapped Brain Eval scored 46% with a
> BLOCKER. The Epic 30 lesson — **build the graph criteria-first**
> (`docs/BRAIN_CRITERIA.md`), not by patching ingest lanes. Carry that lesson:
> define the eval/criteria before re-ingesting.

---

## 4. Attach mechanism

- Plugin page `/graph` (explorer) + the Timeline component (via `01`).
- MCP: register the 9 graph tools on `mcp/graphiti.template.json` so the agent can
  query the graph.
- Infra: a running Neo4j instance (local container for the personal build).

---

## 5. Build steps (Phase 11)

| Step | Do | Proves |
|------|-----|--------|
| 10.1 | Stand up Neo4j (local container) + `graphiti_client` connection | Graph DB reachable |
| 10.2 | Port typed schema (12 labels + 12 edges) | Schema applied |
| 10.3 | Define criteria/eval FIRST (Epic 30 lesson) | Build target is measurable |
| 10.4 | Port ingest lanes; run `ingest_runner` against git/KB/metrics/columns | Graph populates |
| 10.5 | Port read surface + 9 MCP tools | Agent can query |
| 10.6 | `/graph` explorer plugin + Timeline rendering via `01` | Visible lineage |
| 10.7 | Re-run the Brain Eval; iterate to criteria | Quality bar met |
| 10.8 | a11y + commit | WCAG 2.2 AA |

---

## 6. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| `web/plugins/graph/*` | new | No |
| `mcp/graphiti.template.json` | config | No |
| ported `services/history/*` | new module | Runs as a service, not a Hermes-core edit |
| Neo4j | **infra dependency** | external |

---

## 7. Acceptance criteria

- ✅ Neo4j up; typed schema (12+12) applied.
- ✅ Ingest lanes populate the graph from git/KB/metrics/columns.
- ✅ 9 MCP tools let the agent answer lineage questions.
- ✅ `/graph` explorer + Timeline render the temporal story.
- ✅ Brain Eval meets the **criteria-first** target (no repeat of the 46% / BLOCKER).
- ✅ WCAG 2.2 AA.

---

## 8. Open questions / risks

- **Heaviest feature** — Neo4j is real infra. Containerize it for the personal
  build; don't let it block Phases 0–4.
- **Criteria first** — do NOT re-ingest blindly. Port `BRAIN_CRITERIA.md` and run
  to the eval (Epic 30).

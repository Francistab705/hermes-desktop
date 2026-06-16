# 12 — Workflows: Build + Execute (Feature ⑫)

> **Phase:** 4 (Knowledge & tools) · **Mechanism:** **EXTEND** existing schedules — skills + slash commands +
> checkpoints (reuses `05` + `11`, no parallel engine) · **Source:** DAWG House
> Epic 28 (project workflows)

---

## 1. What & why

Francis wants the **capability** to author multi-step procedures and run them
step-by-step (with pause/resume) — NOT the exact DAWG House `.dawg/workflows/*.yaml`
format. So we build the *capability* on Hermes primitives, with **no parallel
orchestration engine** (DRY).

---

## 2. The three-primitive mapping (locked)

| Capability | Hermes primitive |
|------------|------------------|
| **BUILD** a workflow | author a Hermes **skill** — `SKILL.md` is the step recipe; versionable + shareable via the skills hub |
| **LAUNCH** a workflow | a Hermes **slash command** (e.g. `/readiness`, `/sql-doc`) — rides on `11`'s slash-command layer |
| **EXECUTE** step-by-step with pause/resume | **`checkpoint_manager.py`** — the SAME engine powering the PIV loop (`05`) |

So "build + execute workflows" = skill + slash command + checkpoints. Reuses `05`
and `11`. No new orchestrator.

---

## 3. Worked example: `daily-summary` (shared with `11`)

- **Build:** a `daily-summary` skill — `SKILL.md` recipe: read today's notes log +
  today's runs → write a digest.
- **Launch (manual):** `/daily-summary` slash command (a workflow).
- **Launch (automatic):** a Hermes **blueprint** — same skill + cron frontmatter
  (`metadata.hermes.blueprint.schedule: "0 18 * * *"`, `deliver: origin`) registers
  a Suggested Cron Job.
- Same recipe, manual + scheduled, zero duplication.

---

## 4. Build steps

| Step | Do | Proves |
|------|-----|--------|
| 12.1 | Author a workflow as a skill (`SKILL.md` = step recipe) | Build path works |
| 12.2 | Bind a slash command to launch it | Launch path works |
| 12.3 | Execute via `checkpoint_manager` with pause/resume between steps | Step-by-step run |
| 12.4 | Surface step progress in UI (reuse PIV phase indicator pattern from `05`) | Visible progress |
| 12.5 | Add an optional blueprint schedule for recurring workflows | Cron path works |
| 12.6 | a11y + commit | WCAG 2.2 AA |

---

## 5. Files touched

| File | New/Fork | Backend? |
|------|----------|----------|
| `skills/<workflow>/SKILL.md` | new (content) | No |
| `web/plugins/workflows/index.tsx` | new (UI for run/progress) | No |
| (reuses) `checkpoint_manager` via gateway | from `05` | No |
| (reuses) slash command layer | from `11` | No |

---

## 6. Acceptance criteria

- ✅ A workflow is authored as a skill (no `.dawg/workflows/*.yaml` format).
- ✅ Launchable via slash command.
- ✅ Executes step-by-step with pause/resume on the **same** `checkpoint_manager`
  as PIV (`05`) — verify no duplicate orchestration code.
- ✅ Recurring workflows schedulable via blueprint.
- ✅ WCAG 2.2 AA.

---

## 7. Open questions / risks

- Confirm the skills→checkpoint handoff: how a `SKILL.md` recipe maps to discrete
  checkpoints. Reuse exactly what `05` does.
- Keep the authoring UX thin — a skill file + a slash binding, not a YAML DSL.

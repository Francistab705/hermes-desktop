# DAWG House v2 Phase 0 + Phase 1 Start Plan

Source docs:

- `docs/dawg-house-v2-handoff_2026-06-14b/00_OVERVIEW.md`
- `docs/dawg-house-v2-handoff_2026-06-14b/01_OPENUI_INLINE.md`
- `docs/dawg-house-v2-handoff_2026-06-14b/09_ARTIFACTS.md`
- `/Users/maf001h/Documents/app/doscere/DAWG House v2 Method Choice.md`

## Scope

This plan covers only the MVP path:

- Phase 0: foundation fork, boot, telemetry removal, DAWG marker, DAWG theme.
- Phase 1: OpenUI generation + inline rendering + interactions + Artifacts canvas.

Do not plan or start phases 2-6 until Phase 0 and Phase 1 are usable as a daily-driver MVP.

## Standing Translation Rule

Older handoff docs may say `plugin`, `slot`, `web/plugins`, or Hermes `web/` paths. For this repo, translate those to hermes-desktop source work:

- `plugin` -> `screen/component module inside the hermes-desktop fork`
- `overlay/right-rail slot` -> `renderer layout/module mounted by Chat/Layout`
- `web/src/components/genui` -> `src/renderer/src/components/genui`
- `web/plugins/artifacts` -> `src/renderer/src/screens/Chat` or `src/renderer/src/components/artifacts`

## Method

- Use Matt Pocock-style issues for Phase 0 because each step is small and independently verifiable.
- Use GSD/TDD for Phase 1 if the OpenUI renderer + Artifacts work becomes stateful across several files.
- Do not use BMad unless the product direction changes and planning needs to restart.

## Issue 1: Pin The Fork And Record The Base

Goal: make the repo a known, reproducible DAWG House base instead of a moving upstream target.

Work:

- Confirm the current remote/fork state.
- Add or verify `upstream` points to `fathah/hermes-desktop`.
- Record the pinned upstream commit in a small repo note, ADR, or this plan.
- Confirm the working branch name for DAWG House v2.

Acceptance criteria:

- The repo has a clear upstream remote.
- The base commit is recorded.
- Future agents can tell what upstream state DAWG House started from.

Suggested verification:

- `git remote -v`
- `git rev-parse HEAD`
- `git log --oneline -5`

## Issue 2: Boot The Existing Desktop App On macOS

Goal: prove the inherited chassis works before DAWG changes begin.

Work:

- Install dependencies.
- Start the Electron app with the existing dev script.
- Confirm the app opens on macOS.
- Confirm chat can connect to a local or remote Hermes agent.

Acceptance criteria:

- `npm install` succeeds.
- `npm run dev` launches the app.
- Chat can send or at least reach the configured Hermes agent path/API.
- Any required environment/profile setup is documented.

Suggested verification:

- `npm install`
- `npm run dev`
- Manual smoke test in Chat.

## Issue 3: Remove PostHog Telemetry

Goal: make the personal fork non-telemetry by default.

Work:

- Remove `posthog-js` from dependencies.
- Replace `src/renderer/src/utils/analytics.ts` with a no-op analytics layer or remove analytics calls cleanly.
- Remove PostHog CSP allowances from `src/main/index.ts` if they are no longer needed.
- Remove or rewrite settings copy that describes PostHog telemetry.

Acceptance criteria:

- No runtime import of `posthog-js` remains.
- `package.json` and lockfile no longer include `posthog-js`.
- CSP no longer allows PostHog domains solely for analytics.
- Settings UI does not advertise telemetry that no longer exists.

Suggested verification:

- Search for `posthog` and `PostHog`.
- `npm run typecheck`
- `npm run test`

## Issue 4: Prove The Source-Edit Loop With A DAWG Marker

Goal: make the smallest visible DAWG source change before deeper work.

Work:

- Find the header/top-level chat or app shell component.
- Add a small DAWG House marker in the app chrome.
- Keep the change minimal and easy to remove or restyle later.

Acceptance criteria:

- The marker is visible in the running app.
- No unrelated UI is changed.
- The app still typechecks.

Suggested verification:

- `npm run dev`
- `npm run typecheck`

## Issue 5: Add The DAWG Theme Through Tokens

Goal: re-skin through existing theming infrastructure, not one-off component styles.

Work:

- Add a DAWG theme entry in the existing theme constants.
- Prefer CSS variables/theme tokens consumed by existing components.
- Make the DAWG theme selectable or default for the DAWG branch.
- Avoid hard-coded colors inside individual components.

Acceptance criteria:

- DAWG theme applies through `ThemeProvider` / `data-theme`.
- Existing screens still render legibly.
- Contrast meets WCAG 2.2 AA for normal text and controls.

Suggested verification:

- `npm run dev`
- Manual light/dark/theme smoke test.
- `npm run typecheck`

## Issue 6: Add OpenUI Dependency And Shared Renderer Module

Goal: introduce OpenUI once, behind a shared renderer wrapper that both chat and Artifacts can use.

Work:

- Add `@openuidev/react-lang` pinned to `0.2.x`.
- Verify the exact API for `Renderer`, `createLibrary`, source/code prop, and streaming prop.
- Create a shared OpenUI renderer module under `src/renderer/src/components/genui` or adjacent to it.
- Export an `isOpenUI` detector based on first non-whitespace token `root =`.

Acceptance criteria:

- Dependency installs and typechecks.
- The renderer wrapper compiles.
- The detector is tested against OpenUI and markdown samples.
- No chat render path is changed yet except imports/tests if needed.

Suggested verification:

- `npm install`
- `npm run typecheck`
- `npm run test -- isOpenUI` if a focused test exists.

## Issue 7: Port The Minimal DAWG GenUI Component Library

Goal: provide enough registered components for a useful OpenUI MVP without over-porting.

Work:

- Create `src/renderer/src/components/genui/`.
- Start with the smallest MVP set: `Stack`, `Callout`, `KPIRow`, `StatTile`, `DataTable`, `FollowUps`, `Form`, `PlanCard`.
- Add `ChartCard`, `Timeline`, and `CodeBlock` only if the source components are ready and compile cleanly.
- Register components through `createLibrary` in one place.
- Style with DAWG/theme tokens rather than copied hard-coded V1 colors.

Acceptance criteria:

- Components compile and render in isolation or through a test fixture.
- The registered library is the single source used by chat and Artifacts.
- Interactive components expose callback props needed to submit a follow-up message.

Suggested verification:

- `npm run typecheck`
- Component/unit tests where practical.

## Issue 8: Teach The Agent To Emit OpenUI Lang

Goal: make generation work, not just rendering.

Work:

- Create an always-on OpenUI context file for the DAWG Hermes profile.
- Include the OpenUI quick reference: `root =` first-token rule, positional args rule, never mix markdown and OpenUI.
- Include DAWG component signatures.
- Include guidance for when to emit OpenUI versus markdown.
- Prefer generating the signature block from the registered library if `@openuidev/react-lang` supports prompt generation from the library.

Acceptance criteria:

- The context file is mounted for the DAWG profile.
- A UI-shaped prompt causes the agent to emit a response beginning with `root =`.
- Normal prose prompts still produce markdown/plain text.
- The context source of truth is documented.

Suggested verification:

- Manual chat prompt: `Show me a KPI summary with follow-up actions.`
- Confirm output starts with `root =` when UI is appropriate.

## Issue 9: Render OpenUI Inline In Chat

Goal: branch assistant message rendering surgically in `MessageRow.tsx`.

Work:

- Update `src/renderer/src/screens/Chat/MessageRow.tsx` to detect OpenUI assistant content.
- Render OpenUI content with the shared renderer.
- Leave the existing markdown/media fallback untouched.
- Ensure markdown messages still use `AgentMarkdown` and media token parsing.
- Treat mixed markdown + OpenUI as invalid; do not support both in one bubble.

Acceptance criteria:

- Assistant messages beginning with `root =` render as live React UI.
- Normal assistant markdown renders exactly as before.
- User messages are unaffected.
- Existing media token rendering is not regressed.

Suggested verification:

- Add or update `MessageRow` tests.
- `npm run test`
- `npm run typecheck`
- Manual streaming chat smoke test.

## Issue 10: Wire OpenUI Interactions Back Into Chat

Goal: make the Wibey loop work: render, click, continue in the same window.

Work:

- Copy the interaction pattern from `src/renderer/src/screens/Chat/ClarifyCard.tsx`.
- Give `FollowUps` and `Form` a way to dispatch a new user message into the existing send/run pipeline.
- Mark submissions as pending/disabled while sending.
- Surface delivery errors accessibly.

Acceptance criteria:

- Clicking a `FollowUps` chip sends that text as a new chat message.
- Submitting a `Form` sends structured content or a readable text payload into the run.
- Failed submissions show an accessible error.
- Controls are keyboard reachable and labelled.

Suggested verification:

- Component tests for `FollowUps` and `Form` callbacks.
- Manual chat test with generated follow-up chips.

## Issue 11: Validate Streaming Stability And Accessibility

Goal: make the OpenUI MVP usable rather than just technically rendering.

Work:

- Test partial OpenUI content as it streams token-by-token.
- Avoid full remount flashes where possible.
- Add text alternatives for chart-like components.
- Respect `prefers-reduced-motion`.
- Confirm focus order inside generated UI.

Acceptance criteria:

- Partial trees do not crash the renderer during streaming.
- Final render is stable after stream completion.
- Keyboard users can reach all interactive controls.
- OpenUI components meet WCAG 2.2 AA contrast and labelling requirements.

Suggested verification:

- Manual streaming prompt.
- `npm run test`
- `npm run typecheck`

## Issue 12: Add The Artifacts Canvas Using The Same Renderer

Goal: provide the second OpenUI mount point without creating a second engine.

Work:

- Add a right-rail or side-canvas module inside the hermes-desktop renderer.
- Reuse the same OpenUI renderer/library from Phase 1 chat work.
- Add a `Pin to canvas` action on OpenUI messages.
- Start with one artifact slot; do not add tabs until needed.
- Default behavior: copy the artifact to the canvas, leaving it in chat history.

Acceptance criteria:

- Any OpenUI message can be pinned to the canvas.
- The canvas renders with the same renderer and component library as inline chat.
- The canvas remains visible while chat scrolls.
- The canvas is resizable or at least dismissible.
- Focus order between chat and canvas is sane.

Suggested verification:

- Search/build check confirms no duplicate OpenUI renderer/library setup.
- Manual pin/unpin or pin/replace test.
- `npm run typecheck`
- `npm run test`

## MVP Exit Criteria

DAWG House v2 is ready to move beyond the MVP queue when all of these are true:

- The app boots on macOS from this fork.
- Telemetry is removed.
- The DAWG marker and DAWG theme are visible.
- The agent can emit OpenUI Lang from the always-on context file.
- Chat renders OpenUI inline when content starts with `root =`.
- Markdown fallback is unchanged.
- `FollowUps` and `Form` can continue the conversation from inside the generated UI.
- Artifacts can pin an OpenUI message into a side canvas using the same renderer.
- `npm run typecheck` passes.
- Relevant tests pass.

## Deferred Until After MVP

- Workshop pane.
- Token pill restyle.
- Branching and lineage.
- PIV.
- Knowledge Base.
- Terminal handoff.
- Prompt library.
- Personal memory bridge.
- Workflows.
- Knowledge graph.
- Reachy Mini.

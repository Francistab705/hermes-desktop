# Workshop

The Workshop screen is a desktop cockpit for live and saved delegation trees, surfaced through explicit Electron IPC rather than direct renderer access to Hermes internals.

[[src/renderer/src/screens/Workshop/Workshop.tsx]] reads status, pause, interrupt, and history operations from the preload bridge. [[src/main/ipc/register.ts#registerIpcHandlers]] owns the `workshop-*` IPC channels and delegates them to [[src/main/workshop.ts#getWorkshopStatus]], [[src/main/workshop.ts#setWorkshopPaused]], [[src/main/workshop.ts#interruptWorkshopSubagent]], and the history helpers.

The status path returns an unavailable Workshop state when `delegation.status` cannot be reached, but the IPC channel itself must always exist. A missing handler is a desktop wiring error, not a signal that agents need launching.

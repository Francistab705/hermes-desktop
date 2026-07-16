# Analytics

Analytics helpers stay wired in, but this fork disables emission entirely.

`src/renderer/src/utils/analytics.ts` exposes the same public API, but `initAnalytics`, `capture`, `captureScreenView`, `captureFeatureUsage`, `setAnalyticsConsent`, and `resetAnalytics` are all no-ops. The renderer never sends telemetry or stores consent state.

The privacy pane still renders, but its toggle has no backend effect in this fork.

export function initAnalytics(): void {
  // Analytics is intentionally disabled in the SBC Tech fork.
}

export function capture(
  event: string,
  properties?: Record<string, unknown>,
): void {
  void event;
  void properties;
}

export function captureScreenView(screen: string): void {
  capture("screen_view", { screen });
}

export function captureFeatureUsage(
  feature: string,
  details?: Record<string, unknown>,
): void {
  capture("feature_used", { feature, ...details });
}

export function getAnalyticsConsent(): boolean {
  return false;
}

export function setAnalyticsConsent(enabled: boolean): void {
  void enabled;
}

export function resetAnalytics(): void {
  // No-op: analytics is disabled.
}

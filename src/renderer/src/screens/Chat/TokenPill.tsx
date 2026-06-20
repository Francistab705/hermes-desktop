import { useMemo, useState } from "react";
import type { ContextUsage } from "./ContextGauge";
import type { UsageState } from "./types";

interface TokenPillProps {
  usage: UsageState | null;
  contextUsage: ContextUsage | null;
  model?: string;
  provider?: string;
}

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    const next = (value / 1_000_000).toFixed(1);
    return `${next.endsWith(".0") ? next.slice(0, -2) : next}M`;
  }
  if (value >= 1000) {
    const next = (value / 1000).toFixed(1);
    return `${next.endsWith(".0") ? next.slice(0, -2) : next}k`;
  }
  return String(Math.round(value));
}

function contextPercent(contextUsage: ContextUsage | null): number | null {
  if (!contextUsage || contextUsage.window <= 0) return null;
  return Math.min(
    100,
    Math.round((contextUsage.used / contextUsage.window) * 100),
  );
}

function tokenState(
  percent: number | null,
): "unknown" | "ok" | "warn" | "critical" {
  if (percent == null) return "unknown";
  if (percent >= 90) return "critical";
  if (percent >= 75) return "warn";
  return "ok";
}

function stateLabel(state: ReturnType<typeof tokenState>): string {
  if (state === "critical") return "Critical";
  if (state === "warn") return "Watch";
  if (state === "ok") return "OK";
  return "Waiting";
}

function contextBreakdown(
  contextUsage: ContextUsage | null,
  pct: number | null,
): string {
  if (!contextUsage || pct == null) return "Unknown";
  return `${formatCount(contextUsage.used)} / ${formatCount(contextUsage.window)} (${pct}%)`;
}

export function TokenPill({
  usage,
  contextUsage,
  model,
  provider,
}: TokenPillProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const pct = contextPercent(contextUsage);
  const state = tokenState(pct);
  const total = usage?.totalTokens ?? 0;
  const cacheTotal =
    (usage?.cacheReadTokens ?? contextUsage?.cacheReadTokens ?? 0) +
    (usage?.cacheWriteTokens ?? contextUsage?.cacheWriteTokens ?? 0);
  const ariaLabel = useMemo(() => {
    if (!usage) return "Token usage unavailable yet";
    const contextText =
      pct == null ? "context unknown" : `${pct}% context used`;
    return `${formatCount(total)} tokens, ${contextText}, ${stateLabel(state)} state`;
  }, [pct, state, total, usage]);

  return (
    <div className="token-pill-wrap">
      <button
        type="button"
        className={`token-pill token-pill-${state}`}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="token-pill-dot" aria-hidden="true" />
        <span className="token-pill-main">
          {usage ? formatCount(total) : "No usage"}
        </span>
        <span className="token-pill-state">{stateLabel(state)}</span>
      </button>

      {open && (
        <div
          className="token-pill-popover"
          role="dialog"
          aria-label="Token usage breakdown"
        >
          <div className="token-pill-popover-title">Token Usage</div>
          <dl>
            <div>
              <dt>Model</dt>
              <dd>{model || "Unknown"}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{provider || "Unknown"}</dd>
            </div>
            <div>
              <dt>Prompt</dt>
              <dd>{formatCount(usage?.promptTokens ?? 0)}</dd>
            </div>
            <div>
              <dt>Completion</dt>
              <dd>{formatCount(usage?.completionTokens ?? 0)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatCount(total)}</dd>
            </div>
            <div>
              <dt>Context</dt>
              <dd>{contextBreakdown(contextUsage, pct)}</dd>
            </div>
            <div>
              <dt>Cache</dt>
              <dd>
                {cacheTotal > 0 ? formatCount(cacheTotal) : "None reported"}
              </dd>
            </div>
            <div>
              <dt>Cost</dt>
              <dd>
                {usage?.cost != null
                  ? `$${usage.cost.toFixed(4)}`
                  : "Unknown quota"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

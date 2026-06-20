import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Clock, Refresh, Workflow } from "../../assets/icons";
import type {
  WorkshopDelegationEvent,
  WorkshopHistoryEntry,
  WorkshopStatus,
} from "../../../../shared/workshop";

interface WorkshopProps {
  profile?: string;
  visible?: boolean;
  liveEvents?: WorkshopDelegationEvent[];
}

function statusLabel(status: WorkshopDelegationEvent["status"]): string {
  return status[0].toUpperCase() + status.slice(1);
}

function formatCheckedAt(value?: number): string {
  if (!value) return "Never";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatHistoryTime(value: number): string {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mergeEvents(
  statusEvents: WorkshopDelegationEvent[],
  liveEvents: WorkshopDelegationEvent[],
): WorkshopDelegationEvent[] {
  const byId = new Map<string, WorkshopDelegationEvent>();
  for (const event of statusEvents) byId.set(event.id, event);
  for (const event of liveEvents) byId.set(event.id, event);
  return [...byId.values()];
}

function DelegationTree({
  events,
  available,
  busySubagentId,
  onInterrupt,
}: {
  events: WorkshopDelegationEvent[];
  available: boolean;
  busySubagentId?: string | null;
  onInterrupt?: (subagentId: string) => void;
}): React.JSX.Element {
  const roots = useMemo(
    () => events.filter((event) => !event.parentId),
    [events],
  );

  if (events.length === 0) {
    return (
      <div className="workshop-empty" role="status">
        <Workflow size={28} />
        <h3>No delegation traffic yet</h3>
        <p>
          {available ? (
            "Workshop is connected. Start a chat that delegates work and active sub-agents will appear here."
          ) : (
            <>
              Connect to <code>delegation.status</code> and sub-agent runs will
              appear here as a live tree.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="workshop-tree" aria-label="Delegation tree">
      {(roots.length ? roots : events).map((event) => (
        <article className="workshop-node" key={event.id}>
          <div className="workshop-node-icon" aria-hidden="true">
            <Bot size={16} />
          </div>
          <div className="workshop-node-body">
            <div className="workshop-node-header">
              <strong>{event.title || event.agent}</strong>
              <div className="workshop-node-actions">
                <span
                  className={`workshop-badge workshop-badge-${event.status}`}
                >
                  {statusLabel(event.status)}
                </span>
                {onInterrupt && event.status === "running" ? (
                  <button
                    className="btn btn-secondary workshop-node-action"
                    type="button"
                    disabled={busySubagentId === event.id}
                    onClick={() => onInterrupt(event.id)}
                  >
                    {busySubagentId === event.id ? "Interrupting" : "Interrupt"}
                  </button>
                ) : null}
              </div>
            </div>
            {event.detail ? <p>{event.detail}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function Workshop({
  profile,
  visible = true,
  liveEvents = [],
}: WorkshopProps): React.JSX.Element {
  const [status, setStatus] = useState<WorkshopStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pauseBusy, setPauseBusy] = useState(false);
  const [busySubagentId, setBusySubagentId] = useState<string | null>(null);
  const [history, setHistory] = useState<WorkshopHistoryEntry[]>([]);
  // When set, the panels show this saved run instead of the live stream.
  const [viewingPath, setViewingPath] = useState<string | null>(null);
  const [viewingEvents, setViewingEvents] = useState<WorkshopDelegationEvent[]>(
    [],
  );

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await window.hermesAPI.getWorkshopStatus(profile));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const setPaused = useCallback(
    async (paused: boolean): Promise<void> => {
      setPauseBusy(true);
      setError(null);
      setActionMessage(null);
      try {
        const result = await window.hermesAPI.setWorkshopPaused(
          paused,
          profile,
        );
        setStatus((prev) => (prev ? { ...prev, paused: result.paused } : prev));
        setActionMessage(
          result.paused
            ? "New delegation spawns are paused. Active sub-agents keep running."
            : "Delegation spawning resumed.",
        );
        void refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setPauseBusy(false);
      }
    },
    [profile, refresh],
  );

  const interruptSubagent = useCallback(
    async (subagentId: string): Promise<void> => {
      setBusySubagentId(subagentId);
      setError(null);
      setActionMessage(null);
      try {
        const result = await window.hermesAPI.interruptWorkshopSubagent(
          subagentId,
          profile,
        );
        setActionMessage(
          result.found
            ? `Interrupt requested for ${result.subagentId}.`
            : `No active sub-agent found for ${result.subagentId}.`,
        );
        void refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusySubagentId(null);
      }
    },
    [profile, refresh],
  );

  const refreshHistory = useCallback(async (): Promise<void> => {
    try {
      setHistory(await window.hermesAPI.listWorkshopHistory(profile));
    } catch {
      // History is best-effort; a failure here shouldn't break the live view.
    }
  }, [profile]);

  const openHistory = useCallback(
    async (entry: WorkshopHistoryEntry): Promise<void> => {
      try {
        const detail = await window.hermesAPI.loadWorkshopHistory(
          entry.path,
          profile,
        );
        setViewingEvents(detail.events);
        setViewingPath(entry.path);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [profile],
  );

  const backToLive = useCallback((): void => {
    setViewingPath(null);
    setViewingEvents([]);
  }, []);

  useEffect(() => {
    if (!visible) return;
    void refresh();
    void refreshHistory();
  }, [refresh, refreshHistory, visible]);

  useEffect(() => {
    // Only poll the live stream while actually watching it. Viewing a saved
    // run is static, so polling would just churn.
    if (!visible || viewingPath) return;
    const interval = setInterval(() => {
      void refresh();
      void refreshHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, [refresh, refreshHistory, visible, viewingPath]);

  const isViewing = viewingPath !== null;
  const events = isViewing
    ? viewingEvents
    : mergeEvents(status?.events ?? [], liveEvents);
  const streamLabel = isViewing
    ? "History"
    : liveEvents.length > 0
      ? "Live"
      : status?.available
        ? status.paused
          ? "Paused"
          : "Live"
        : "Pending";
  const viewingEntry = isViewing
    ? history.find((entry) => entry.path === viewingPath)
    : undefined;
  const controlsDisabled = isViewing || pauseBusy;

  return (
    <section className="workshop-screen" aria-labelledby="workshop-title">
      <header className="workshop-header">
        <div>
          <span className="workshop-eyebrow">Phase 2 cockpit</span>
          <h1 id="workshop-title">Workshop</h1>
          <p>
            Watch Hermes delegation traffic as the main agent fans work out to
            sub-agents. Pause new spawns or interrupt a running sub-agent when a
            long task needs steering.
          </p>
          <p className="workshop-profile-note">
            Watching profile: <strong>{profile || "default"}</strong>
          </p>
        </div>
        {isViewing ? (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={backToLive}
          >
            <Refresh size={15} />
            Back to live
          </button>
        ) : (
          <div className="workshop-header-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => void setPaused(!status?.paused)}
              disabled={controlsDisabled}
            >
              {status?.paused ? "Resume Delegation" : "Pause Delegation"}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <Refresh size={15} className={loading ? "spin" : undefined} />
              Refresh
            </button>
          </div>
        )}
      </header>

      <div className="workshop-status-grid">
        <article className="workshop-status-card">
          <span>Stream</span>
          <strong>{streamLabel}</strong>
        </article>
        <article className="workshop-status-card">
          <span>Source</span>
          <strong>
            {isViewing ? "saved run" : (status?.source ?? "Checking")}
          </strong>
        </article>
        <article className="workshop-status-card">
          <span>Delegations</span>
          <strong>{events.length}</strong>
        </article>
        <article className="workshop-status-card">
          <span>{isViewing ? "Finished" : "Last Check"}</span>
          <strong>
            {isViewing
              ? viewingEntry
                ? formatHistoryTime(viewingEntry.finishedAt)
                : "—"
              : formatCheckedAt(status?.checkedAt)}
          </strong>
        </article>
      </div>

      {!isViewing && (error || status?.error || status?.message) && (
        <div
          className={`workshop-notice ${error || status?.error ? "workshop-notice-warn" : ""}`}
          role={error || status?.error ? "alert" : "status"}
        >
          <strong>
            {error || status?.error ? "Workshop not live" : "Workshop mounted"}
          </strong>
          <span>{error || status?.error || status?.message}</span>
        </div>
      )}

      {!isViewing && actionMessage && (
        <div className="workshop-notice" role="status">
          <strong>Workshop action sent</strong>
          <span>{actionMessage}</span>
        </div>
      )}

      {isViewing && (
        <div className="workshop-notice" role="status">
          <strong>Viewing saved run</strong>
          <span>
            {viewingEntry?.label || "Delegation history"} — read-only snapshot.
            Use “Back to live” to resume watching.
          </span>
        </div>
      )}

      <div className="workshop-content-grid">
        <section
          className="workshop-panel"
          aria-labelledby="delegation-tree-title"
        >
          <div className="workshop-panel-header">
            <h2 id="delegation-tree-title">Delegation Tree</h2>
            <span>
              max {status?.maxConcurrentChildren ?? "?"} children, depth{" "}
              {status?.maxSpawnDepth ?? "?"}
            </span>
          </div>
          <DelegationTree
            events={events}
            available={isViewing || status?.available === true}
            busySubagentId={busySubagentId}
            onInterrupt={isViewing ? undefined : interruptSubagent}
          />
        </section>

        <section
          className="workshop-panel"
          aria-labelledby="delegation-stream-title"
        >
          <div className="workshop-panel-header">
            <h2 id="delegation-stream-title">Message Stream</h2>
            <span>live event log</span>
          </div>
          {events.length === 0 ? (
            <div className="workshop-stream-empty">
              No sub-agent messages are available yet.
            </div>
          ) : (
            <ol className="workshop-stream">
              {events.map((event) => (
                <li key={`${event.id}-${event.timestamp ?? "event"}`}>
                  <span>{statusLabel(event.status)}</span>
                  <p>{event.detail || event.title || event.agent}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section
        className="workshop-panel workshop-history"
        aria-labelledby="delegation-history-title"
      >
        <div className="workshop-panel-header">
          <h2 id="delegation-history-title">
            <Clock size={15} /> History
          </h2>
          <span>
            {history.length} saved run{history.length === 1 ? "" : "s"}
          </span>
        </div>
        {history.length === 0 ? (
          <div className="workshop-stream-empty">
            Finished delegation runs are saved here automatically.
          </div>
        ) : (
          <ul className="workshop-history-list">
            {history.map((entry) => (
              <li key={entry.path}>
                <button
                  type="button"
                  className={`workshop-history-item ${entry.path === viewingPath ? "active" : ""}`}
                  onClick={() => void openHistory(entry)}
                >
                  <span className="workshop-history-label">
                    {entry.label || "Delegation run"}
                  </span>
                  <span className="workshop-history-meta">
                    {entry.count} subagent{entry.count === 1 ? "" : "s"} ·{" "}
                    {formatHistoryTime(entry.finishedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

export default Workshop;

import WebSocket from "ws";
import {
  getTuiDelegationStatus,
  getTuiRecentDelegationEvents,
  saveTuiSpawnTree,
  listTuiSpawnTrees,
  loadTuiSpawnTree,
} from "./hermes";
import { startDashboard } from "./dashboard";
import type { GatewayEvent } from "./tui-gateway-stream";
import type { ChatToolEvent } from "../shared/chat-stream";
import type {
  WorkshopDelegationEvent,
  WorkshopHistoryDetail,
  WorkshopHistoryEntry,
  WorkshopInterruptResult,
  WorkshopPauseResult,
  WorkshopStatus,
} from "../shared/workshop";

const RECENT_EVENT_LIMIT = 40;
const observedToolEvents = new Map<string, WorkshopDelegationEvent[]>();

interface WorkshopRpcFrame {
  id?: string | number;
  result?: unknown;
  error?: { message?: string };
}

function profileEventKey(profile?: string): string {
  return profile && profile !== "default" ? profile : "default";
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function normalizeStatus(value: unknown): WorkshopDelegationEvent["status"] {
  return value === "queued" ||
    value === "running" ||
    value === "completed" ||
    value === "failed" ||
    value === "paused"
    ? value
    : "unknown";
}

function mapActiveSubagent(raw: unknown): WorkshopDelegationEvent | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = stringValue(row.subagent_id);
  if (!id) return null;
  const model = stringValue(row.model);
  const toolCount = numberValue(row.tool_count) ?? 0;
  const startedAt = numberValue(row.started_at);
  return {
    id,
    parentId: stringValue(row.parent_id) || null,
    agent: model || "Subagent",
    status: normalizeStatus(row.status),
    title: stringValue(row.goal) || id,
    detail: [
      model ? `model: ${model}` : "",
      `tools used: ${toolCount}`,
      numberValue(row.depth) != null ? `depth: ${numberValue(row.depth)}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    timestamp: startedAt ? Math.round(startedAt * 1000) : undefined,
    source: "status",
  };
}

function mapRecentDelegationEvent(
  event: GatewayEvent,
): WorkshopDelegationEvent | null {
  const payload = event.payload ?? {};
  const subagentId = stringValue(payload.subagent_id);
  const toolId = stringValue(payload.tool_id);
  const id =
    subagentId || toolId || `${event.session_id || "session"}:${event.type}`;
  const model = stringValue(payload.model);
  const goal = stringValue(payload.goal) || stringValue(payload.context);
  const text =
    stringValue(payload.text) ||
    stringValue(payload.summary) ||
    stringValue(payload.tool_preview);

  if (event.type === "tool.start" && payload.name === "delegate_task") {
    return {
      id,
      parentId: null,
      agent: "Main agent",
      status: "running",
      title: "delegate_task",
      detail: goal || "Delegation tool call started.",
      source: "event",
    };
  }

  if (event.type === "tool.complete" && payload.name === "delegate_task") {
    return {
      id,
      parentId: null,
      agent: "Main agent",
      status: "completed",
      title: "delegate_task complete",
      detail: stringValue(payload.summary) || "Delegation tool call completed.",
      source: "event",
    };
  }

  if (!event.type.startsWith("subagent.")) return null;

  return {
    id,
    parentId: stringValue(payload.parent_id) || null,
    agent: model || "Subagent",
    status:
      event.type === "subagent.complete"
        ? normalizeStatus(payload.status) === "unknown"
          ? "completed"
          : normalizeStatus(payload.status)
        : "running",
    title: goal || stringValue(payload.child_session_id) || id,
    detail: [
      text,
      model ? `model: ${model}` : "",
      numberValue(payload.tool_count) != null
        ? `tools used: ${numberValue(payload.tool_count)}`
        : "",
      numberValue(payload.depth) != null
        ? `depth: ${numberValue(payload.depth)}`
        : "",
    ]
      .filter(Boolean)
      .join(" · "),
    source: "event",
  };
}

function mergeEvents(
  activeEvents: WorkshopDelegationEvent[],
  recentEvents: WorkshopDelegationEvent[],
): WorkshopDelegationEvent[] {
  const byId = new Map<string, WorkshopDelegationEvent>();
  for (const event of recentEvents) byId.set(event.id, event);
  for (const event of activeEvents) byId.set(event.id, event);
  return [...byId.values()];
}

function wsDataToString(data: unknown): string {
  if (typeof data === "string") return data;
  if (Buffer.isBuffer(data)) return data.toString("utf8");
  if (Array.isArray(data)) return Buffer.concat(data).toString("utf8");
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString("utf8");
  return String(data);
}

async function requestWorkshopRpc<T>(
  profile: string | undefined,
  method: string,
  params: Record<string, unknown>,
): Promise<T> {
  const status = await startDashboard(profile);
  if (!status.running || !status.connection?.wsUrl) {
    throw new Error(status.error || "Hermes dashboard is not running.");
  }

  const id = `workshop-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ws = new WebSocket(status.connection.wsUrl);

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`Workshop RPC timed out: ${method}`));
    }, 10_000);
    timer.unref?.();

    const cleanup = (): void => {
      clearTimeout(timer);
      ws.removeAllListeners();
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };

    ws.on("open", () => {
      ws.send(JSON.stringify({ id, jsonrpc: "2.0", method, params }));
    });
    ws.on("message", (data) => {
      let frame: WorkshopRpcFrame;
      try {
        frame = JSON.parse(wsDataToString(data)) as WorkshopRpcFrame;
      } catch {
        return;
      }
      if (String(frame.id ?? "") !== id) return;
      cleanup();
      if (frame.error) {
        reject(new Error(frame.error.message || "Workshop RPC failed"));
        return;
      }
      resolve(frame.result as T);
    });
    ws.on("error", (err) => {
      cleanup();
      reject(err instanceof Error ? err : new Error(String(err)));
    });
    ws.on("close", () => {
      cleanup();
      reject(new Error("Workshop RPC connection closed."));
    });
  });
}

export function recordWorkshopToolEvent(
  profile: string | undefined,
  runId: string,
  event: ChatToolEvent,
): void {
  const name = event.name || event.label || "";
  const text = [event.preview, event.result, event.label]
    .filter(Boolean)
    .join(" ");
  const looksLikeDelegation =
    name === "delegate_task" ||
    name.startsWith("subagent") ||
    /\b(delegate_task|subagent|delegat)/i.test(text);
  if (!looksLikeDelegation) return;

  const key = profileEventKey(profile);
  const rows = observedToolEvents.get(key) ?? [];
  rows.push({
    id: event.callId || `${runId}:${name}:${Date.now()}`,
    parentId: null,
    agent: name === "delegate_task" ? "Main agent" : "Subagent",
    status: event.status,
    title: event.label || name || "Delegation event",
    detail:
      event.result || event.preview || "Observed from desktop chat stream.",
    timestamp: Date.now(),
    source: "event",
  });
  observedToolEvents.set(key, rows.slice(-RECENT_EVENT_LIMIT));
}

export function recordWorkshopProgress(
  profile: string | undefined,
  runId: string,
  progress: string,
): void {
  if (!/\b(delegate_task|subagent|delegat)/i.test(progress)) return;
  recordWorkshopToolEvent(profile, runId, {
    callId: `${runId}:progress:${Date.now()}`,
    name: /subagent/i.test(progress) ? "subagent" : "delegate_task",
    status: "running",
    label: progress,
    preview: progress,
  });
}

export async function getWorkshopStatus(
  profile?: string,
): Promise<WorkshopStatus> {
  const checkedAt = Date.now();
  const key = profileEventKey(profile);
  try {
    const status = await getTuiDelegationStatus(profile);
    const activeEvents = (Array.isArray(status.active) ? status.active : [])
      .map(mapActiveSubagent)
      .filter((event): event is WorkshopDelegationEvent => event !== null);
    const recentEvents = getTuiRecentDelegationEvents(profile)
      .map(mapRecentDelegationEvent)
      .filter((event): event is WorkshopDelegationEvent => event !== null);
    const observedEvents = observedToolEvents.get(key) ?? [];
    const events = mergeEvents(activeEvents, [
      ...recentEvents,
      ...observedEvents,
    ]);
    return {
      available: true,
      source: "dashboard",
      checkedAt,
      events,
      paused: status.paused === true,
      maxSpawnDepth: numberValue(status.max_spawn_depth),
      maxConcurrentChildren: numberValue(status.max_concurrent_children),
      message: events.length
        ? undefined
        : "Connected to delegation.status. No active or recent subagent events are available right now.",
    };
  } catch (err) {
    // TUI delegation.status unreachable (e.g. running via API/runs-SSE
    // transport instead of the TUI gateway). Fall back to whatever the
    // chat-stream observer has recorded so Workshop still shows evidence
    // of delegate_task activity.
    const observedEvents =
      observedToolEvents.get(profileEventKey(profile)) ?? [];
    return {
      available: observedEvents.length > 0,
      source: observedEvents.length > 0 ? "dashboard" : "unavailable",
      checkedAt,
      events: observedEvents,
      message: observedEvents.length
        ? "Showing delegations observed from the desktop chat stream (Hermes delegation.status unreachable)."
        : "Workshop could not reach Hermes delegation.status.",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function setWorkshopPaused(
  profile: string | undefined,
  paused: boolean,
): Promise<WorkshopPauseResult> {
  const result = await requestWorkshopRpc<{ paused?: boolean }>(
    profile,
    "delegation.pause",
    { paused },
  );
  return { paused: result.paused === true };
}

export async function interruptWorkshopSubagent(
  profile: string | undefined,
  subagentId: string,
): Promise<WorkshopInterruptResult> {
  const id = subagentId.trim();
  if (!id) throw new Error("subagentId is required");
  const result = await requestWorkshopRpc<{
    found?: boolean;
    subagent_id?: string;
  }>(profile, "subagent.interrupt", { subagent_id: id });
  return {
    found: result.found === true,
    subagentId: stringValue(result.subagent_id) || id,
  };
}

// ── History (saved delegation trees) ─────────────────────────────────

/** Turn a WorkshopDelegationEvent into the subagent record shape the backend
 *  persists (and that loadWorkshopHistoryEntry reads back). */
function eventToSubagentRecord(
  event: WorkshopDelegationEvent,
): Record<string, unknown> {
  return {
    subagent_id: event.id,
    parent_id: event.parentId ?? null,
    goal: event.title ?? "",
    status: event.status,
    detail: event.detail ?? "",
    started_at: event.timestamp ? event.timestamp / 1000 : undefined,
  };
}

/**
 * Persist the just-finished turn's delegation tree, if any. Called on turn
 * completion. No-ops silently when the turn did no delegation, or when the
 * gateway/persistence is unavailable (history is best-effort).
 */
export async function saveWorkshopHistory(
  profile: string | undefined,
  sessionId: string | undefined,
  rawEvents?: GatewayEvent[],
): Promise<void> {
  try {
    let events: WorkshopDelegationEvent[];
    if (rawEvents && rawEvents.length > 0) {
      // Events captured by the renderer's dashboard transport (the path that
      // actually runs delegation). Preferred source — the main process's own
      // gateway client never sees these.
      events = mergeEvents(
        [],
        rawEvents
          .map(mapRecentDelegationEvent)
          .filter((event): event is WorkshopDelegationEvent => event !== null),
      );
    } else {
      // Fallback: the legacy main-process chat path records into these buffers.
      const recentEvents = getTuiRecentDelegationEvents(profile)
        .map(mapRecentDelegationEvent)
        .filter((event): event is WorkshopDelegationEvent => event !== null);
      const observedEvents =
        observedToolEvents.get(profileEventKey(profile)) ?? [];
      events = mergeEvents([], [...recentEvents, ...observedEvents]);
    }
    if (events.length === 0) return;

    const label =
      events.find((event) => event.title)?.title ||
      `${events.length} delegation${events.length === 1 ? "" : "s"}`;

    await saveTuiSpawnTree(profile, {
      session_id: sessionId,
      subagents: events.map(eventToSubagentRecord),
      finished_at: Date.now() / 1000,
      label,
    });
  } catch (err) {
    console.warn(
      "[workshop] Failed to save delegation history:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function listWorkshopHistory(
  profile?: string,
): Promise<WorkshopHistoryEntry[]> {
  const entries = await listTuiSpawnTrees(profile);
  return entries
    .filter((entry): entry is typeof entry & { path: string } => !!entry.path)
    .map((entry) => ({
      path: entry.path,
      sessionId: stringValue(entry.session_id),
      finishedAt:
        numberValue(entry.finished_at) != null
          ? Math.round((entry.finished_at as number) * 1000)
          : Date.now(),
      startedAt:
        numberValue(entry.started_at) != null
          ? Math.round((entry.started_at as number) * 1000)
          : undefined,
      label: stringValue(entry.label) || undefined,
      count: numberValue(entry.count) ?? 0,
    }));
}

export async function loadWorkshopHistory(
  profile: string | undefined,
  path: string,
): Promise<WorkshopHistoryDetail> {
  const raw = await loadTuiSpawnTree(profile, path);
  const subagents = Array.isArray(raw.subagents) ? raw.subagents : [];
  const events = subagents
    .map(mapActiveSubagent)
    .filter((event): event is WorkshopDelegationEvent => event !== null);
  return {
    path,
    sessionId: stringValue(raw.session_id),
    finishedAt:
      numberValue(raw.finished_at) != null
        ? Math.round((raw.finished_at as number) * 1000)
        : undefined,
    startedAt:
      numberValue(raw.started_at) != null
        ? Math.round((raw.started_at as number) * 1000)
        : undefined,
    label: stringValue(raw.label) || undefined,
    events,
  };
}

export interface WorkshopDelegationEvent {
  id: string;
  parentId?: string | null;
  agent: string;
  status: "queued" | "running" | "completed" | "failed" | "paused" | "unknown";
  title?: string;
  detail?: string;
  timestamp?: number;
  source?: "status" | "event";
}

export interface WorkshopStatus {
  available: boolean;
  source: "dashboard" | "unavailable";
  checkedAt: number;
  events: WorkshopDelegationEvent[];
  paused?: boolean;
  maxSpawnDepth?: number;
  maxConcurrentChildren?: number;
  message?: string;
  error?: string;
}

/** One saved delegation run, as listed in the Workshop history panel. */
export interface WorkshopHistoryEntry {
  /** Absolute path of the snapshot file (used as the load handle + key). */
  path: string;
  sessionId: string;
  /** Epoch seconds when the delegating turn finished. */
  finishedAt: number;
  /** Epoch seconds when it started, if the backend recorded one. */
  startedAt?: number;
  /** Optional human label (first delegation goal, etc.). */
  label?: string;
  /** Number of subagents in the saved tree. */
  count: number;
}

/** A fully-loaded saved delegation run, reusing the live event shape so the
 *  same DelegationTree/stream UI can render it. */
export interface WorkshopHistoryDetail {
  path: string;
  sessionId: string;
  finishedAt?: number;
  startedAt?: number;
  label?: string;
  events: WorkshopDelegationEvent[];
}

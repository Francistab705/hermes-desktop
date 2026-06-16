import { memo } from "react";
import { X, Pin } from "lucide-react";
import { OpenUIRenderer } from "./genui";

interface ArtifactsCanvasProps {
  /** The raw OpenUI Lang response (extracted from the fenced block). */
  response: string;
  /** Dismiss the canvas. */
  onClose: () => void;
}

/**
 * Side panel that renders a pinned OpenUI artifact using the same renderer
 * and component library as inline chat (Rule 5 — one renderer, two mounts).
 * Persists across chat scroll; dismissible via the close button.
 */
export const ArtifactsCanvas = memo(function ArtifactsCanvas({
  response,
  onClose,
}: ArtifactsCanvasProps): React.JSX.Element {
  return (
    <aside className="artifacts-canvas" aria-label="Pinned artifact">
      <div className="artifacts-canvas-header">
        <div className="artifacts-canvas-title">
          <Pin size={14} />
          <span>Pinned Artifact</span>
        </div>
        <button
          type="button"
          className="artifacts-canvas-close"
          onClick={onClose}
          aria-label="Close artifact canvas"
        >
          <X size={16} />
        </button>
      </div>
      <div className="artifacts-canvas-body">
        <OpenUIRenderer response={response} />
      </div>
    </aside>
  );
});

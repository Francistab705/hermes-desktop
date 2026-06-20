import {
  Renderer,
  createLibrary,
  type RendererProps,
} from "@openuidev/react-lang";
import { genUIComponents } from "./components";

/** Matches a complete fenced openui/genui block (opening + closing fence). */
const OPENUI_FENCE_RE = /^\s*```(?:openui|genui)\s*\r?\n([\s\S]*?)\r?\n```\s*$/i;

/** Matches complete fenced openui/genui blocks embedded in extra model text. */
const OPENUI_EMBEDDED_FENCE_RE = /```(?:openui|genui)\s*\r?\n([\s\S]*?)\r?\n```/gi;

/** Matches just the opening fence — used for streaming detection. */
const OPENUI_OPEN_FENCE_RE = /^\s*```(?:openui|genui)\s*\r?\n([\s\S]*)$/i;

/**
 * Extract the OpenUI response from a complete (non-streaming) message.
 * Returns null if the content is not a whole-message fenced openui block.
 */
export function getOpenUIResponse(value: string | null | undefined): string | null {
  const text = value ?? "";
  const match = OPENUI_FENCE_RE.exec(text);
  const response = match?.[1].trim();
  if (response && /^root\s*=/.test(response)) return response;

  const matches = [...text.matchAll(OPENUI_EMBEDDED_FENCE_RE)];
  for (const embedded of matches.reverse()) {
    const embeddedResponse = embedded[1].trim();
    if (/^root\s*=/.test(embeddedResponse)) return embeddedResponse;
  }

  return null;
}

export interface StreamingOpenUIResult {
  response: string;
  isStreaming: boolean;
}

/**
 * Extract the OpenUI response, handling both complete and in-progress
 * (streaming) fenced blocks. During streaming, the closing fence may
 * not be present yet.
 *
 * @param value     The accumulated message content so far.
 * @param pending   True while tokens are still arriving.
 * @returns         The extracted response + streaming flag, or null.
 */
export function getStreamingOpenUIResponse(
  value: string | null | undefined,
  pending: boolean,
): StreamingOpenUIResult | null {
  const text = value ?? "";

  // Try complete fence first (works for finished messages and for
  // streaming messages where the model has already emitted the closing fence).
  const complete = OPENUI_FENCE_RE.exec(text);
  if (complete) {
    const response = complete[1].trim();
    if (/^root\s*=/.test(response)) {
      return { response, isStreaming: false };
    }
    return null;
  }

  const embedded = getOpenUIResponse(text);
  if (embedded) return { response: embedded, isStreaming: false };

  // During streaming, the closing fence hasn't arrived yet.
  if (!pending) return null;

  const partial = OPENUI_OPEN_FENCE_RE.exec(text);
  if (!partial) return null;

  const response = partial[1].trim();
  // Need at least `root =` to start rendering
  if (!response || !/^root\s*=/.test(response)) return null;

  return { response, isStreaming: true };
}

export function isOpenUI(value: string | null | undefined): boolean {
  return getOpenUIResponse(value) !== null;
}

export const openUILibrary = createLibrary({
  components: genUIComponents,
});

type OpenUIRendererProps = Omit<RendererProps, "library"> & {
  library?: RendererProps["library"];
};

export function OpenUIRenderer({
  library = openUILibrary,
  ...props
}: OpenUIRendererProps): React.JSX.Element | null {
  return <Renderer {...props} library={library} />;
}

import {
  Component,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pin } from "lucide-react";
import icon from "../../assets/icon.png";
import { AgentMarkdown } from "../../components/AgentMarkdown";
import { AttachmentChip } from "../../components/AttachmentChip";
import {
  getStreamingOpenUIResponse,
  OpenUIRenderer,
  type StreamingOpenUIResult,
} from "../../components/genui";
import { MediaSegmentView } from "../../components/MediaImage";
import { useI18n } from "../../components/useI18n";
import { parseMediaTokens, cleanLeakedToolTags } from "./mediaUtils";
import type { ChatBubbleMessage, ChatMessage } from "./types";

export const APPROVAL_RE =
  /⚠️.*dangerous|requires? (your )?approval|\/approve.*\/deny|do you want (me )?to (proceed|continue|run|execute)/i;

interface GenUIBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface GenUIBoundaryState {
  hasError: boolean;
}

class GenUIBoundary extends Component<GenUIBoundaryProps, GenUIBoundaryState> {
  state: GenUIBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GenUIBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown): void {
    console.error("Failed to render OpenUI response", error);
  }

  override render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function GenUIMessage({
  response,
  isStreaming,
  fallback,
  onSendMessage,
}: {
  response: string;
  isStreaming: boolean;
  fallback: ReactNode;
  onSendMessage?: (text: string) => void;
}): React.JSX.Element {
  const [hasError, setHasError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasError(false);
  }, [response]);

  // Only trigger error fallback when streaming is done — partial trees
  // are expected to be incomplete / empty during streaming.
  useEffect(() => {
    if (isStreaming || hasError) return;
    if (!contentRef.current) return;
    if (contentRef.current.childElementCount === 0) setHasError(true);
  }, [hasError, isStreaming, response]);

  if (hasError) return <>{fallback}</>;

  return (
    <GenUIBoundary fallback={fallback}>
      <div ref={contentRef}>
        <OpenUIRenderer
          response={response}
          isStreaming={isStreaming}
          onAction={(event) => {
            if (onSendMessage && event.humanFriendlyMessage) {
              onSendMessage(event.humanFriendlyMessage);
            }
          }}
          onError={(errors) => {
            // Suppress errors during streaming — partial trees produce
            // transient parse failures that resolve as more tokens arrive.
            if (!isStreaming && errors.length > 0) setHasError(true);
          }}
          onParseResult={(result) => {
            if (!isStreaming && !result?.root) setHasError(true);
          }}
        />
      </div>
    </GenUIBoundary>
  );
}

function isChatBubbleMessage(msg: ChatMessage): msg is ChatBubbleMessage {
  return (
    msg.kind === "user" ||
    msg.kind === "assistant" ||
    (!msg.kind && (msg.role === "user" || msg.role === "agent"))
  );
}

export const HermesAvatar = memo(function HermesAvatar({
  size = 30,
}: {
  size?: number;
}): React.JSX.Element {
  return (
    <div className="chat-avatar chat-avatar-agent">
      <img src={icon} width={size} height={size} alt="" />
    </div>
  );
});

/**
 * Empty box the size of an avatar. Rendered in place of the avatar on
 * continuation rows of a turn (the thinking/tool rows and answer bubble that
 * follow the first row) so one turn shows a single avatar while every row
 * stays aligned to the same content column.
 */
export const AvatarSpacer = memo(function AvatarSpacer(): React.JSX.Element {
  return <div className="chat-avatar" aria-hidden="true" />;
});

interface MessageRowProps {
  msg: ChatMessage;
  isLast: boolean;
  isLoading: boolean;
  onApprove: () => void;
  onDeny: () => void;
  /** Send a message into the chat pipeline (used by GenUI FollowUps/Form). */
  onSendMessage?: (text: string) => void;
  /** Pin an OpenUI response to the Artifacts canvas. */
  onPinArtifact?: (response: string) => void;
  /** False on continuation rows of a turn — render a spacer instead of the
   *  avatar so the turn reads as one grouped block. Defaults to true. */
  showAvatar?: boolean;
}

export const MessageRow = memo(function MessageRow({
  msg,
  isLast,
  isLoading,
  onApprove,
  onDeny,
  onSendMessage,
  onPinArtifact,
  showAvatar = true,
}: MessageRowProps): React.JSX.Element {
  const { t } = useI18n();

  // MessageRow is wrapped in memo() but still re-renders on any prop change
  // (e.g. isLoading toggling at the end of a stream), and `parseMediaTokens`
  // runs a full regex pipeline. Cache the result against the message content
  // so a long conversation doesn't reparse every row on every render.
  // Only agent bubbles need media parsing — user bubbles render content
  // verbatim — so this is gated on the role to skip the work entirely for
  // user rows. (Follow-up item from PR #303 review.)
  const bubbleContent = isChatBubbleMessage(msg)
    ? (msg as ChatBubbleMessage).content
    : null;
  const isPending = isChatBubbleMessage(msg) && !!(msg as ChatBubbleMessage).pending;
  const openUIResult: StreamingOpenUIResult | null = useMemo(
    () =>
      msg.role === "agent" && bubbleContent
        ? getStreamingOpenUIResponse(bubbleContent, isPending)
        : null,
    [msg.role, bubbleContent, isPending],
  );
  const segments = useMemo(
    () =>
      msg.role === "agent" && bubbleContent && !openUIResult
        ? // Recover any tool/skill call the model leaked as text (e.g. a raw
          // `<skill_view>{"answer": …}</skill_view>` tag) before tokenizing.
          parseMediaTokens(cleanLeakedToolTags(bubbleContent))
        : null,
    [msg.role, bubbleContent, openUIResult],
  );

  // Only chat bubble messages have content/attachments
  if (!isChatBubbleMessage(msg)) {
    return (
      <div className={`chat-message chat-message-${msg.role}`}>
        {showAvatar ? <HermesAvatar /> : <AvatarSpacer />}
        <div className={`chat-bubble chat-bubble-${msg.role}`}>
          {/* Reasoning/tool messages handled separately */}
        </div>
      </div>
    );
  }

  const showApprovalBar =
    msg.role === "agent" &&
    !msg.error &&
    !isLoading &&
    isLast &&
    APPROVAL_RE.test(msg.content);
  const hasAttachments = !!msg.attachments && msg.attachments.length > 0;

  return (
    <div
      className={`chat-message chat-message-${msg.role}${
        showAvatar ? "" : " chat-message--grouped"
      }`}
    >
      {!showAvatar ? (
        <AvatarSpacer />
      ) : msg.role === "user" ? (
        <div className="chat-avatar chat-avatar-user">U</div>
      ) : (
        <HermesAvatar />
      )}
      <div
        className={`chat-bubble chat-bubble-${msg.role}${
          msg.error ? " chat-bubble-error" : ""
        }`}
      >
        {hasAttachments && (
          <div className="chat-message-attachments">
            {msg.attachments!.map((att) => (
              <AttachmentChip key={att.id} attachment={att} />
            ))}
          </div>
        )}
        {msg.content &&
          (openUIResult ? (
            <div className="genui-message-wrapper">
              {onPinArtifact && !openUIResult.isStreaming && (
                <button
                  type="button"
                  className="genui-pin-btn"
                  onClick={() => onPinArtifact(openUIResult.response)}
                  aria-label="Pin to artifact canvas"
                >
                  <Pin size={12} />
                  Pin
                </button>
              )}
              <GenUIMessage
                response={openUIResult.response}
                isStreaming={openUIResult.isStreaming}
                fallback={<AgentMarkdown>{msg.content}</AgentMarkdown>}
                onSendMessage={onSendMessage}
              />
            </div>
          ) : msg.role === "agent" && segments ? (
            segments.map((segment) =>
              segment.type === "text" ? (
                segment.value.trim() ? (
                  // Keyed on the segment's character offset rather than its
                  // array index — a MEDIA: token appearing mid-stream shifts
                  // every subsequent index, which would otherwise re-mount
                  // each downstream MediaSegmentView and re-fire its
                  // `mediaFileExists` probe.
                  <AgentMarkdown key={`t-${segment.start}`}>
                    {segment.value}
                  </AgentMarkdown>
                ) : null
              ) : (
                <MediaSegmentView
                  key={`m-${segment.start}`}
                  token={segment.token}
                  raw={segment.raw}
                  source={segment.source}
                />
              ),
            )
          ) : (
            msg.content
          ))}
        {msg.error && (
          <div className="chat-error-message" role="alert">
            {msg.error}
          </div>
        )}
      </div>
      {showApprovalBar && (
        <div className="chat-approval-bar">
          <button
            className="chat-approval-btn chat-approve"
            onClick={onApprove}
          >
            {t("chat.approve")}
          </button>
          <button className="chat-approval-btn chat-deny" onClick={onDeny}>
            {t("chat.deny")}
          </button>
        </div>
      )}
    </div>
  );
});

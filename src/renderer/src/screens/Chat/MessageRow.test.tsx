import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../components/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "en",
    setLocale: vi.fn(),
  }),
}));

import { MessageRow } from "./MessageRow";
import type { ChatBubbleMessage } from "./types";

function agentMessage(
  content: string,
  overrides?: Partial<ChatBubbleMessage>,
): ChatBubbleMessage {
  return {
    id: "msg-1",
    kind: "assistant",
    role: "agent",
    content,
    ...overrides,
  };
}

describe("MessageRow", () => {
  it("renders explicit OpenUI fenced blocks as GenUI", async () => {
    render(
      <MessageRow
        msg={agentMessage(
          '```openui\nroot = Callout("Heads up", "Check the weekly numbers")\n```',
        )}
        isLast={false}
        isLoading={false}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />,
    );

    expect(await screen.findByText("Heads up")).toBeInTheDocument();
    expect(screen.getByText("Check the weekly numbers")).toBeInTheDocument();
  });

  it("does not render bare OpenUI code without an explicit fence", () => {
    render(
      <MessageRow
        msg={agentMessage('root = Callout("Heads up", "Check")')}
        isLast={false}
        isLoading={false}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />,
    );

    expect(screen.queryByRole("region", { name: "Heads up" })).not.toBeInTheDocument();
    expect(screen.getByText('root = Callout("Heads up", "Check")')).toBeInTheDocument();
  });

  it("falls back to the original fenced markdown when OpenUI rendering fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <MessageRow
        msg={agentMessage('```openui\nroot = Missing("Value")\n```')}
        isLast={false}
        isLoading={false}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />,
    );

    expect(await screen.findByText('root = Missing("Value")')).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it("renders a partial OpenUI tree while streaming (pending=true, no closing fence)", async () => {
    render(
      <MessageRow
        msg={agentMessage(
          '```openui\nroot = Callout("Streaming", "Partial tree")',
          { pending: true },
        )}
        isLast={true}
        isLoading={true}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />,
    );

    expect(await screen.findByText("Streaming")).toBeInTheDocument();
    expect(screen.getByText("Partial tree")).toBeInTheDocument();
  });

  it("does not render GenUI for an open fence without root when streaming", () => {
    render(
      <MessageRow
        msg={agentMessage("```openui\n", { pending: true })}
        isLast={true}
        isLoading={true}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />,
    );

    // Should show raw content, not GenUI
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});

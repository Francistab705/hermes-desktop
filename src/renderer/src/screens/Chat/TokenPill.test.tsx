import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TokenPill } from "./TokenPill";

describe("TokenPill", () => {
  it("renders a waiting state before usage arrives", () => {
    render(<TokenPill usage={null} contextUsage={null} />);

    expect(screen.getByText("No usage")).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
  });

  it("expands to show usage breakdown", () => {
    render(
      <TokenPill
        usage={{
          promptTokens: 12_000,
          completionTokens: 3_000,
          totalTokens: 15_000,
          cost: 0.1234,
          cacheReadTokens: 1_000,
        }}
        contextUsage={{ used: 12_000, window: 120_000, cacheReadTokens: 1_000 }}
        model="claude-sonnet-4-6"
        provider="anthropic"
      />,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(
      screen.getByRole("dialog", { name: "Token usage breakdown" }),
    ).toBeInTheDocument();
    expect(screen.getByText("claude-sonnet-4-6")).toBeInTheDocument();
    expect(screen.getByText("anthropic")).toBeInTheDocument();
    expect(screen.getByText("$0.1234")).toBeInTheDocument();
    expect(screen.getByText("12k / 120k (10%)")).toBeInTheDocument();
  });

  it("shows warning and critical non-color state labels", () => {
    const { rerender } = render(
      <TokenPill
        usage={{ promptTokens: 80, completionTokens: 20, totalTokens: 100 }}
        contextUsage={{ used: 80, window: 100 }}
      />,
    );

    expect(screen.getByText("Watch")).toBeInTheDocument();

    rerender(
      <TokenPill
        usage={{ promptTokens: 95, completionTokens: 5, totalTokens: 100 }}
        contextUsage={{ used: 95, window: 100 }}
      />,
    );

    expect(screen.getByText("Critical")).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Workshop from "./Workshop";
import type { WorkshopStatus } from "../../../../shared/workshop";

describe("Workshop", () => {
  it("renders the pending read-only workshop state", async () => {
    const status: WorkshopStatus = {
      available: false,
      source: "dashboard",
      checkedAt: 1,
      events: [],
      message: "delegation.status pending",
    };
    window.hermesAPI = {
      getWorkshopStatus: vi.fn().mockResolvedValue(status),
      listWorkshopHistory: vi.fn().mockResolvedValue([]),
      loadWorkshopHistory: vi.fn(),
    } as unknown as typeof window.hermesAPI;

    render(<Workshop profile="default" />);

    expect(
      await screen.findByRole("heading", { name: "Workshop" }),
    ).toBeInTheDocument();
    expect(screen.getByText("default")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("delegation.status pending")).toBeInTheDocument();
    expect(screen.getByText("No delegation traffic yet")).toBeInTheDocument();
    await waitFor(() =>
      expect(window.hermesAPI.getWorkshopStatus).toHaveBeenCalledWith(
        "default",
      ),
    );
  });

  it("loads and shows a saved delegation run from history", async () => {
    const status: WorkshopStatus = {
      available: true,
      source: "dashboard",
      checkedAt: 1,
      events: [],
    };
    const historyEntry = {
      path: "/tmp/spawn-trees/s1/run.json",
      sessionId: "s1",
      finishedAt: Date.now(),
      label: "Research TypeScript, Rust, Go",
      count: 3,
    };
    window.hermesAPI = {
      getWorkshopStatus: vi.fn().mockResolvedValue(status),
      listWorkshopHistory: vi.fn().mockResolvedValue([historyEntry]),
      loadWorkshopHistory: vi.fn().mockResolvedValue({
        path: historyEntry.path,
        sessionId: "s1",
        finishedAt: historyEntry.finishedAt,
        label: historyEntry.label,
        events: [
          {
            id: "sub-1",
            agent: "Subagent",
            status: "completed",
            title: "Research TypeScript",
            detail: "model: x · tools used: 5",
          },
        ],
      }),
    } as unknown as typeof window.hermesAPI;

    render(<Workshop profile="default" />);

    const historyButton = await screen.findByText(
      "Research TypeScript, Rust, Go",
    );
    historyButton.click();

    expect(await screen.findByText("Viewing saved run")).toBeInTheDocument();
    expect(screen.getByText("Research TypeScript")).toBeInTheDocument();
    await waitFor(() =>
      expect(window.hermesAPI.loadWorkshopHistory).toHaveBeenCalledWith(
        historyEntry.path,
        "default",
      ),
    );
  });

  it("renders live delegation events from the active chat stream", async () => {
    const status: WorkshopStatus = {
      available: true,
      source: "dashboard",
      checkedAt: 1,
      events: [],
    };
    window.hermesAPI = {
      getWorkshopStatus: vi.fn().mockResolvedValue(status),
      listWorkshopHistory: vi.fn().mockResolvedValue([]),
      loadWorkshopHistory: vi.fn(),
    } as unknown as typeof window.hermesAPI;

    render(
      <Workshop
        profile="default"
        liveEvents={[
          {
            id: "delegate-1",
            agent: "Main agent",
            status: "running",
            title: "delegate_task",
            detail: "Delegation tool call started.",
          },
        ]}
      />,
    );

    expect(await screen.findByText("delegate_task")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});

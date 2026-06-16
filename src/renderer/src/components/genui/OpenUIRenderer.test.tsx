import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpenUIRenderer } from "./OpenUIRenderer";

describe("OpenUIRenderer", () => {
  it("renders a callout through the shared library", async () => {
    render(
      <OpenUIRenderer
        response={'root = Callout("Heads up", "Check the weekly numbers")'}
      />,
    );

    expect(await screen.findByText("Heads up")).toBeInTheDocument();
    expect(screen.getByText("Check the weekly numbers")).toBeInTheDocument();
  });

  it("renders dashboard components through the shared library", async () => {
    render(
      <OpenUIRenderer
        response={`root = Stack([summary, table, plan])
summary = KPIRow([StatTile("Revenue", "$12.4k", "+8%"), StatTile("Churn", "2.1%", "-0.4%")])
table = DataTable(["Name", "Status"], [["Apollo", "Green"], ["Zeus", "Watch"]])
plan = PlanCard("Launch checklist", ["Confirm copy", "Ship MVP"])`}
      />,
    );

    expect(await screen.findByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("$12.4k")).toBeInTheDocument();
    expect(screen.getByText("Apollo")).toBeInTheDocument();
    expect(screen.getByText("Launch checklist")).toBeInTheDocument();
    expect(screen.getByText("Ship MVP")).toBeInTheDocument();
  });

  it("renders interactive-ready follow-up and form controls", async () => {
    render(
      <OpenUIRenderer
        response={`root = Stack([followups, form])
followups = FollowUps(["Show risks", "Draft next steps"])
form = Form("Intake", ["Company", "Priority"])`}
      />,
    );

    expect(
      await screen.findByRole("button", { name: "Show risks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Draft next steps" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Company")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit Intake" })).toBeEnabled();
  });

  it("renders Hermes-specific work summary components", async () => {
    render(
      <OpenUIRenderer
        response={`root = Stack([status, risks, tools, files])
status = AgentStatus("Review", "In progress", "Checking GenUI integration")
risks = RiskList("Risks", ["Malformed OpenUI must fall back", "Actions are read-only for now"])
tools = ToolSummary("Tool activity", [{ name: "tests", outcome: "passed" }, { name: "typecheck", outcome: "passed" }])
files = FileChangeCard("Changed files", ["src/renderer/src/screens/Chat/MessageRow.tsx"], "OpenUI rendering is wired into chat")`}
      />,
    );

    expect(await screen.findByText("Review")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("Malformed OpenUI must fall back")).toBeInTheDocument();
    expect(screen.getByText("tests")).toBeInTheDocument();
    expect(screen.getAllByText("passed")).toHaveLength(2);
    expect(
      screen.getByText("src/renderer/src/screens/Chat/MessageRow.tsx"),
    ).toBeInTheDocument();
  });
});

import { defineComponent, useTriggerAction } from "@openuidev/react-lang";
import type { ReactNode } from "react";
import { z } from "zod/v4";

function renderChildren(
  values: unknown[],
  renderNode: (value: unknown) => ReactNode,
): ReactNode[] {
  return values.map((value, index) => (
    <div className="genui-stack-item" key={index}>
      {renderNode(value)}
    </div>
  ));
}

export const Stack = defineComponent({
  name: "Stack",
  description: "Arranges child components in a vertical stack.",
  props: z.object({
    children: z.array(z.unknown()),
  }),
  component: ({ props: { children }, renderNode }) => (
    <div className="genui-stack">{renderChildren(children, renderNode)}</div>
  ),
});

export const Callout = defineComponent({
  name: "Callout",
  description: "Highlights an important note with a title and body text.",
  props: z.object({
    title: z.string(),
    body: z.string(),
  }),
  component: ({ props: { title, body } }) => (
    <section className="genui-callout" aria-label={title}>
      <h3 className="genui-callout-title">{title}</h3>
      <p className="genui-callout-body">{body}</p>
    </section>
  ),
});

export const StatTile = defineComponent({
  name: "StatTile",
  description: "Shows one metric label, value, and optional change text.",
  props: z.object({
    label: z.string(),
    value: z.string(),
    change: z.string().optional(),
  }),
  component: ({ props: { label, value, change } }) => (
    <article className="genui-stat-tile">
      <div className="genui-stat-label">{label}</div>
      <div className="genui-stat-value">{value}</div>
      {change ? <div className="genui-stat-change">{change}</div> : null}
    </article>
  ),
});

export const KPIRow = defineComponent({
  name: "KPIRow",
  description: "Displays metric tiles in a compact responsive row.",
  props: z.object({
    tiles: z.array(z.unknown()),
  }),
  component: ({ props: { tiles }, renderNode }) => (
    <div className="genui-kpi-row">{renderChildren(tiles, renderNode)}</div>
  ),
});

export const DataTable = defineComponent({
  name: "DataTable",
  description: "Renders simple tabular data from column headings and rows.",
  props: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  component: ({ props: { columns, rows } }) => (
    <div className="genui-table-wrap">
      <table className="genui-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, columnIndex) => (
                <td key={`${column}-${columnIndex}`}>{row[columnIndex] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
});

export const PlanCard = defineComponent({
  name: "PlanCard",
  description: "Shows a titled action plan as a checklist.",
  props: z.object({
    title: z.string(),
    steps: z.array(z.string()),
  }),
  component: ({ props: { title, steps } }) => (
    <section className="genui-plan-card" aria-label={title}>
      <h3 className="genui-plan-title">{title}</h3>
      <ol className="genui-plan-list">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  ),
});

export const FollowUps = defineComponent({
  name: "FollowUps",
  description: "Shows suggested next prompts as keyboard-accessible buttons.",
  props: z.object({
    prompts: z.array(z.string()),
  }),
  component: ({ props: { prompts } }) => {
    const triggerAction = useTriggerAction();

    return (
      <div className="genui-followups" aria-label="Suggested follow-ups">
        {prompts.map((prompt) => (
          <button
            className="genui-followup"
            key={prompt}
            onClick={() => void triggerAction(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>
    );
  },
});

export const Form = defineComponent({
  name: "Form",
  description: "Renders a simple labeled text-input form for chat submission.",
  props: z.object({
    title: z.string(),
    fields: z.array(z.string()),
  }),
  component: ({ props: { title, fields } }) => {
    const triggerAction = useTriggerAction();

    return (
      <form
        className="genui-form"
        aria-label={title}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const entries = fields
            .map((field) => {
              const value = (formData.get(field) as string | null)?.trim();
              return value ? `${field}: ${value}` : null;
            })
            .filter(Boolean);
          if (entries.length > 0) {
            void triggerAction(`[${title}] ${entries.join(", ")}`);
          }
        }}
      >
        <h3 className="genui-form-title">{title}</h3>
        <div className="genui-form-fields">
          {fields.map((field) => (
            <label className="genui-form-field" key={field}>
              <span>{field}</span>
              <input name={field} type="text" />
            </label>
          ))}
        </div>
        <button className="genui-form-submit" type="submit">
          Submit {title}
        </button>
      </form>
    );
  },
});

export const AgentStatus = defineComponent({
  name: "AgentStatus",
  description: "Shows the agent's current phase, status, and short detail text.",
  props: z.object({
    phase: z.string(),
    status: z.string(),
    detail: z.string().optional(),
  }),
  component: ({ props: { phase, status, detail } }) => (
    <section className="genui-agent-status" aria-label="Agent status">
      <div className="genui-agent-status-main">
        <span className="genui-agent-status-phase">{phase}</span>
        <span className="genui-agent-status-pill">{status}</span>
      </div>
      {detail ? <p className="genui-agent-status-detail">{detail}</p> : null}
    </section>
  ),
});

export const RiskList = defineComponent({
  name: "RiskList",
  description: "Displays a titled list of risks or blockers.",
  props: z.object({
    title: z.string(),
    risks: z.array(z.string()),
  }),
  component: ({ props: { title, risks } }) => (
    <section className="genui-risk-list" aria-label={title}>
      <h3 className="genui-risk-title">{title}</h3>
      <ul className="genui-risk-items">
        {risks.map((risk, index) => (
          <li key={`${risk}-${index}`}>{risk}</li>
        ))}
      </ul>
    </section>
  ),
});

export const ToolSummary = defineComponent({
  name: "ToolSummary",
  description: "Summarizes recent tool activity with outcome labels.",
  props: z.object({
    title: z.string(),
    tools: z.array(
      z.object({
        name: z.string(),
        outcome: z.string(),
      }),
    ),
  }),
  component: ({ props: { title, tools } }) => (
    <section className="genui-tool-summary" aria-label={title}>
      <h3 className="genui-tool-title">{title}</h3>
      <div className="genui-tool-items">
        {tools.map((tool, index) => (
          <div className="genui-tool-item" key={`${tool.name}-${index}`}>
            <span className="genui-tool-name">{tool.name}</span>
            <span className="genui-tool-outcome">{tool.outcome}</span>
          </div>
        ))}
      </div>
    </section>
  ),
});

export const FileChangeCard = defineComponent({
  name: "FileChangeCard",
  description: "Shows a concise summary of file changes made by the agent.",
  props: z.object({
    title: z.string(),
    files: z.array(z.string()),
    summary: z.string().optional(),
  }),
  component: ({ props: { title, files, summary } }) => (
    <section className="genui-file-card" aria-label={title}>
      <h3 className="genui-file-title">{title}</h3>
      {summary ? <p className="genui-file-summary">{summary}</p> : null}
      <ul className="genui-file-list">
        {files.map((file, index) => (
          <li key={`${file}-${index}`}>
            <code>{file}</code>
          </li>
        ))}
      </ul>
    </section>
  ),
});

export const genUIComponents = [
  Stack,
  Callout,
  StatTile,
  KPIRow,
  DataTable,
  PlanCard,
  FollowUps,
  Form,
  AgentStatus,
  RiskList,
  ToolSummary,
  FileChangeCard,
];

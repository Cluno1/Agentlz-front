import React, { useMemo } from "react";
import { Space, Tag } from "@arco-design/web-react";
import type {
  CheckOutput,
  PdcEventEnvelope,
  ToolCall,
  WorkflowPlan,
} from "../../../data/api/agent/type";

type Props = {
  events: PdcEventEnvelope[];
  isDark?: boolean;
};

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function preview(value: unknown, max = 220): string {
  const text = asText(value).trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function latestPayload<T>(events: PdcEventEnvelope[], evt: string): T | undefined {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (events[i]?.evt === evt) return events[i].payload as T;
  }
  return undefined;
}

function Section({
  title,
  children,
  muted,
}: {
  title: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(148, 163, 184, 0.28)",
        borderRadius: 8,
        padding: 12,
        minHeight: 92,
        background: muted ? "rgba(148, 163, 184, 0.08)" : "transparent",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

const PdcTracePanel: React.FC<Props> = ({ events, isDark }) => {
  const traceId = events.find((x) => x.trace_id)?.trace_id || "";
  const plan = latestPayload<WorkflowPlan>(events, "planner.plan");
  const check = latestPayload<CheckOutput>(events, "check.summary");
  const finalText = latestPayload<string>(events, "final");
  const executorSummary = latestPayload<string>(events, "executor.summary");

  const stageNames = useMemo(
    () =>
      events
        .filter((x) => x.evt === "chain.step")
        .map((x) => String(x.payload || ""))
        .filter(Boolean),
    [events],
  );

  const toolEvents = useMemo(
    () =>
      events.filter((x) =>
        ["call.start", "call.end", "executor.error"].includes(x.evt),
      ),
    [events],
  );

  if (!events.length) return null;

  return (
    <div
      style={{
        marginTop: 16,
        borderRadius: 10,
        border: "1px solid rgba(100, 116, 139, 0.22)",
        background: isDark ? "#1f2937" : "#f8fafc",
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Space wrap>
          <span style={{ fontWeight: 600 }}>执行链路</span>
          {stageNames.map((name, index) => (
            <Tag key={`${name}-${index}`} color="arcoblue" size="small">
              {name}
            </Tag>
          ))}
        </Space>
        {traceId && (
          <span
            style={{
              fontSize: 12,
              color: "#64748b",
              maxWidth: 260,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={traceId}
          >
            trace {traceId}
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        <Section title="Planner" muted={!plan}>
          {plan ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                  execution_chain
                </div>
                <Space wrap>
                  {(plan.execution_chain || []).length ? (
                    (plan.execution_chain || []).map((item, index) => (
                      <Tag key={`${item}-${index}`} size="small">
                        {item}
                      </Tag>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>空</span>
                  )}
                </Space>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                  mcp_config
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(plan.mcp_config || []).length ? (
                    (plan.mcp_config || []).map((item, index) => (
                      <div
                        key={`${item.name || "mcp"}-${index}`}
                        style={{ fontSize: 12, lineHeight: 1.5 }}
                      >
                        <b>{item.name || "-"}</b>
                        <span style={{ color: "#64748b" }}>
                          {" "}
                          {item.transport || ""} {preview(item.command, 80)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>空</span>
                  )}
                </div>
              </div>
              {plan.instructions && (
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: 12,
                    color: "#475569",
                  }}
                >
                  {plan.instructions}
                </pre>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "#94a3b8" }}>等待规划</span>
          )}
        </Section>

        <Section title="Executor" muted={!toolEvents.length && !executorSummary}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {toolEvents.length ? (
              toolEvents.map((event, index) => {
                const payload = (event.payload || {}) as ToolCall & {
                  stage?: string;
                  message?: string;
                };
                const isError = event.evt === "executor.error";
                return (
                  <div
                    key={`${event.seq || index}-${event.evt}`}
                    style={{
                      borderLeft: `3px solid ${isError ? "#ef4444" : "#38bdf8"}`,
                      paddingLeft: 8,
                      fontSize: 12,
                      lineHeight: 1.55,
                    }}
                  >
                    <Space wrap size={6}>
                      <Tag size="small" color={isError ? "red" : "cyan"}>
                        {event.evt}
                      </Tag>
                      <b>{payload.name || payload.stage || "-"}</b>
                      {payload.status && <span>{payload.status}</span>}
                    </Space>
                    {(payload.input || payload.message) && (
                      <div style={{ color: "#64748b", wordBreak: "break-word" }}>
                        输入 {preview(payload.input || payload.message)}
                      </div>
                    )}
                    {payload.output && (
                      <div style={{ color: "#334155", wordBreak: "break-word" }}>
                        输出 {preview(payload.output)}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <span style={{ fontSize: 12, color: "#94a3b8" }}>等待工具调用</span>
            )}
            {executorSummary && (
              <pre
                style={{
                  margin: 0,
                  maxHeight: 160,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: 12,
                  color: "#475569",
                }}
              >
                {executorSummary}
              </pre>
            )}
          </div>
        </Section>

        <Section title="Check" muted={!check}>
          {check ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Space wrap>
                <Tag color={check.judge ? "green" : "orange"} size="small">
                  {check.judge ? "通过" : "未通过"}
                </Tag>
                {typeof check.score === "number" && (
                  <Tag color="purple" size="small">
                    {check.score}
                  </Tag>
                )}
              </Space>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: "#475569" }}>
                {check.reasoning || "-"}
              </div>
              {(check.tool_assessments || []).slice(0, 4).map((item, index) => (
                <div
                  key={`${item.mcp_id || item.server || index}`}
                  style={{ fontSize: 12, color: "#64748b" }}
                >
                  {item.server || item.mcp_id || "tool"}:{" "}
                  {item.micro_score ?? "-"} {item.micro_reason || ""}
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "#94a3b8" }}>等待校验</span>
          )}
        </Section>
      </div>

      {finalText && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "#64748b",
            wordBreak: "break-word",
          }}
        >
          final {preview(finalText, 360)}
        </div>
      )}
    </div>
  );
};

export default PdcTracePanel;

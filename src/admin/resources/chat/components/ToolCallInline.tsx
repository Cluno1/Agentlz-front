// OpenWebUI 风格内联工具调用：灰体小字「调用 X 工具 ×N」，点击展开每次 input/output。
import React, { useMemo } from "react";
import { Collapse, Typography } from "@arco-design/web-react";
import type { ToolCall } from "../../../data/api/agent/type";

type Props = { calls: ToolCall[]; isDark?: boolean };

function toText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

type CallItem = {
  name: string;
  server: string;
  input: string;
  output: string;
  running: boolean;
};

const ToolCallInline: React.FC<Props> = ({ calls, isDark }) => {
  const items = useMemo<CallItem[]>(() => {
    const list: CallItem[] = [];
    for (const c of calls || []) {
      const name = String(c?.name || "tool");
      const server = String(c?.server || "");
      const isEnd = String(c?.status || "") !== "start";
      if (!isEnd) {
        list.push({ name, server, input: toText(c?.input), output: "", running: true });
      } else {
        let matched = false;
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i].running && list[i].name === name && list[i].server === server) {
            list[i] = { ...list[i], output: toText(c?.output), running: false };
            matched = true;
            break;
          }
        }
        if (!matched) {
          list.push({ name, server, input: toText(c?.input), output: toText(c?.output), running: false });
        }
      }
    }
    return list;
  }, [calls]);

  if (!items.length) return null;

  const counts = items.reduce<Record<string, number>>((m, it) => {
    m[it.name] = (m[it.name] || 0) + 1;
    return m;
  }, {});
  const summary = Object.entries(counts)
    .map(([n, c]) => `调用 ${n} 工具 ×${c}`)
    .join("，");
  const gray = isDark ? "#9ca3af" : "#8c8c8c";
  const preStyle: React.CSSProperties = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    margin: "2px 0 6px",
    maxHeight: 220,
    overflow: "auto",
    fontSize: 12,
  };

  return (
    <div style={{ margin: "4px 0 8px" }}>
      <Collapse bordered={false} style={{ background: "transparent" }}>
        <Collapse.Item
          name="tools"
          header={<span style={{ color: gray, fontSize: 12 }}>🔧 {summary}</span>}
        >
          {items.map((it, idx) => (
            <div key={idx} style={{ marginBottom: 10, fontSize: 12, color: gray }}>
              <div style={{ marginBottom: 4 }}>
                {idx + 1}. {it.name}
                {it.server ? ` @ ${it.server}` : ""}
                {it.running ? "（运行中…）" : "（完成）"}
              </div>
              <Typography.Text style={{ fontSize: 12 }}>输入：</Typography.Text>
              <pre style={preStyle}>{it.input || "-"}</pre>
              <Typography.Text style={{ fontSize: 12 }}>输出：</Typography.Text>
              <pre style={{ ...preStyle, maxHeight: 280 }}>
                {it.running ? "…" : it.output || "-"}
              </pre>
            </div>
          ))}
        </Collapse.Item>
      </Collapse>
    </div>
  );
};

export default ToolCallInline;

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useGetOne, useTranslate, Title } from "react-admin";
import { useParams } from "react-router-dom";
import {
  Card,
  Space,
  Tag,
  Typography,
  Avatar,
  Divider,
} from "@arco-design/web-react";
import { useDarkMode } from "../../data/hook/useDark";

const McpShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const translate = useTranslate();
  const { textColor, cardColorStyle } = useDarkMode();
  const { data, isLoading, error } = useGetOne("mcp", { id });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as any)?.message || "Error"}</div>;
  if (!data) return <div>No data</div>;

  const t = (key: string, def?: string) =>
    translate(`mcp.ui.columns.${key}`, { _: def || key });

  return (
    <Card
      title={
        <Title title={translate("mcp.ui.columns.view", { _: "查看 MCP" })} />
      }
      bordered
      style={cardColorStyle}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space size={12} align="center">
          <Avatar size={36} style={{ backgroundColor: "#1659FF" }}>
            {(data.name || "-").slice(0, 1).toUpperCase()}
          </Avatar>
          <Typography.Title heading={4} style={{ color: textColor, margin: 0 }}>
            {data.name || "-"}
          </Typography.Title>
          {data.disabled ? (
            <Tag color="red">disabled</Tag>
          ) : (
            <Tag color="green">active</Tag>
          )}
        </Space>

        <Divider />

        <div>
          <strong style={{ color: textColor }}>
            {t("description", "描述")}:
          </strong>{" "}
          {data.description || "-"}
        </div>

        <Space size="large">
          <div>
            <strong style={{ color: textColor }}>
              {t("transport", "传输方式")}:
            </strong>{" "}
            {data.transport || "-"}
          </div>
          <div>
            <strong style={{ color: textColor }}>
              {t("command", "启动命令")}:
            </strong>{" "}
            {data.command || "-"}
          </div>
          <div>
            <strong style={{ color: textColor }}>
              {t("category", "分类")}:
            </strong>{" "}
            {data.category || "-"}
          </div>
          <div>
            <strong style={{ color: textColor }}>
              {t("trust_score", "可信度")}:
            </strong>{" "}
            {typeof data.trust_score === "number" ? data.trust_score : "-"}
          </div>
        </Space>

        <div>
          <strong style={{ color: textColor }}>{t("args", "启动参数")}:</strong>{" "}
          {Array.isArray(data.args) ? (
            <Space size={8}>
              {data.args.map((arg: any, idx: number) => (
                <Tag key={`${idx}`}>{String(arg)}</Tag>
              ))}
            </Space>
          ) : data.args ? (
            <Typography.Text>{JSON.stringify(data.args)}</Typography.Text>
          ) : (
            "-"
          )}
        </div>

        <Space size="large">
          <div>
            <strong style={{ color: textColor }}>{t("tenant", "租户")}:</strong>{" "}
            {data.tenant_id || "-"}
          </div>
          <div>
            <strong style={{ color: textColor }}>
              {t("createdBy", "创建者")}:
            </strong>{" "}
            {data.created_by_id ?? "-"}
          </div>
        </Space>

        <Space size="large">
          <div>
            <strong style={{ color: textColor }}>
              {t("createdAt", "创建时间")}:
            </strong>{" "}
            {data.created_at ? new Date(data.created_at).toLocaleString() : "-"}
          </div>
          <div>
            <strong style={{ color: textColor }}>
              {t("updatedAt", "更新时间")}:
            </strong>{" "}
            {data.updated_at ? new Date(data.updated_at).toLocaleString() : "-"}
          </div>
        </Space>
      </Space>
    </Card>
  );
};

export default McpShow;

import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Input,
  Message,
  Select,
  Space,
  Typography,
  Spin,
  Tag,
  Pagination,
  Popover,
} from "@arco-design/web-react";
import { IconSearch, IconThunderbolt } from "@arco-design/web-react/icon";
import { useTranslate, useCreatePath } from "react-admin";
import { useNavigate } from "react-router-dom";
import { IconPlus } from "@arco-design/web-react/icon";
import { listMcps } from "../../data/api/mcp";
import { ListMcpNameSpace } from "../../data/api/mcp/type";

const McpToolsPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const createPath = useCreatePath();
  const [query, setQuery] = useState<string>("");
  const [type, setType] = useState<"self" | "tenant" | "system">("self");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(9);
  const [total, setTotal] = useState<number>(0);
  const [items, setItems] = useState<ListMcpNameSpace.ListMcpResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const activeCount = useMemo(
    () => items.filter((item) => !item.disabled).length,
    [items],
  );
  const scopeLabel = useMemo(() => {
    const labels: Record<typeof type, string> = {
      self: "个人工具",
      tenant: "租户工具",
      system: "系统工具",
    };
    return labels[type];
  }, [type]);

  const fetchTools = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, total } = await listMcps({
        page,
        perPage,
        sortField: "id",
        sortOrder: "DESC",
        filter: { q: query },
        type,
      });
      setItems(data);
      setTotal(total);
    } catch {
      Message.error(t("mcpTools.msg.loadFail", { _: "加载失败" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type, page, perPage]);

  const subtitle = useMemo(() => t("mcpTools.ui.subtitle"), [t]);
  const openCreate = () => navigate("/mcp/create");
  const openDetail = (id?: number) => {
    if (!id) return;
    const to = createPath({ resource: "mcp", type: "show", id });
    navigate(to);
  };

  const filterTypeOptions: Array<{ label: string; value: typeof type }> = [
    { label: "个人工具", value: "self" },
    { label: "租户工具", value: "tenant" },
    { label: "系统工具", value: "system" },
  ];

  const surfaceStyle: React.CSSProperties = {
    border: "1px solid #E5E6EB",
    borderRadius: 8,
    background: "#FFFFFF",
    boxShadow: "0 10px 28px rgba(29, 33, 41, 0.06)",
  };

  return (
    <div style={{ minHeight: "100%", background: "#F7F8FA" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #111827 0%, #1B365D 42%, #0B7A75 100%)",
          color: "#fff",
          padding: "34px 32px",
          borderRadius: 8,
          boxShadow: "0 18px 45px rgba(17, 24, 39, 0.18)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div>
            <Tag color="arcoblue" style={{ marginBottom: 16 }}>
              ENTERPRISE MCP CATALOG
            </Tag>
            <Typography.Title heading={3} style={{ color: "#fff", margin: 0 }}>
              {t("mcpTools.title")}
            </Typography.Title>
            <Typography.Paragraph
              style={{
                color: "rgba(255,255,255,0.82)",
                maxWidth: 720,
                marginTop: 14,
                marginBottom: 0,
                lineHeight: 1.8,
              }}
            >
              {subtitle}
            </Typography.Paragraph>
            <Space wrap size="medium" style={{ marginTop: 20 }}>
              <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
                {t("mcp.ui.create", { _: "新增 MCP" })}
              </Button>
              <Button
                icon={<IconThunderbolt />}
                loading={loading}
                onClick={fetchTools}
                style={{
                  color: "#FFFFFF",
                  borderColor: "rgba(255,255,255,0.42)",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                {t("mcpTools.ui.refresh")}
              </Button>
            </Space>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {[
              [String(total), t("mcpTools.ui.stats.total")],
              [String(activeCount), "当前页可用"],
              [scopeLabel, "目录范围"],
              ["MCP", "企业工具协议"],
            ].map(([value, label]) => (
              <div
                key={`${value}-${label}`}
                style={{
                  minHeight: 96,
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.10)",
                  padding: 16,
                  backdropFilter: "blur(6px)",
                }}
              >
                <Typography.Title
                  heading={5}
                  style={{
                    color: "#FFFFFF",
                    margin: 0,
                    wordBreak: "break-word",
                  }}
                >
                  {value}
                </Typography.Title>
                <Typography.Text style={{ color: "rgba(255,255,255,0.74)" }}>
                  {label}
                </Typography.Text>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 6,
            background:
              "linear-gradient(90deg, #165DFF 0%, #00B42A 33%, #F7BA1E 66%, #722ED1 100%)",
          }}
        />
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 16px" }}>
        <Card style={{ ...surfaceStyle, marginBottom: 18 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Input
              prefix={<IconSearch />}
              allowClear
              placeholder={t("mcpTools.ui.searchPlaceholder", { _: "搜索" })}
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
            />
            <Select
              value={type}
              onChange={(value) => {
                setType(value);
                setPage(1);
              }}
            >
              {filterTypeOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
            <Space wrap>
              <Button onClick={fetchTools} icon={<IconThunderbolt />}>
                {t("mcpTools.ui.refresh")}
              </Button>
              <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
                {t("mcp.ui.create", { _: "新增 MCP" })}
              </Button>
            </Space>
          </div>
        </Card>

        {loading ? (
          <Card style={surfaceStyle}>
            <Spin dot style={{ width: "100%" }} />
          </Card>
        ) : items.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {items.map((item) => (
              <div key={item.id}>
                <Popover
                  trigger="hover"
                  position="top"
                  content={
                    <div style={{ maxWidth: 420 }}>
                      <Space
                        direction="vertical"
                        size={8}
                        style={{ width: "100%" }}
                      >
                        <div>
                          <strong>名称:</strong> {item.name || "-"}
                        </div>
                        <div>
                          <strong>描述:</strong>{" "}
                          {item.description ||
                            t("common.empty", { _: "无描述" })}
                        </div>
                        <Space size={8} wrap>
                          {item.transport ? (
                            <Tag color="blue">{item.transport}</Tag>
                          ) : null}
                          {item.command ? (
                            <Tag color="arcoblue">{item.command}</Tag>
                          ) : null}
                          {item.category ? (
                            <Tag color="purple">{item.category}</Tag>
                          ) : null}
                          {typeof item.trust_score === "number" ? (
                            <Tag color="magenta">
                              {String(item.trust_score)}
                            </Tag>
                          ) : null}
                        </Space>
                        <div>
                          <strong>启动参数:</strong>{" "}
                          {Array.isArray(item.args) ? (
                            <Space size={8} wrap>
                              {(item.args as Array<unknown>).map((arg, idx) => (
                                <Tag key={`${idx}`}>{String(arg)}</Tag>
                              ))}
                            </Space>
                          ) : item.args ? (
                            <Typography.Text>
                              {JSON.stringify(item.args)}
                            </Typography.Text>
                          ) : (
                            "-"
                          )}
                        </div>
                        <Space size={8} wrap>
                          {item.tenant_id ? (
                            <Tag color="arcoblue">{item.tenant_id}</Tag>
                          ) : null}
                          {item.created_at ? (
                            <Tag color="blue">{item.created_at}</Tag>
                          ) : null}
                          {item.updated_at ? (
                            <Tag color="blue">{item.updated_at}</Tag>
                          ) : null}
                        </Space>
                      </Space>
                    </div>
                  }
                >
                  <Card
                    hoverable
                    onClick={() => openDetail(item.id)}
                    style={{
                      ...surfaceStyle,
                      cursor: "pointer",
                      height: "100%",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size="medium"
                      style={{ width: "100%" }}
                    >
                      <Space size={12} align="start" style={{ width: "100%" }}>
                        <Avatar
                          size={36}
                          style={{
                            background:
                              "linear-gradient(135deg, #165DFF 0%, #00B42A 100%)",
                          }}
                        >
                          {(item.name || "").slice(0, 1).toUpperCase()}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Space
                            style={{
                              width: "100%",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography.Text
                              style={{
                                fontWeight: 600,
                                wordBreak: "break-word",
                              }}
                            >
                              {item.name || "-"}
                            </Typography.Text>
                            {item.disabled ? (
                              <Tag color="red">disabled</Tag>
                            ) : (
                              <Tag color="green">active</Tag>
                            )}
                          </Space>
                          <Typography.Text type="secondary">
                            {item.transport || "transport 未配置"}
                          </Typography.Text>
                        </div>
                      </Space>
                      <Typography.Paragraph
                        style={{
                          marginTop: 0,
                          marginBottom: 0,
                          color: "#4E5969",
                        }}
                        ellipsis={{ rows: 3, expandable: false }}
                      >
                        {item.description || t("common.empty", { _: "无描述" })}
                      </Typography.Paragraph>
                      <Space size={8} wrap>
                        {item.tenant_id ? (
                          <Tag color="arcoblue">{item.tenant_id}</Tag>
                        ) : null}
                        {item.category ? (
                          <Tag color="purple">{item.category}</Tag>
                        ) : null}
                        {item.created_at ? (
                          <Tag color="blue">{item.created_at}</Tag>
                        ) : null}
                      </Space>
                    </Space>
                  </Card>
                </Popover>
              </div>
            ))}
          </div>
        ) : (
          <Card style={surfaceStyle}>
            <Typography.Text type="secondary">
              {t("mcpTools.msg.loadFail")}
            </Typography.Text>
          </Card>
        )}
        <Card style={{ ...surfaceStyle, marginTop: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            <Pagination
              current={page}
              total={total}
              pageSize={perPage}
              sizeCanChange
              onChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setPerPage(s);
                setPage(1);
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default McpToolsPage;

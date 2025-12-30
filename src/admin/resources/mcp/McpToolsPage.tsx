import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Grid,
  Input,
  Message,
  Select,
  Space,
  Typography,
  Spin,
  Tag,
  Divider,
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

  return (
    <div style={{ height: "100%" }}>
      <Card
        bordered={false}
        style={{
          background:
            "linear-gradient(90deg, rgb(22,93,255) 0%, rgb(0,200,255) 100%)",
          color: "#fff",
          borderRadius: 0,
        }}
      >
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Typography.Title heading={3} style={{ color: "#fff", margin: 0 }}>
              {t("mcpTools.title")}
            </Typography.Title>
            <Typography.Text style={{ color: "rgba(255,255,255,0.9)" }}>
              {subtitle}
            </Typography.Text>
          </div>
          <Space size={24}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 600 }}>
                {t("mcpTools.ui.stats.total")}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{total}</div>
            </div>
          </Space>
        </Space>
        <Divider style={{ borderColor: "rgba(255,255,255,0.25)" }} />
        <Space align="center" size={12} style={{ width: "100%" }}>
          <Input
            prefix={<IconSearch />}
            allowClear
            placeholder={t("mcpTools.ui.searchPlaceholder", { _: "搜索" })}
            value={query}
            onChange={setQuery}
          />
          <Select value={type} onChange={setType} style={{ width: 160 }}>
            {["self", "tenant", "system"].map((c) => (
              <Select.Option key={c} value={c}>
                {c}
              </Select.Option>
            ))}
          </Select>
          <Button onClick={fetchTools} icon={<IconThunderbolt />}>
            {t("mcpTools.ui.refresh")}
          </Button>
          <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
            {t("mcp.ui.create", { _: "新增 MCP" })}
          </Button>
          <Space style={{ marginLeft: "auto" }}>
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
          </Space>
        </Space>
      </Card>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        {loading ? (
          <Spin dot style={{ width: "100%" }} />
        ) : items.length > 0 ? (
          <Grid.Row gutter={[16, 16]}>
            {items.map((item) => (
              <Grid.Col key={item.id} span={8}>
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
                    style={{ cursor: "pointer" }}
                  >
                    <Space size={12} align="start">
                      <Avatar size={32} style={{ backgroundColor: "#1659FF" }}>
                        {(item.name || "").slice(0, 1).toUpperCase()}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Space
                          style={{
                            width: "100%",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography.Text style={{ fontWeight: 600 }}>
                            {item.name || "-"}
                          </Typography.Text>
                          {item.disabled ? (
                            <Tag color="red">disabled</Tag>
                          ) : (
                            <Tag color="green">active</Tag>
                          )}
                        </Space>
                        <Typography.Paragraph
                          style={{ marginTop: 6, marginBottom: 6 }}
                        >
                          {item.description ||
                            t("common.empty", { _: "无描述" })}
                        </Typography.Paragraph>
                        <Space size={8}>
                          {item.tenant_id ? (
                            <Tag color="arcoblue">{item.tenant_id}</Tag>
                          ) : null}
                          {item.created_at ? (
                            <Tag color="blue">{item.created_at}</Tag>
                          ) : null}
                        </Space>
                      </div>
                    </Space>
                  </Card>
                </Popover>
              </Grid.Col>
            ))}
          </Grid.Row>
        ) : (
          <Card>
            <Typography.Text type="secondary">
              {t("mcpTools.msg.loadFail")}
            </Typography.Text>
          </Card>
        )}
      </div>
    </div>
  );
};

export default McpToolsPage;

import React, { useEffect, useMemo, useState } from "react";
import { useTranslate, useGetIdentity } from "react-admin";
import {
  Card,
  Button,
  Space,
  Table,
  Tag,
  Input,
  Drawer,
} from "@arco-design/web-react";
import { Tooltip, Typography, Divider } from "@arco-design/web-react";
import { listDocuments } from "../../../data/api/rag";
import type { ListRagDocsNameSpace } from "../../../data/api/rag/type";
import { listMcps } from "../../../data/api/mcp";
import type { ListMcpNameSpace } from "../../../data/api/mcp/type";
import {
  listAgentChatHistory,
  listAgentChatSessions,
  chatAgentStream,
} from "../../../data/api/agent";
import { listModels, getModel } from "../../../data/api/model";
import type { ListModelsNameSpace } from "../../../data/api/model/type";

type Props = {
  active: "base" | "rag" | "mcp" | "model";
  selectedDocIds: string[];
  onToggleSelectDoc: (id?: string) => void;
  selectedMcpIds: number[];
  onToggleSelectMcp: (id?: number) => void;
  agentId?: string;
  modelSource?: "system" | "openai" | "custom";
  selectedModelId?: number | null;
  onToggleSelectModel?: (id?: number) => void;
};

const Observation: React.FC<Props> = ({
  active,
  selectedDocIds,
  onToggleSelectDoc,
  selectedMcpIds,
  onToggleSelectMcp,
  agentId,
  modelSource,
  selectedModelId,
  onToggleSelectModel,
}) => {
  const t = useTranslate();
  const { identity } = useGetIdentity();
  const [docs, setDocs] = useState<ListRagDocsNameSpace.ListRagDocsResult[]>(
    [],
  );
  const [ragLoading, setRagLoading] = useState<boolean>(false);
  const [titleQuery, setTitleQuery] = useState<string>("");
  const [scope, setScope] = useState<"self" | "tenant" | "system">("tenant");
  const [mcpItems, setMcpItems] = useState<ListMcpNameSpace.ListMcpResult[]>(
    [],
  );
  const [mcpLoading, setMcpLoading] = useState<boolean>(false);
  const [mcpQuery, setMcpQuery] = useState<string>("");
  const [mcpScope, setMcpScope] = useState<"self" | "tenant" | "system">(
    "self",
  );
  const [modelItems, setModelItems] = useState<
    ListModelsNameSpace.ListModelsResult[]
  >([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const [selectedModelName, setSelectedModelName] = useState<string>("");

  const isDefaultTenant =
    (localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default") ===
    "default";

  useEffect(() => {
    if (isDefaultTenant && scope === "tenant") setScope("self");
  }, [isDefaultTenant, scope]);

  useEffect(() => {
    const run = async () => {
      setRagLoading(true);
      try {
        const resp = await listDocuments({
          page: 1,
          perPage: 10,
          sortField: "id",
          sortOrder: "DESC",
          filter: { disabled: false, status: "success", title: "" },
          type: scope,
        });
        setDocs(resp.data || []);
      } catch {
        void 0;
      } finally {
        setRagLoading(false);
      }
    };
    void run();
  }, [scope]);

  useEffect(() => {
    const run = async () => {
      setMcpLoading(true);
      try {
        const { data } = await listMcps({
          page: 1,
          perPage: 10,
          sortField: "id",
          sortOrder: "DESC",
          filter: { q: mcpQuery },
          type: mcpScope,
        });
        setMcpItems(data || []);
      } catch {
        void 0;
      } finally {
        setMcpLoading(false);
      }
    };
    void run();
  }, [mcpScope, mcpQuery]);

  useEffect(() => {
    const run = async () => {
      if (modelSource !== "system") return;
      setModelLoading(true);
      try {
        const resp = await listModels({
          page: 1,
          perPage: 20,
          sortField: "id",
          sortOrder: "DESC",
          filter: { q: modelQuery },
          type: "system",
        });
        setModelItems(resp?.data || []);
      } catch {
        void 0;
      } finally {
        setModelLoading(false);
      }
    };
    void run();
  }, [modelSource, modelQuery]);

  useEffect(() => {
    if (modelSource !== "system") {
      setSelectedModelName("");
      return;
    }
    const id = Number(selectedModelId ?? 0);
    if (!id) {
      setSelectedModelName("");
      return;
    }
    const found = modelItems.find((m) => Number(m.id || 0) === id);
    if (found?.name) {
      setSelectedModelName(String(found.name));
      return;
    }
    const run = async () => {
      try {
        const row = await getModel(id);
        const name = String(row?.name ?? "");
        setSelectedModelName(name);
      } catch {
        setSelectedModelName("");
      }
    };
    void run();
  }, [modelSource, selectedModelId, modelItems]);

  const fetchRagDocs = async () => {
    setRagLoading(true);
    try {
      const resp = await listDocuments({
        page: 1,
        perPage: 10,
        sortField: "id",
        sortOrder: "DESC",
        filter: { disabled: false, status: "success", title: titleQuery },
        type: scope,
      });
      setDocs(resp.data || []);
    } catch {
      void 0;
    } finally {
      setRagLoading(false);
    }
  };

  const toggleSelectDoc = (id?: string) => {
    onToggleSelectDoc(id);
  };

  const selectedDocsText = useMemo(() => {
    if (!selectedDocIds.length)
      return t("rag.ui.selected.none", { _: "未选择" });
    return `${selectedDocIds.length}`;
  }, [selectedDocIds, t]);

  const toggleSelectMcp = (id?: number) => {
    onToggleSelectMcp(id);
  };

  const selectedMcpText = useMemo(() => {
    if (!selectedMcpIds.length)
      return t("rag.ui.selected.none", { _: "未选择" });
    return `${selectedMcpIds.length}`;
  }, [selectedMcpIds, t]);

  type RagColumn = {
    title: React.ReactNode;
    dataIndex: string;
    width?: number;
    render?: (
      value: unknown,
      record: ListRagDocsNameSpace.ListRagDocsResult,
    ) => React.ReactNode;
  };

  const ragColumns: RagColumn[] = [
    {
      title: t("rag.ui.columns.id", { _: "ID" }),
      dataIndex: "id",
      width: 120,
    },
    {
      title: t("rag.ui.columns.name", { _: "名称" }),
      dataIndex: "title",
      width: 280,
      render: (v: unknown) => {
        const text = typeof v === "string" ? v : String(v ?? "");
        return (
          <Tooltip content={text}>
            <Typography.Paragraph
              style={{ marginBottom: 0 }}
              ellipsis={{ rows: 1 }}
            >
              {text}
            </Typography.Paragraph>
          </Tooltip>
        );
      },
    },
    {
      title: t("rag.ui.columns.operations", { _: "操作" }),
      dataIndex: "operations",
      width: 140,
      render: (_: unknown, record: ListRagDocsNameSpace.ListRagDocsResult) => {
        const id = String(record.id || "");
        const selected = selectedDocIds.includes(id);
        return (
          <Space>
            <Button
              type={selected ? "outline" : "primary"}
              onClick={() => toggleSelectDoc(id)}
            >
              {selected
                ? t("rag.ui.columns.unselect", { _: "取消选择" })
                : t("rag.ui.columns.select", { _: "选择" })}
            </Button>
          </Space>
        );
      },
    },
  ];

  type McpColumn = {
    title: React.ReactNode;
    dataIndex: string;
    width?: number;
    render?: (
      value: unknown,
      record: ListMcpNameSpace.ListMcpResult,
    ) => React.ReactNode;
  };

  const mcpColumns: McpColumn[] = [
    {
      title: t("rag.ui.columns.id", { _: "ID" }),
      dataIndex: "id",
      width: 120,
    },
    {
      title: t("rag.ui.columns.name", { _: "名称" }),
      dataIndex: "name",
      width: 240,
      render: (v: unknown) => {
        const text = typeof v === "string" ? v : String(v ?? "");
        return (
          <Tooltip content={text}>
            <Typography.Paragraph
              style={{ marginBottom: 0 }}
              ellipsis={{ rows: 1 }}
            >
              {text}
            </Typography.Paragraph>
          </Tooltip>
        );
      },
    },
    {
      title: t("rag.ui.columns.description", { _: "描述" }),
      dataIndex: "description",
      width: 240,
      render: (v: unknown) => {
        const text = typeof v === "string" ? v : "";
        return (
          <Tooltip content={text || t("common.empty", { _: "无" })}>
            <Typography.Paragraph
              style={{ marginBottom: 0 }}
              ellipsis={{ rows: 2 }}
            >
              {text || t("common.empty", { _: "无" })}
            </Typography.Paragraph>
          </Tooltip>
        );
      },
    },
    {
      title: t("rag.ui.columns.operations", { _: "操作" }),
      dataIndex: "operations",
      width: 160,
      render: (_: unknown, record: ListMcpNameSpace.ListMcpResult) => {
        const id = Number(record.id || 0);
        const selected = selectedMcpIds.includes(id);
        return (
          <Space>
            <Button
              type={selected ? "outline" : "primary"}
              onClick={() => toggleSelectMcp(id)}
            >
              {selected
                ? t("rag.ui.columns.unselect", { _: "取消选择" })
                : t("rag.ui.columns.select", { _: "选择" })}
            </Button>
          </Space>
        );
      },
    },
  ];

  const ragPreview = (
    <Card
      style={{
        boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Button.Group>
            <Button
              type={scope === "self" ? "primary" : "outline"}
              onClick={() => setScope("self")}
            >
              {t("rag.ui.tabs.self", { _: "个人" })}
            </Button>
            {!isDefaultTenant && (
              <Button
                type={scope === "tenant" ? "primary" : "outline"}
                onClick={() => setScope("tenant")}
              >
                {t("rag.ui.tabs.tenant", { _: "租户" })}
              </Button>
            )}
            <Button
              type={scope === "system" ? "primary" : "outline"}
              onClick={() => setScope("system")}
            >
              {t("rag.ui.tabs.system", { _: "系统" })}
            </Button>
          </Button.Group>
          <Tag color="arcoblue">
            {t("rag.ui.selected.count", { _: "已选择" })}: {selectedDocsText}
          </Tag>
        </Space>
        <Space>
          <Input
            allowClear
            style={{ width: 240 }}
            placeholder={t("rag.ui.searchPlaceholder", { _: "按名称搜索" })}
            value={titleQuery}
            onChange={setTitleQuery}
            onPressEnter={fetchRagDocs}
          />
          <Button type="primary" onClick={fetchRagDocs} loading={ragLoading}>
            {t("rag.ui.search", { _: "搜索" })}
          </Button>
        </Space>
      </div>
      <Divider style={{ margin: "8px 0" }} />
      <Table
        loading={ragLoading}
        columns={ragColumns}
        data={docs}
        rowKey="id"
        pagination={false}
      />
    </Card>
  );

  const mcpPreview = (
    <Card
      style={{
        boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Button.Group>
            <Button
              type={mcpScope === "self" ? "primary" : "outline"}
              onClick={() => setMcpScope("self")}
            >
              {t("rag.ui.tabs.self", { _: "个人" })}
            </Button>
            {!isDefaultTenant && (
              <Button
                type={mcpScope === "tenant" ? "primary" : "outline"}
                onClick={() => setMcpScope("tenant")}
              >
                {t("rag.ui.tabs.tenant", { _: "租户" })}
              </Button>
            )}
            <Button
              type={mcpScope === "system" ? "primary" : "outline"}
              onClick={() => setMcpScope("system")}
            >
              {t("rag.ui.tabs.system", { _: "系统" })}
            </Button>
          </Button.Group>
          <Tag color="arcoblue">
            {t("rag.ui.selected.count", { _: "已选择" })}: {selectedMcpText}
          </Tag>
        </Space>
        <Space>
          <Input
            allowClear
            style={{ width: 240 }}
            placeholder={t("mcpTools.ui.searchPlaceholder", { _: "搜索" })}
            value={mcpQuery}
            onChange={setMcpQuery}
          />
        </Space>
      </div>
      <Divider style={{ margin: "8px 0" }} />
      <Table
        loading={mcpLoading}
        columns={mcpColumns}
        data={mcpItems}
        rowKey="id"
        pagination={false}
      />
    </Card>
  );

  type ModelColumn = {
    title: React.ReactNode;
    dataIndex: string;
    width?: number;
    render?: (
      value: unknown,
      record: ListModelsNameSpace.ListModelsResult,
    ) => React.ReactNode;
  };

  const modelColumns: ModelColumn[] = [
    {
      title: t("rag.ui.columns.name", { _: "名称" }),
      dataIndex: "name",
      width: 240,
      render: (v: unknown) => (
        <span style={{ fontWeight: 500 }}>
          {typeof v === "string" ? v : String(v ?? "")}
        </span>
      ),
    },
    {
      title: t("agent.ui.manufacturer", { _: "厂商" }),
      dataIndex: "manufacturer",
      width: 120,
      render: (v: unknown) =>
        typeof v === "string" && v ? v : t("common.empty", { _: "无" }),
    },
    {
      title: t("agent.ui.tags", { _: "标签" }),
      dataIndex: "tags",
      width: 140,
      render: (v: unknown) => {
        const arr = Array.isArray(v)
          ? (v as unknown[]).map((x) => String(x ?? ""))
          : [];
        const items = arr.filter(Boolean);
        if (!items.length) return t("common.empty", { _: "无" });
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {items.map((text, idx) => (
              <Tag key={`${text}-${idx}`} size="small">
                {text}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: t("agent.ui.price", { _: "价格" }),
      dataIndex: "price",
      width: 260,
      render: (v: unknown) => {
        const s = typeof v === "string" ? v : String(v ?? "");
        const text = s.replace(/<br\s*\/?>/gi, "\n");
        return (
          <span style={{ whiteSpace: "pre-wrap" }}>
            {text || t("common.empty", { _: "无" })}
          </span>
        );
      },
    },
    {
      title: t("rag.ui.columns.description", { _: "描述" }),
      dataIndex: "description",
      width: 240,
      render: (v: unknown) =>
        typeof v === "string" && v ? v : t("common.empty", { _: "无" }),
    },
    {
      title: t("model.ui.columns.operations", { _: "操作" }),
      dataIndex: "operations",
      width: 160,
      render: (_: unknown, record: ListModelsNameSpace.ListModelsResult) => {
        const id = Number(record.id || 0);
        const selected = Number(selectedModelId ?? 0) === id;
        return (
          <Space>
            <Button
              type={selected ? "outline" : "primary"}
              onClick={() => onToggleSelectModel?.(id)}
            >
              {selected
                ? t("rag.ui.columns.unselect", { _: "取消选择" })
                : t("rag.ui.columns.select", { _: "选择" })}
            </Button>
          </Space>
        );
      },
    },
  ];

  const modelPreview = (
    <Card
      style={{
        boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Tag color="arcoblue">
            {t("rag.ui.selected.count", { _: "已选择" })}:{" "}
            {selectedModelName ? selectedModelName : selectedModelId ? 1 : 0}
          </Tag>
        </Space>
        <Space>
          <Input
            allowClear
            style={{ width: 240 }}
            placeholder={t("model.ui.searchPlaceholder", { _: "搜索模型" })}
            value={modelQuery}
            onChange={setModelQuery}
          />
        </Space>
      </div>
      <Divider style={{ margin: "8px 0" }} />
      <Table
        loading={modelLoading}
        columns={modelColumns}
        data={modelItems}
        rowKey="id"
        pagination={false}
      />
    </Card>
  );

  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant" | "system"; content: string }>
  >([]);
  const [input, setInput] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<
    Array<{
      id?: number;
      record_id?: number;
      name?: string | null;
      summary?: string | null;
      content?: string | null;
    }>
  >([]);
  const [recordId, setRecordId] = useState<number | null>(null);

  const sendMessage = async () => {
    if (!input || !agentId) return;
    const agentNum = Number(agentId);
    if (Number.isNaN(agentNum)) return;
    setSending(true);
    const controller = new AbortController();
    try {
      const meta: Record<string, unknown> = {
        uid: identity?.id,
        ts: Date.now(),
      };
      const type = recordId ? 1 : 0;
      const payload = {
        agent_id: agentNum,
        type,
        record_id: recordId ?? undefined,
        meta,
        message: input,
      };
      setMessages((prev) => [...prev, { role: "user", content: input }]);
      setInput("");
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      for await (const chunk of chatAgentStream(payload, {
        signal: controller.signal,
      })) {
        if (typeof chunk?.record_id === "number" && !recordId) {
          setRecordId(chunk.record_id);
        }
        if (chunk?.done) {
          break;
        }
        const delta = String(chunk?.delta ?? chunk?.text ?? "");
        if (delta) {
          setMessages((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].role === "assistant") {
                next[i] = {
                  ...next[i],
                  content: (next[i].content || "") + delta,
                };
                break;
              }
            }
            return next;
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
      void 0;
    }
  };

  const openHistory = async () => {
    if (!agentId) {
      setHistoryOpen(true);
      return;
    }
    setHistoryLoading(true);
    try {
      const resp = await listAgentChatHistory({
        agent_id: Number(agentId),
        page: 1,
        per_page: 20,
      });
      setHistoryData(resp?.data || []);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
      setHistoryOpen(true);
    }
  };

  const loadSessions = async (rid: number) => {
    try {
      const resp = await listAgentChatSessions({
        agent_id: Number(agentId),
        record_id: rid,
        page: 1,
        per_page: 100,
      });
      const rows = resp?.data || [];
      const mapped = rows.map((it) => {
        const role =
          it.role === "user" || it.role === "assistant" || it.role === "system"
            ? it.role
            : "assistant";
        const content = String(it.content ?? it.message ?? it.output ?? "");
        return { role, content };
      });
      setMessages(mapped);
    } catch {
      setMessages([]);
    }
  };

  const chatPreview = (
    <Card style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Space>
          <Button type="primary" onClick={() => setMessages([])}>
            {t("chat.ui.new", { _: "新对话" })}
          </Button>
          <Button onClick={openHistory}>
            {t("chat.ui.history", { _: "历史纪录" })}
          </Button>
        </Space>
      </div>
      <Divider style={{ margin: "8px 0" }} />
      <div style={{ display: "flex", flexDirection: "column", rowGap: 12 }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                borderRadius: 16,
                padding: "8px 12px",
                fontSize: 14,
                lineHeight: 1.6,
                backgroundColor:
                  m.role === "user" ? "rgb(22,93,255)" : "#f6f7fb",
                color: m.role === "user" ? "#fff" : "#1f2937",
                maxWidth: "80%",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <Input.TextArea
            rows={3}
            value={input}
            onChange={setInput}
            placeholder={t("chat.ui.placeholder", { _: "输入消息并发送" })}
          />
          <Button type="primary" loading={sending} onClick={sendMessage}>
            {t("chat.ui.send", { _: "发送" })}
          </Button>
        </div>
      </div>
      <Drawer
        title={t("chat.ui.history", { _: "历史纪录" })}
        visible={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        width={520}
      >
        <Table
          loading={historyLoading}
          columns={[
            { title: "ID", dataIndex: "id", width: 80 },
            {
              title: t("chat.ui.columns.name", { _: "名称" }),
              dataIndex: "name",
              width: 160,
            },
            {
              title: t("chat.ui.columns.summary", { _: "摘要" }),
              dataIndex: "summary",
              width: 220,
            },
            {
              title: t("rag.ui.columns.operations", { _: "操作" }),
              dataIndex: "operations",
              width: 120,
              render: (
                _: unknown,
                record: { id?: number; record_id?: number },
              ) => (
                <Button
                  type="primary"
                  onClick={() => {
                    const rid = Number(record?.id ?? record?.record_id ?? 0);
                    if (!rid) return;
                    setRecordId(rid);
                    void loadSessions(rid);
                    setHistoryOpen(false);
                  }}
                >
                  {t("chat.ui.use", { _: "继续对话" })}
                </Button>
              ),
            },
          ]}
          data={historyData}
          rowKey={(r) => String(r?.id ?? r?.record_id ?? Math.random())}
          pagination={false}
        />
      </Drawer>
    </Card>
  );

  return (
    <div style={{ flex: 1 }}>
      {active === "base" && chatPreview}
      {active === "rag" && ragPreview}
      {active === "mcp" && mcpPreview}
      {active === "model" && modelSource === "system" && modelPreview}
    </div>
  );
};

export default Observation;

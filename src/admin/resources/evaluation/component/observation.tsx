import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslate, useGetIdentity } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  Table,
  Tag,
  Input,
  Drawer,
  Modal,
  Popover,
  Select,
  Message,
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
import { getStrategyOption } from "../../rag/rag/strategyOptions";

type Props = {
  active: "base" | "rag" | "mcp" | "model";
  selectedDocs: Record<string, number[] | undefined>;
  setSelectedDocs: React.Dispatch<
    React.SetStateAction<Record<string, number[] | undefined>>
  >;
  selectedMcpIds: number[];
  onToggleSelectMcp: (id?: number) => void;
  agentId?: string;
  modelSource?: "system" | "openai" | "custom";
  selectedModelId?: number | null;
  onToggleSelectModel?: (id?: number) => void;
};

const Observation: React.FC<Props> = ({
  active,
  selectedDocs,
  setSelectedDocs,
  selectedMcpIds,
  onToggleSelectMcp,
  agentId,
  modelSource,
  selectedModelId,
  onToggleSelectModel,
}) => {
  const t = useTranslate();
  const navigate = useNavigate();
  const { identity } = useGetIdentity();
  const [docs, setDocs] = useState<ListRagDocsNameSpace.ListRagDocsResult[]>(
    [],
  );
  const [ragLoading, setRagLoading] = useState<boolean>(false);
  const [titleQuery, setTitleQuery] = useState<string>("");
  const [scope, setScope] = useState<"self" | "tenant" | "system">("tenant");
  const [pickStrategyVisible, setPickStrategyVisible] = useState(false);
  const [pickStrategyDoc, setPickStrategyDoc] =
    useState<ListRagDocsNameSpace.ListRagDocsResult | null>(null);
  const [pickStrategyValues, setPickStrategyValues] = useState<string[]>([]);
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

  const fetchRagDocs = useCallback(
    async (opts?: {
      silent?: boolean;
      scope?: "self" | "tenant" | "system";
      title?: string;
    }) => {
      setRagLoading(true);
      try {
        const targetScope = opts?.scope ?? scope;
        const targetTitle = opts?.title ?? titleQuery;
        const resp = await listDocuments({
          page: 1,
          perPage: 10,
          sortField: "id",
          sortOrder: "DESC",
          filter: { disabled: false, status: "success", title: targetTitle },
          type: targetScope,
        });
        setDocs(resp.data || []);
      } catch {
        if (!opts?.silent)
          Message.error(t("rag.msg.loadFail", { _: "加载失败" }));
      } finally {
        setRagLoading(false);
      }
    },
    [scope, t, titleQuery],
  );

  const openStrategyDetail = (strategyId: string | number) => {
    navigate(`/rag/strategy/${encodeURIComponent(String(strategyId))}`);
  };

  useEffect(() => {
    void fetchRagDocs({ silent: true });
  }, [fetchRagDocs]);

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

  const selectedDocIds = useMemo(
    () => Object.keys(selectedDocs),
    [selectedDocs],
  );

  const unselectDoc = (id: string) => {
    setSelectedDocs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const openPickStrategy = (rec: ListRagDocsNameSpace.ListRagDocsResult) => {
    const id = String(rec.id || "");
    if (!id) return;
    const available = Array.isArray(rec.strategy) ? rec.strategy : [];
    const normalized = Array.from(
      new Set(available.map((x) => String(x)).filter(Boolean)),
    );
    if (normalized.length === 0) {
      Message.warning(t("rag.ui.strategyEmpty", { _: "该文档暂无可选策略" }));
      return;
    }
    setPickStrategyDoc(rec);
    setPickStrategyValues(normalized);
    setPickStrategyVisible(true);
  };

  const confirmPickStrategy = () => {
    const rec = pickStrategyDoc;
    const id = String(rec?.id || "");
    if (!id) return;
    const available = Array.isArray(rec?.strategy) ? rec?.strategy : [];
    if (available.length > 0 && pickStrategyValues.length === 0) {
      Message.warning(
        t("rag.ui.selectStrategyTip", { _: "请选择至少一种策略" }),
      );
      return;
    }
    const nums = pickStrategyValues
      .map((v) => Number(v))
      .filter((n) => !Number.isNaN(n));
    setSelectedDocs((prev) => ({
      ...prev,
      [id]: nums.length ? nums : undefined,
    }));
    setPickStrategyVisible(false);
    setPickStrategyDoc(null);
    setPickStrategyValues([]);
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
      title: t("rag.ui.columns.name", { _: "名称" }),
      dataIndex: "title",
      width: 240,
      render: (v: unknown) => (
        <span style={{ fontWeight: 500 }}>
          {typeof v === "string" ? v : String(v ?? "")}
        </span>
      ),
    },
    {
      title: t("rag.ui.columns.strategyCount", { _: "策略种类" }),
      dataIndex: "strategy",
      width: 140,
      render: (_v: unknown, record: ListRagDocsNameSpace.ListRagDocsResult) => {
        const ids = Array.isArray(record.strategy) ? record.strategy : [];
        const normalized = Array.from(
          new Set(ids.map((x) => String(x)).filter(Boolean)),
        );
        const count = normalized.length;
        if (count === 0) return 0;
        return (
          <Popover
            trigger="hover"
            position="top"
            content={
              <div style={{ maxWidth: 360 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  {t("rag.ui.columns.strategy", { _: "切割策略" })}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {normalized.map((id) => {
                    const opt = getStrategyOption(id);
                    const label = opt?.label || `策略 ${id}`;
                    return (
                      <Tag
                        key={id}
                        size="small"
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openStrategyDetail(id);
                        }}
                      >
                        {label}
                      </Tag>
                    );
                  })}
                </div>
              </div>
            }
          >
            <span style={{ cursor: "pointer" }}>{count}</span>
          </Popover>
        );
      },
    },
    {
      title: t("rag.ui.columns.selectedStrategyCount", { _: "已选策略" }),
      dataIndex: "selectedStrategy",
      width: 140,
      render: (_v: unknown, record: ListRagDocsNameSpace.ListRagDocsResult) => {
        const id = String(record.id || "");
        if (!id || !(id in selectedDocs)) return "-";
        const ids = Array.isArray(selectedDocs[id]) ? selectedDocs[id] : [];
        const normalized = Array.from(
          new Set(ids.map((x) => String(x)).filter(Boolean)),
        );
        const count = normalized.length;
        if (count === 0) return 0;
        return (
          <Popover
            trigger="hover"
            position="top"
            content={
              <div style={{ maxWidth: 360 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  {t("rag.ui.columns.selectedStrategy", { _: "已选切割策略" })}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {normalized.map((sid) => {
                    const opt = getStrategyOption(sid);
                    const label = opt?.label || `策略 ${sid}`;
                    return (
                      <Tag
                        key={sid}
                        size="small"
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openStrategyDetail(sid);
                        }}
                      >
                        {label}
                      </Tag>
                    );
                  })}
                </div>
              </div>
            }
          >
            <span style={{ cursor: "pointer" }}>{count}</span>
          </Popover>
        );
      },
    },
    {
      title: t("rag.ui.columns.operations", { _: "操作" }),
      dataIndex: "operations",
      width: 140,
      render: (_: unknown, record: ListRagDocsNameSpace.ListRagDocsResult) => {
        const id = String(record.id || "");
        const selected = id ? id in selectedDocs : false;
        const available = Array.isArray(record.strategy) ? record.strategy : [];
        const normalized = Array.from(
          new Set(available.map((x) => String(x)).filter(Boolean)),
        );
        const canPick = normalized.length > 0;
        return (
          <Space>
            <Button
              type={selected ? "outline" : "primary"}
              onClick={() => {
                if (!id) return;
                if (selected) unselectDoc(id);
                else openPickStrategy(record);
              }}
              disabled={!selected && !canPick}
            >
              {selected
                ? t("rag.ui.columns.unselect", { _: "取消选择" })
                : !canPick
                  ? t("rag.ui.columns.unselectable", { _: "不可选择" })
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
              onClick={() => {
                setScope("self");
                void fetchRagDocs({ silent: true, scope: "self" });
              }}
            >
              {t("rag.ui.tabs.self", { _: "个人" })}
            </Button>
            {!isDefaultTenant && (
              <Button
                type={scope === "tenant" ? "primary" : "outline"}
                onClick={() => {
                  setScope("tenant");
                  void fetchRagDocs({ silent: true, scope: "tenant" });
                }}
              >
                {t("rag.ui.tabs.tenant", { _: "租户" })}
              </Button>
            )}
            <Button
              type={scope === "system" ? "primary" : "outline"}
              onClick={() => {
                setScope("system");
                void fetchRagDocs({ silent: true, scope: "system" });
              }}
            >
              {t("rag.ui.tabs.system", { _: "系统" })}
            </Button>
          </Button.Group>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {t("rag.ui.selected.count", { _: "已选择" })}: {selectedDocsText}
          </span>
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
      <Modal
        title={t("rag.ui.strategySelect", { _: "选择切割策略" })}
        visible={pickStrategyVisible}
        onCancel={() => {
          setPickStrategyVisible(false);
          setPickStrategyDoc(null);
          setPickStrategyValues([]);
        }}
        onOk={confirmPickStrategy}
      >
        <div style={{ display: "grid", rowGap: 12 }}>
          <div style={{ color: "var(--color-text-2)" }}>
            {t("rag.ui.strategySelectTip", {
              _: "请选择该文档绑定到智能体时使用的切割策略（可多选）",
            })}
          </div>
          <Select
            mode="multiple"
            allowClear
            style={{ width: "100%" }}
            value={pickStrategyValues}
            onChange={(vals) => {
              const next = (vals as unknown[]).map((v) => String(v));
              setPickStrategyValues(next);
            }}
          >
            {(pickStrategyDoc && Array.isArray(pickStrategyDoc.strategy)
              ? pickStrategyDoc.strategy
              : []
            ).map((sid) => {
              const key = String(sid);
              const opt = getStrategyOption(key);
              return (
                <Select.Option key={key} value={key}>
                  {opt?.label || `策略 ${key}`}
                </Select.Option>
              );
            })}
          </Select>
        </div>
      </Modal>
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
      meta?: Record<string, unknown> | null;
    }>
  >([]);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [recordMeta, setRecordMeta] = useState<Record<string, unknown> | null>(
    null,
  );

  const sendMessage = async () => {
    if (!input || !agentId) return;
    const agentNum = Number(agentId);
    if (Number.isNaN(agentNum)) return;
    setSending(true);
    const controller = new AbortController();
    try {
      const meta: Record<string, unknown> =
        recordMeta ?? ({ uid: identity?.id, ts: Date.now() } as const);
      if (!recordMeta) setRecordMeta(meta);
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

  const loadSessions = async (
    rid: number,
    meta?: Record<string, unknown> | null,
  ) => {
    try {
      const resp = await listAgentChatSessions({
        agent_id: Number(agentId),
        meta: meta ?? recordMeta ?? undefined,
        record_id: rid,
        page: 1,
        per_page: 100,
      });
      const rows = resp?.data || [];
      const pickText = (v: unknown): string | undefined => {
        if (typeof v === "string") return v;
        if (!v || typeof v !== "object") return undefined;
        const vv = v as Record<string, unknown>;
        const text = vv.text ?? vv.content ?? vv.message ?? vv.value;
        return typeof text === "string" ? text : undefined;
      };
      const mapped: Array<{
        role: "user" | "assistant" | "system";
        content: string;
      }> = [];
      const getCount = (v: unknown): number => {
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string") {
          const n = Number(v);
          if (Number.isFinite(n)) return n;
        }
        return Number.MAX_SAFE_INTEGER;
      };
      const orderedRows = [...rows].sort(
        (a, b) => getCount(a?.count) - getCount(b?.count),
      );
      for (const it of orderedRows) {
        const input = pickText((it as { input?: unknown }).input);
        const output = pickText((it as { output?: unknown }).output);
        if (input && input.trim())
          mapped.push({ role: "user", content: input });
        if (output && output.trim())
          mapped.push({ role: "assistant", content: output });
        if ((!input || !input.trim()) && (!output || !output.trim())) {
          const role =
            it.role === "user" ||
            it.role === "assistant" ||
            it.role === "system"
              ? it.role
              : "assistant";
          const content = String(
            pickText((it as { content?: unknown }).content) ??
              pickText((it as { message?: unknown }).message) ??
              pickText((it as { zip?: unknown }).zip) ??
              "",
          );
          if (content) mapped.push({ role, content });
        }
      }
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
                record: {
                  id?: number;
                  record_id?: number;
                  meta?: Record<string, unknown> | null;
                },
              ) => (
                <Button
                  type="primary"
                  onClick={() => {
                    const rid = Number(record?.id ?? record?.record_id ?? 0);
                    if (!rid) return;
                    setRecordId(rid);
                    setRecordMeta(record?.meta ?? null);
                    void loadSessions(rid, record?.meta ?? null);
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

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Title, useTranslate, usePermissions } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Input,
  Message,
  Space,
  Table,
  Tag,
  Form,
  Radio,
  Select,
  Modal,
  Popover,
} from "@arco-design/web-react";
import { useDarkMode } from "../../data/hook/useDark";
import { listDocuments } from "../../data/api/rag";
import type { ListRagDocsNameSpace } from "../../data/api/rag/type";
import { createAgent } from "../../data/api/agent";
import { listMcps } from "../../data/api/mcp";
import type { ListMcpNameSpace } from "../../data/api/mcp/type";
import { listModels } from "../../data/api/model";
import type { ListModelsNameSpace } from "../../data/api/model/type";
import { getStrategyOption } from "../rag/rag/strategyOptions";

const CreateAgent: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const { cardColorStyle } = useDarkMode();
  const { permissions } = usePermissions();
  const [active, setActive] = useState<"base" | "rag" | "mcp" | "model">(
    "base",
  );
  const [form] = Form.useForm();
  const promptFileRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [docs, setDocs] = useState<ListRagDocsNameSpace.ListRagDocsResult[]>(
    [],
  );
  const [ragLoading, setRagLoading] = useState<boolean>(false);
  const [selectedDocs, setSelectedDocs] = useState<
    Record<string, number[] | undefined>
  >({});
  const [titleQuery, setTitleQuery] = useState<string>("");
  const [scope, setScope] = useState<"self" | "tenant" | "system">("tenant");
  const [ragPage, setRagPage] = useState<number>(1);
  const [ragPerPage, setRagPerPage] = useState<number>(10);
  const [ragTotal, setRagTotal] = useState<number>(0);
  const [pickStrategyVisible, setPickStrategyVisible] =
    useState<boolean>(false);
  const [pickStrategyDoc, setPickStrategyDoc] =
    useState<ListRagDocsNameSpace.ListRagDocsResult | null>(null);
  const [pickStrategyValues, setPickStrategyValues] = useState<string[]>([]);
  const [mcpItems, setMcpItems] = useState<ListMcpNameSpace.ListMcpResult[]>(
    [],
  );
  const [mcpLoading, setMcpLoading] = useState<boolean>(false);
  const [selectedMcpIds, setSelectedMcpIds] = useState<number[]>([]);
  const [mcpQuery, setMcpQuery] = useState<string>("");
  const [mcpScope, setMcpScope] = useState<"self" | "tenant" | "system">(
    "self",
  );
  const [mcpPage, setMcpPage] = useState<number>(1);
  const [mcpPerPage, setMcpPerPage] = useState<number>(10);
  const [mcpTotal, setMcpTotal] = useState<number>(0);
  const [modelItems, setModelItems] = useState<
    ListModelsNameSpace.ListModelsResult[]
  >([]);
  const [modelLoading, setModelLoading] = useState<boolean>(false);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [modelSource, setModelSource] = useState<
    "system" | "openai" | "custom"
  >("system");
  const [modelQuery, setModelQuery] = useState<string>("");
  const [modelPage, setModelPage] = useState<number>(1);
  const [modelPerPage, setModelPerPage] = useState<number>(10);
  const [modelTotal, setModelTotal] = useState<number>(0);

  const tenantId =
    localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default";
  const isDefaultTenant = tenantId === "default";
  const isSuperAdmin =
    permissions === "admin" &&
    (tenantId === "system" || tenantId === "default");

  useEffect(() => {
    if ((isDefaultTenant || isSuperAdmin) && scope === "tenant")
      setScope("self");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRagDocs({ silent: true });
      void fetchMcps({ silent: true });
      if (modelSource === "system")
        void fetchModels(1, modelPerPage, { silent: true });
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const fetchRagDocs = async (opts?: {
    silent?: boolean;
    scope?: "self" | "tenant" | "system";
    title?: string;
    page?: number;
    perPage?: number;
  }) => {
    setRagLoading(true);
    try {
      const targetScope = opts?.scope ?? scope;
      const targetTitle = opts?.title ?? titleQuery;
      const targetPage = opts?.page ?? ragPage;
      const targetPerPage = opts?.perPage ?? ragPerPage;
      const resp = await listDocuments({
        page: targetPage,
        perPage: targetPerPage,
        sortField: "id",
        sortOrder: "DESC",
        filter: { disabled: false, status: "success", title: targetTitle },
        type: targetScope,
      });
      setDocs(resp.data || []);
      setRagTotal(resp.total || 0);
    } catch {
      if (!opts?.silent)
        Message.error(t("rag.msg.loadFail", { _: "加载失败" }));
    } finally {
      setRagLoading(false);
    }
  };

  const fetchMcps = async (opts?: {
    silent?: boolean;
    scope?: "self" | "tenant" | "system";
    page?: number;
    perPage?: number;
  }) => {
    setMcpLoading(true);
    try {
      const { data, total } = await listMcps({
        page: opts?.page ?? mcpPage,
        perPage: opts?.perPage ?? mcpPerPage,
        sortField: "id",
        sortOrder: "DESC",
        filter: { q: mcpQuery },
        type: opts?.scope ?? mcpScope,
      });
      setMcpItems(data || []);
      setMcpTotal(total || 0);
    } catch {
      if (!opts?.silent)
        Message.error(t("mcpTools.msg.loadFail", { _: "加载失败" }));
    } finally {
      setMcpLoading(false);
    }
  };

  const fetchModels = async (
    pageArg?: number,
    perPageArg?: number,
    opts?: { silent?: boolean },
  ) => {
    setModelLoading(true);
    try {
      const pageNum = typeof pageArg === "number" ? pageArg : modelPage;
      const perPageNum =
        typeof perPageArg === "number" ? perPageArg : modelPerPage;
      const { data, total } = await listModels({
        page: pageNum,
        perPage: perPageNum,
        sortField: "id",
        sortOrder: "DESC",
        filter: { q: modelQuery },
      });
      setModelItems(data || []);
      setModelTotal(total || 0);
      if (typeof pageArg === "number") setModelPage(pageNum);
      if (typeof perPageArg === "number") setModelPerPage(perPageNum);
    } catch {
      if (!opts?.silent)
        Message.error(t("model.msg.loadFail", { _: "加载失败" }));
    } finally {
      setModelLoading(false);
    }
  };

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
  }, [selectedDocIds.length, t]);

  const toggleSelectMcp = (id?: number) => {
    if (!id && id !== 0) return;
    setSelectedMcpIds((prev) => {
      const exists = prev.includes(Number(id));
      if (exists) return prev.filter((d) => d !== Number(id));
      return [...prev, Number(id)];
    });
  };

  const selectedMcpText = useMemo(() => {
    if (!selectedMcpIds.length)
      return t("rag.ui.selected.none", { _: "未选择" });
    return `${selectedMcpIds.length}`;
  }, [selectedMcpIds, t]);

  const toggleSelectModel = (id?: number) => {
    if (!id && id !== 0) return;
    setSelectedModelId((prev) => (prev === Number(id) ? null : Number(id)));
  };

  const selectedModelText = useMemo(() => {
    if (modelSource !== "system") {
      return t("agent.ui.modelDefault", { _: "系统默认" });
    }
    if (selectedModelId === null)
      return t("agent.ui.modelDefault", { _: "系统默认" });
    const item = modelItems.find(
      (m) => Number(m.id || 0) === Number(selectedModelId),
    );
    return item?.name
      ? String(item.name)
      : t("agent.ui.modelDefault", { _: "系统默认" });
  }, [selectedModelId, modelItems, t, modelSource]);

  const handleCreate = async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);
      const meta: Record<string, unknown> = {};
      meta.model_source = modelSource;
      if (modelSource === "system") {
        if (selectedModelId !== null) {
          meta.model_id = selectedModelId;
          const item = modelItems.find(
            (m) => Number(m.id || 0) === Number(selectedModelId),
          );
          if (item?.name) meta.model_name = String(item.name);
        }
      } else if (modelSource === "openai") {
        if (values.openai_api_key) meta.openai_api_key = values.openai_api_key;
      } else if (modelSource === "custom") {
        if (values.chatopenai_api_key)
          meta.chatopenai_api_key = values.chatopenai_api_key;
        if (values.chatopenai_base_url)
          meta.chatopenai_base_url = values.chatopenai_base_url;
        if (values.chatopenai_model)
          meta.model_name = values.chatopenai_model;
      }
      const payload = {
        name: values.name,
        description: values.description || undefined,
        system_prompt: values.system_prompt || undefined,
        meta: Object.keys(meta).length ? meta : undefined,
        documents: selectedDocIds.length
          ? selectedDocIds.map((id) => {
              const s = selectedDocs[id];
              return {
                id,
                strategy: Array.isArray(s) && s.length ? s : undefined,
              };
            })
          : undefined,
        mcp_agent_ids: selectedMcpIds.length ? selectedMcpIds : undefined,
      };
      await createAgent(payload, values.type || "self");
      Message.success(t("common.success", { _: "操作成功" }));
      navigate("/agent");
    } catch (e) {
      const msg =
        (e as { message?: string })?.message ||
        t("common.error", { _: "操作失败" });
      Message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
      render: (v: unknown, _rec: ListRagDocsNameSpace.ListRagDocsResult) => (
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
                    return (
                      <Tag key={id} size="small">
                        {opt?.label || `策略 ${id}`}
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
      render: (v: unknown) => (
        <span style={{ fontWeight: 500 }}>
          {typeof v === "string" ? v : String(v ?? "")}
        </span>
      ),
    },
    {
      title: t("rag.ui.columns.description", { _: "描述" }),
      dataIndex: "description",
      width: 240,
      render: (v: unknown) =>
        typeof v === "string" && v ? v : t("common.empty", { _: "无" }),
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
      title: t("rag.ui.columns.operations", { _: "操作" }),
      dataIndex: "operations",
      width: 160,
      render: (_: unknown, record: ListModelsNameSpace.ListModelsResult) => {
        const id = Number(record.id || 0);
        const selected = selectedModelId === id;
        return (
          <Space>
            <Button
              type={selected ? "outline" : "primary"}
              onClick={() => toggleSelectModel(id)}
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
                setRagPage(1);
                setScope("self");
                void fetchRagDocs({ silent: true, scope: "self", page: 1 });
              }}
            >
              {t("rag.ui.tabs.self", { _: "个人" })}
            </Button>
            {!isSuperAdmin && !isDefaultTenant && (
              <Button
                type={scope === "tenant" ? "primary" : "outline"}
                onClick={() => {
                  setRagPage(1);
                  setScope("tenant");
                  void fetchRagDocs({ silent: true, scope: "tenant", page: 1 });
                }}
              >
                {t("rag.ui.tabs.tenant", { _: "租户" })}
              </Button>
            )}
            <Button
              type={scope === "system" ? "primary" : "outline"}
              onClick={() => {
                setRagPage(1);
                setScope("system");
                void fetchRagDocs({ silent: true, scope: "system", page: 1 });
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
            onPressEnter={() => {
              setRagPage(1);
              void fetchRagDocs({ page: 1 });
            }}
          />
          <Button
            type="primary"
            onClick={() => {
              setRagPage(1);
              void fetchRagDocs({ page: 1 });
            }}
            loading={ragLoading}
          >
            {t("rag.ui.search", { _: "搜索" })}
          </Button>
        </Space>
      </div>
      <Table
        loading={ragLoading}
        columns={ragColumns}
        data={docs}
        rowKey="id"
        pagination={{
          current: ragPage,
          pageSize: ragPerPage,
          total: ragTotal,
          showTotal: true,
          onChange: (page) => {
            setRagPage(page);
            void fetchRagDocs({ page });
          },
          onPageSizeChange: (size) => {
            setRagPerPage(size);
            setRagPage(1);
            void fetchRagDocs({ page: 1, perPage: size });
          },
        }}
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
              onClick={() => {
                setMcpPage(1);
                setMcpScope("self");
                void fetchMcps({ scope: "self", page: 1 });
              }}
            >
              {t("rag.ui.tabs.self", { _: "个人" })}
            </Button>
            {!isSuperAdmin && !isDefaultTenant && (
              <Button
                type={mcpScope === "tenant" ? "primary" : "outline"}
                onClick={() => {
                  setMcpPage(1);
                  setMcpScope("tenant");
                  void fetchMcps({ scope: "tenant", page: 1 });
                }}
              >
                {t("rag.ui.tabs.tenant", { _: "租户" })}
              </Button>
            )}
            <Button
              type={mcpScope === "system" ? "primary" : "outline"}
              onClick={() => {
                setMcpPage(1);
                setMcpScope("system");
                void fetchMcps({ scope: "system", page: 1 });
              }}
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
          <Button
            type="primary"
            onClick={() => {
              setMcpPage(1);
              void fetchMcps({ page: 1 });
            }}
            loading={mcpLoading}
          >
            {t("rag.ui.search", { _: "搜索" })}
          </Button>
        </Space>
      </div>
      <Table
        loading={mcpLoading}
        columns={mcpColumns}
        data={mcpItems}
        rowKey="id"
        pagination={{
          current: mcpPage,
          pageSize: mcpPerPage,
          total: mcpTotal,
          showTotal: true,
          onChange: (page) => {
            setMcpPage(page);
            void fetchMcps({ page });
          },
          onPageSizeChange: (size) => {
            setMcpPerPage(size);
            setMcpPage(1);
            void fetchMcps({ page: 1, perPage: size });
          },
        }}
      />
    </Card>
  );

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
            {t("rag.ui.selected.count", { _: "已选择" })}: {selectedModelText}
          </Tag>
        </Space>
        <Space>
          <Input
            allowClear
            style={{ width: 240 }}
            placeholder={t("agent.ui.modelSearchPlaceholder", {
              _: "搜索名称/厂商/标签/描述",
            })}
            value={modelQuery}
            onChange={setModelQuery}
            onPressEnter={() => fetchModels(1, modelPerPage)}
          />
          <Button
            type="primary"
            onClick={() => fetchModels(1, modelPerPage)}
            loading={modelLoading}
          >
            {t("rag.ui.search", { _: "搜索" })}
          </Button>
        </Space>
      </div>
      <Table
        loading={modelLoading}
        columns={modelColumns}
        data={modelItems}
        rowKey="id"
        pagination={{
          current: modelPage,
          pageSize: modelPerPage,
          total: modelTotal,
          onChange: (page) => {
            setModelPage(page);
            void fetchModels(page, modelPerPage);
          },
          onPageSizeChange: (size) => {
            setModelPerPage(size);
            setModelPage(1);
            void fetchModels(1, size);
          },
        }}
      />
    </Card>
  );

  return (
    <div style={{ paddingTop: "30px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Space />
        <Space>
          <Button onClick={() => navigate("/agent")}>
            {t("common.back", { _: "返回" })}
          </Button>
          <Button type="primary" onClick={handleCreate} loading={submitting}>
            {t("agent.ui.create", { _: "创建智能体" })}
          </Button>
        </Space>
      </div>
      <Card
        title={<Title title={t("agent.create.title", { _: "创建智能体" })} />}
        bordered
        style={{ ...cardColorStyle }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              width: 360,
              display: "flex",
              flexDirection: "column",
              rowGap: 12,
            }}
          >
            <Card
              hoverable
              onClick={() => setActive("base")}
              style={{ borderColor: active === "base" ? "#165DFF" : undefined }}
            >
              <Form form={form} layout="vertical">
                <Form.Item
                  label={t("agent.ui.columns.name", { _: "名称" })}
                  field="name"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={t("agent.ui.columns.description", { _: "描述" })}
                  field="description"
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item
                  label={t("agent.ui.systemPrompt", { _: "系统 Prompt" })}
                  field="system_prompt"
                >
                  <Input.TextArea
                    rows={8}
                    placeholder={t("agent.ui.systemPromptPlaceholder", {
                      _: "编写系统提示词（可粘贴或从文件填充）",
                    })}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}
                  />
                </Form.Item>
                <div>
                  <Button
                    type="outline"
                    onClick={() => promptFileRef.current?.click()}
                    style={{ marginRight: 8 }}
                  >
                    {t("agent.ui.uploadPrompt", { _: "从文件填充" })}
                  </Button>
                  <input
                    ref={promptFileRef}
                    type="file"
                    accept=".txt,.md,.json"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const text = String(reader.result || "");
                        form.setFieldsValue({ system_prompt: text });
                      };
                      reader.readAsText(file);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>
                <Form.Item
                  label={t("agent.ui.columns.type", { _: "类型" })}
                  field="type"
                  initialValue="self"
                >
                  <Radio.Group>
                    <Radio value="self">
                      {t("rag.ui.tabs.self", { _: "个人" })}
                    </Radio>
                    {!isSuperAdmin && !isDefaultTenant && (
                      <Radio value="tenant">
                        {t("rag.ui.tabs.tenant", { _: "租户" })}
                      </Radio>
                    )}
                    {isSuperAdmin && (
                      <Radio value="system">
                        {t("rag.ui.tabs.system", { _: "系统" })}
                      </Radio>
                    )}
                  </Radio.Group>
                </Form.Item>
              </Form>
            </Card>
            <Card
              hoverable
              onClick={() => setActive("model")}
              style={{
                borderColor: active === "model" ? "#165DFF" : undefined,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>{t("agent.ui.modelMessage", { _: "模型选择" })}</div>
                <Tag color="arcoblue">
                  {t("rag.ui.selected.count", { _: "已选择" })}:{" "}
                  {selectedModelText}
                </Tag>
              </div>
              <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
                <Form.Item
                  label={t("agent.ui.modelSource", { _: "模型来源" })}
                  field="model_source"
                  initialValue="system"
                >
                  <Select
                    value={modelSource}
                    onChange={(val) => {
                      const v =
                        (val as "system" | "openai" | "custom") || "system";
                      setModelSource(v);
                      form.setFieldsValue({ model_source: v });
                    }}
                    options={[
                      {
                        value: "system",
                        label: t("agent.ui.modelSource.system", {
                          _: "系统模型",
                        }),
                      },
                      {
                        value: "openai",
                        label: t("agent.ui.modelSource.openai", {
                          _: "自定义openai模型",
                        }),
                      },
                      {
                        value: "custom",
                        label: t("agent.ui.modelSource.custom", {
                          _: "自定义模型",
                        }),
                      },
                    ]}
                  />
                </Form.Item>
                {modelSource === "openai" && (
                  <Form.Item
                    label={t("agent.ui.openaiApiKey", {
                      _: "OpenAI API Key",
                    })}
                    field="openai_api_key"
                    rules={[{ required: true }]}
                  >
                    <Input.Password
                      allowClear
                      placeholder={t("agent.ui.openaiApiKeyPlaceholder", {
                        _: "填写你的 OpenAI Key",
                      })}
                    />
                  </Form.Item>
                )}
                {modelSource === "custom" && (
                  <>
                    <Form.Item
                      label={t("agent.ui.chatopenaiApiKey", {
                        _: "ChatOpenAI API Key",
                      })}
                      field="chatopenai_api_key"
                      rules={[{ required: true }]}
                    >
                      <Input.Password
                        allowClear
                        placeholder={t("agent.ui.chatopenaiApiKeyPlaceholder", {
                          _: "必填，填写你的 ChatOpenAI Key",
                        })}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t("agent.ui.chatopenaiBaseUrl", {
                        _: "ChatOpenAI Base URL",
                      })}
                      field="chatopenai_base_url"
                    >
                      <Input
                        allowClear
                        placeholder={t(
                          "agent.ui.chatopenaiBaseUrlPlaceholder",
                          {
                            _: "可选，例如 https://api.openai.com/v1",
                          },
                        )}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t("agent.ui.chatopenaiModel", {
                        _: "模型名称",
                      })}
                      field="chatopenai_model"
                    >
                      <Input
                        allowClear
                        placeholder={t(
                          "agent.ui.chatopenaiModelPlaceholder",
                          {
                            _: "需与上游 API 一致，例如 deepseek-chat、DeepSeek-V3.2",
                          },
                        )}
                      />
                    </Form.Item>
                  </>
                )}
              </Form>
            </Card>
            <Card
              hoverable
              onClick={() => setActive("rag")}
              style={{ borderColor: active === "rag" ? "#165DFF" : undefined }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>{t("agent.ui.ragMessage", { _: "知识库文档" })}</div>
                <Tag color="arcoblue">
                  {t("rag.ui.selected.count", { _: "已选择" })}:{" "}
                  {selectedDocsText}
                </Tag>
              </div>
            </Card>
            <Card
              hoverable
              onClick={() => setActive("mcp")}
              style={{ borderColor: active === "mcp" ? "#165DFF" : undefined }}
            >
              <div>{t("agent.ui.mcpMessage", { _: "MCP 消息" })}</div>
            </Card>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Space />
              <Space>
                <Button onClick={() => navigate("/agent")}>
                  {t("common.cancel", { _: "取消" })}
                </Button>
                <Button
                  type="primary"
                  onClick={handleCreate}
                  loading={submitting}
                >
                  {t("common.confirm", { _: "确认" })}
                </Button>
              </Space>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {active === "rag" && ragPreview}
            {active === "mcp" && mcpPreview}
            {active === "model" && modelSource === "system" && modelPreview}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreateAgent;

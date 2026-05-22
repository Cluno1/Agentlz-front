import React, { useEffect, useMemo, useState } from "react";
import { useTranslate } from "react-admin";
import {
  Card,
  Button,
  Space,
  Input,
  Select,
  Avatar,
  Tag,
  Form,
  Radio,
  Spin,
  Typography,
} from "@arco-design/web-react";
import { IconSearch } from "@arco-design/web-react/icon";
import Observation from "./component/observation";
import Evaluation from "./component/evaluation";
import { listAccessibleAgents, updateAgent } from "../../data/api/agent";
import { Message } from "@arco-design/web-react";
import type {
  UpdateAgentNameSpace,
  ListAgentsNameSpace,
} from "../../data/api/agent/type";
import { listModels } from "../../data/api/model";
import type { ListModelsNameSpace } from "../../data/api/model/type";

const EvaluationIndex: React.FC = () => {
  const t = useTranslate();
  const [active, setActive] = useState<"observation" | "evaluation">(
    "observation",
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightActive, setRightActive] = useState<
    "base" | "rag" | "mcp" | "model"
  >("base");
  const [form] = Form.useForm();
  const [selectedDocs, setSelectedDocs] = useState<
    Record<string, number[] | undefined>
  >({});
  const [selectedMcpIds, setSelectedMcpIds] = useState<number[]>([]);
  const [modelSource, setModelSource] = useState<
    "system" | "openai" | "custom"
  >("system");
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [modelItems, setModelItems] = useState<
    ListModelsNameSpace.ListModelsResult[]
  >([]);
  const [agents, setAgents] = useState<ListAgentsNameSpace.ListAgentsResult[]>(
    [],
  );
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentId, setAgentId] = useState<string>("");
  const [agentQuery, setAgentQuery] = useState<string>("");
  const [selectOpen, setSelectOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const isDefaultTenant =
    (localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default") ===
    "default";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      setIsNarrow(window.innerWidth < 1080);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setAgentsLoading(true);
        const resp = await listAccessibleAgents({
          page: 1,
          perPage: 50,
          filter: { q: agentQuery },
        });
        const rows = (resp?.data ??
          []) as ListAgentsNameSpace.ListAgentsResult[];
        setAgents(rows);
      } catch {
        void 0;
      } finally {
        setAgentsLoading(false);
      }
    };
    void run();
  }, [agentQuery]);

  // 组件挂载时设置默认agent
  useEffect(() => {
    if (!agentId && agents.length > 0) {
      setAgentId(String(agents[0].id ?? ""));
    }
  }, [agentId, agents]);

  useEffect(() => {
    const fetchModels = async () => {
      if (modelSource !== "system") {
        setModelItems([]);
        return;
      }
      try {
        const resp = await listModels({
          page: 1,
          perPage: 100,
          sortField: "id",
          sortOrder: "DESC",
          filter: { disabled: false },
        });
        setModelItems(resp?.data || []);
      } catch {
        // Silent fail
        setModelItems([]);
      }
    };
    void fetchModels();
  }, [modelSource]);

  useEffect(() => {
    const run = async () => {
      try {
        if (!agentId) return;
        const num = Number(agentId);
        if (Number.isNaN(num)) return;

        // 从 agents 数组中查找当前选中的 agent
        const row = agents.find((agent) => Number(agent.id) === num);
        if (!row) return;

        const name = String(row?.name ?? "");
        const description = String(row?.description ?? "");
        const system_prompt = String(row?.system_prompt ?? "");
        form.setFieldsValue({ name, description, system_prompt, type: "self" });
        const docMap: Record<string, number[] | undefined> = {};
        const rawDocs = (row as unknown as { documents?: unknown })?.documents;
        if (Array.isArray(rawDocs)) {
          rawDocs.forEach((d) => {
            const id = String((d as { id?: unknown })?.id ?? "");
            if (!id) return;
            const rawStrategy = (d as { strategy?: unknown })?.strategy;
            const nums = Array.isArray(rawStrategy)
              ? rawStrategy
                  .map((x) => Number(x))
                  .filter((n) => !Number.isNaN(n))
              : [];
            docMap[id] = nums.length ? nums : undefined;
          });
        }
        const docIds = Array.isArray(row?.document_ids)
          ? (row?.document_ids as unknown[]).map((x) => String(x ?? ""))
          : [];
        docIds.filter(Boolean).forEach((id) => {
          if (!(id in docMap)) docMap[id] = undefined;
        });
        const mcpIds = Array.isArray(row?.mcp_agent_ids)
          ? (row?.mcp_agent_ids as number[])
          : [];
        setSelectedDocs(docMap);
        setSelectedMcpIds(mcpIds);
        const metaObj = (row?.meta ?? {}) as Record<string, unknown>;
        const rawSrc = metaObj["model_source"];
        const src =
          rawSrc === "openai" || rawSrc === "custom" || rawSrc === "system"
            ? (rawSrc as "system" | "openai" | "custom")
            : "system";
        setModelSource(src);
        if (src === "system") {
          const mid = Number(metaObj["model_id"] ?? NaN);
          setSelectedModelId(Number.isNaN(mid) ? null : mid);
        } else if (src === "openai") {
          const k = metaObj["openai_api_key"];
          if (typeof k === "string") form.setFieldsValue({ openai_api_key: k });
        } else if (src === "custom") {
          const ck = metaObj["chatopenai_api_key"];
          if (typeof ck === "string")
            form.setFieldsValue({ chatopenai_api_key: ck });
          const cb = metaObj["chatopenai_base_url"];
          if (typeof cb === "string")
            form.setFieldsValue({ chatopenai_base_url: cb });
          const cm = metaObj["model_name"];
          if (typeof cm === "string")
            form.setFieldsValue({ chatopenai_model: cm });
        }
      } catch {
        void 0;
      }
    };
    void run();
  }, [agentId, agents, form]);

  const selectedDocIds = useMemo(
    () => Object.keys(selectedDocs),
    [selectedDocs],
  );

  const selectedDocsText = useMemo(() => {
    if (!selectedDocIds.length)
      return t("rag.ui.selected.none", { _: "未选择" });
    return `${selectedDocIds.length}`;
  }, [selectedDocIds, t]);

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

  const currentAgent = useMemo(
    () => agents.find((agent) => String(agent.id) === agentId),
    [agents, agentId],
  );

  const toggleSelectMcp = (id?: number) => {
    if (typeof id !== "number") return;
    setSelectedMcpIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((d) => d !== id);
      return [...prev, id];
    });
  };

  const surfaceStyle: React.CSSProperties = {
    border: "1px solid #E5E6EB",
    borderRadius: 8,
    background: "#FFFFFF",
    boxShadow: "0 10px 28px rgba(29, 33, 41, 0.06)",
  };

  const mutedTextStyle: React.CSSProperties = {
    color: "#4E5969",
    lineHeight: 1.7,
  };

  const configCardStyle = (
    key: "base" | "rag" | "mcp" | "model",
    accent: string,
  ): React.CSSProperties => ({
    ...surfaceStyle,
    borderTop: `4px solid ${accent}`,
    borderColor: rightActive === key ? accent : "#E5E6EB",
    cursor: "pointer",
  });

  const activeLabel =
    active === "observation"
      ? t("evaluation.tabs.observe", { _: "观测" })
      : t("evaluation.tabs.evaluate", { _: "评测" });

  return (
    <div style={{ minHeight: "100%", background: "#F7F8FA" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 8,
            padding: "34px 32px",
            color: "#FFFFFF",
            background:
              "linear-gradient(135deg, #111827 0%, #1B365D 42%, #0B7A75 100%)",
            boxShadow: "0 18px 45px rgba(17, 24, 39, 0.18)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
              <Tag color="arcoblue" style={{ marginBottom: 16 }}>
                AGENT EVALUATION CENTER
              </Tag>
              <Typography.Title
                heading={3}
                style={{ color: "#FFFFFF", margin: 0 }}
              >
                {t("evaluation.title", { _: "智能体评测" })}
              </Typography.Title>
              <Typography.Paragraph
                style={{
                  color: "rgba(255,255,255,0.82)",
                  maxWidth: 760,
                  marginTop: 14,
                  marginBottom: 0,
                  lineHeight: 1.8,
                }}
              >
                面向企业试运行的 Agent 质量工作台。通过实时观测和批量评测，
                统一验证回答质量、知识引用、工具调用和历史续聊稳定性。
              </Typography.Paragraph>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {[
                [activeLabel, "当前模式"],
                [agents.length ? String(agents.length) : "-", "可访问助手"],
                [selectedDocsText, "知识资料"],
                [String(selectedMcpIds.length), "MCP 工具"],
              ].map(([value, label]) => (
                <div
                  key={`${value}-${label}`}
                  style={{
                    minHeight: 92,
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

        <div style={{ ...surfaceStyle, padding: 20 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
              alignItems: "center",
              marginBottom: currentAgent ? 16 : 0,
            }}
          >
            <Input
              allowClear
              prefix={<IconSearch />}
              placeholder={t("agent.ui.searchPlaceholder", {
                _: "按名称/描述搜索",
              })}
              value={agentQuery}
              onChange={setAgentQuery}
              onPressEnter={() => setAgentQuery(agentQuery)}
            />
            <Select
              value={agentId}
              onChange={setAgentId}
              placeholder={t("agent.ui.selectAgent", { _: "选择助手" })}
              loading={agentsLoading}
              triggerProps={{
                popupVisible: selectOpen,
                onVisibleChange: setSelectOpen,
              }}
            >
              {agents.map((a) => (
                <Select.Option key={a.id} value={String(a.id)}>
                  <Space>
                    <Avatar size={20} style={{ backgroundColor: "#f6f7fb" }}>
                      {a.avatar ? (
                        <img src={a.avatar} alt={a.name} />
                      ) : (
                        a.name?.slice(0, 1) || "A"
                      )}
                    </Avatar>
                    <span>{a.name}</span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
            <Space wrap>
              <Button
                type="primary"
                icon={<IconSearch />}
                onClick={() => setAgentQuery(agentQuery)}
                loading={agentsLoading}
              >
                {t("agent.ui.search", { _: "搜索" })}
              </Button>
              {agentsLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Spin size={16} />
                  <span>搜索中</span>
                </div>
              )}
            </Space>
          </div>

          {currentAgent && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "48px minmax(0, 1fr)",
                gap: 12,
                alignItems: "center",
                padding: 16,
                borderRadius: 8,
                background: "#F7F8FA",
              }}
            >
              <Avatar
                size={42}
                style={{
                  background:
                    "linear-gradient(135deg, #165DFF 0%, #00B42A 100%)",
                }}
              >
                {currentAgent.avatar ? (
                  <img
                    src={currentAgent.avatar || ""}
                    alt={currentAgent.name || ""}
                  />
                ) : (
                  (currentAgent.name || "A").slice(0, 1)
                )}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <Typography.Text style={{ fontWeight: 600 }}>
                  {currentAgent.name || "-"}
                </Typography.Text>
                <Typography.Paragraph
                  style={{ ...mutedTextStyle, marginBottom: 8 }}
                >
                  {currentAgent.description || "当前助手暂无描述"}
                </Typography.Paragraph>
                <Space wrap size={6}>
                  {(currentAgent.tags || []).map((tag: string) => (
                    <Tag key={tag} size="small" color="arcoblue">
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            ...surfaceStyle,
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Button.Group>
            <Button
              type={active === "observation" ? "primary" : "outline"}
              onClick={() => setActive("observation")}
            >
              {t("evaluation.tabs.observe", { _: "观测" })}
            </Button>
            <Button
              type={active === "evaluation" ? "primary" : "outline"}
              onClick={() => setActive("evaluation")}
            >
              {t("evaluation.tabs.evaluate", { _: "评测" })}
            </Button>
          </Button.Group>
          <Button onClick={() => setSidebarCollapsed((c) => !c)}>
            {sidebarCollapsed
              ? t("agent.ui.expand", { _: "展开配置" })
              : t("agent.ui.collapse", { _: "收起配置" })}
          </Button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              sidebarCollapsed || isNarrow
                ? "minmax(0, 1fr)"
                : "360px minmax(0, 1fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          {!sidebarCollapsed && (
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                rowGap: 12,
              }}
            >
              <Card
                hoverable
                onClick={() => setRightActive("base")}
                style={configCardStyle("base", "#165DFF")}
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
                    <Input.TextArea rows={6} />
                  </Form.Item>
                  <Form.Item
                    label={t("agent.ui.columns.type", { _: "类型" })}
                    field="type"
                    initialValue="self"
                  >
                    <Radio.Group>
                      <Radio value="self">
                        {t("rag.ui.tabs.self", { _: "个人" })}
                      </Radio>
                      {!isDefaultTenant && (
                        <Radio value="tenant">
                          {t("rag.ui.tabs.tenant", { _: "租户" })}
                        </Radio>
                      )}
                    </Radio.Group>
                  </Form.Item>
                </Form>
              </Card>
              <Card
                hoverable
                onClick={() => setRightActive("model")}
                style={configCardStyle("model", "#722ED1")}
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
                    initialValue={modelSource}
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
                          placeholder={t(
                            "agent.ui.chatopenaiApiKeyPlaceholder",
                            { _: "必填，填写你的 ChatOpenAI Key" },
                          )}
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
                            { _: "可选，例如 https://api.openai.com/v1" },
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
                onClick={() => setRightActive("rag")}
                style={configCardStyle("rag", "#00B42A")}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>{t("agent.ui.ragMessage", { _: "RAG 消息" })}</div>
                  <Tag color="arcoblue">
                    {t("rag.ui.selected.count", { _: "已选择" })}:{" "}
                    {selectedDocsText}
                  </Tag>
                </div>
              </Card>
              <Card
                hoverable
                onClick={() => setRightActive("mcp")}
                style={configCardStyle("mcp", "#F7BA1E")}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>{t("agent.ui.mcpMessage", { _: "MCP 消息" })}</div>
                  <Tag color="arcoblue">
                    {t("rag.ui.selected.count", { _: "已选择" })}:{" "}
                    {selectedMcpIds.length}
                  </Tag>
                </div>
              </Card>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Space />
                <Space>
                  <Button
                    type="primary"
                    onClick={async () => {
                      try {
                        const values = await form.validate();
                        const meta: Record<string, unknown> = {};
                        meta.model_source = modelSource;
                        if (modelSource === "system") {
                          if (selectedModelId !== null) {
                            meta.model_id = selectedModelId;
                            const item = modelItems.find(
                              (m) =>
                                Number(m.id || 0) === Number(selectedModelId),
                            );
                            if (item?.name) meta.model_name = String(item.name);
                          }
                        } else if (modelSource === "openai") {
                          if (values.openai_api_key)
                            meta.openai_api_key = values.openai_api_key;
                        } else if (modelSource === "custom") {
                          if (values.chatopenai_api_key)
                            meta.chatopenai_api_key = values.chatopenai_api_key;
                          if (values.chatopenai_base_url)
                            meta.chatopenai_base_url =
                              values.chatopenai_base_url;
                          if (values.chatopenai_model)
                            meta.model_name = values.chatopenai_model;
                        }
                        const payload: UpdateAgentNameSpace.UpdateAgentParams =
                          {
                            name: values.name,
                            description: values.description || undefined,
                            system_prompt: values.system_prompt || undefined,
                            meta: Object.keys(meta).length ? meta : undefined,
                            documents: selectedDocIds.length
                              ? selectedDocIds.map((id) => {
                                  const s = selectedDocs[id];
                                  return {
                                    id,
                                    strategy:
                                      Array.isArray(s) && s.length
                                        ? s
                                        : undefined,
                                  };
                                })
                              : undefined,
                            mcp_agent_ids: selectedMcpIds.length
                              ? selectedMcpIds
                              : undefined,
                          };
                        const numId = Number(agentId);
                        if (!Number.isNaN(numId)) {
                          await updateAgent(numId, payload);
                          Message.success(
                            t("common.success", { _: "操作成功" }),
                          );
                        }
                      } catch (e) {
                        const msg =
                          e instanceof Error ? e.message : String(e ?? "");
                        Message.error(
                          msg || t("common.error", { _: "操作失败" }),
                        );
                      }
                    }}
                  >
                    {t("common.confirm", { _: "确认修改" })}
                  </Button>
                </Space>
              </div>
            </div>
          )}
          <div
            style={{
              ...surfaceStyle,
              minWidth: 0,
              padding: 16,
              overflowX: "auto",
            }}
          >
            {active === "observation" && (
              <Observation
                active={rightActive}
                selectedDocs={selectedDocs}
                setSelectedDocs={setSelectedDocs}
                selectedMcpIds={selectedMcpIds}
                onToggleSelectMcp={toggleSelectMcp}
                agentId={agentId}
                modelSource={modelSource}
                selectedModelId={selectedModelId}
                onToggleSelectModel={(id?: number) => {
                  if (!id && id !== 0) return;
                  setSelectedModelId((prev) =>
                    prev === Number(id) ? null : Number(id),
                  );
                }}
              />
            )}
            {active === "evaluation" && <Evaluation />}
          </div>
        </div>
      </Space>
    </div>
  );
};

export default EvaluationIndex;

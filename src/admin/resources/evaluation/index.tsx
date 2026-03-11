import React, { useEffect, useMemo, useState } from "react";
import { Title, useTranslate } from "react-admin";
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
  const isDefaultTenant =
    (localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default") ===
    "default";

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

  const toggleSelectMcp = (id?: number) => {
    if (typeof id !== "number") return;
    setSelectedMcpIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((d) => d !== id);
      return [...prev, id];
    });
  };
  return (
    <div style={{ paddingTop: "30px" }}>
      <Card
        title={<Title title={t("evaluation.title", { _: "智能体评测" })} />}
        bordered
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Space>
            <Input
              allowClear
              style={{ width: 280 }}
              placeholder={t("agent.ui.searchPlaceholder", {
                _: "按名称/描述搜索",
              })}
              value={agentQuery}
              onChange={setAgentQuery}
              onPressEnter={() => setAgentQuery(agentQuery)}
            />
            <Button
              type="primary"
              icon={<IconSearch />}
              onClick={() => setAgentQuery(agentQuery)}
              loading={agentsLoading}
            >
              {t("agent.ui.search", { _: "搜索" })}
            </Button>
          </Space>
          <Space>
            <Select
              style={{ width: 320 }}
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
            {agentsLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Spin size={16} />
                <span>搜索中</span>
              </div>
            )}
          </Space>
        </div>
        {agentId && (
          <Card style={{ marginBottom: 12 }}>
            {(() => {
              const currentAgent = agents.find((x) => String(x.id) === agentId);
              if (!currentAgent) return null;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar size={28} style={{ backgroundColor: "#f6f7fb" }}>
                    {currentAgent.avatar ? (
                      <img
                        src={currentAgent.avatar || ""}
                        alt={currentAgent.name || ""}
                      />
                    ) : (
                      (currentAgent.name || "A").slice(0, 1)
                    )}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>
                      {currentAgent.name || "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {currentAgent.description || ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(currentAgent.tags || []).map((tag: string) => (
                      <Tag key={tag} size="small" color="arcoblue">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              );
            })()}
          </Card>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Space>
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
          </Space>
          <Space>
            <Button onClick={() => setSidebarCollapsed((c) => !c)}>
              {sidebarCollapsed
                ? t("agent.ui.expand", { _: "展开左侧" })
                : t("agent.ui.collapse", { _: "收起左侧" })}
            </Button>
          </Space>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {!sidebarCollapsed && (
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
                onClick={() => setRightActive("base")}
                style={{
                  borderColor: rightActive === "base" ? "#165DFF" : undefined,
                }}
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
                style={{
                  borderColor: rightActive === "model" ? "#165DFF" : undefined,
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
                    </>
                  )}
                </Form>
              </Card>
              <Card
                hoverable
                onClick={() => setRightActive("rag")}
                style={{
                  borderColor: rightActive === "rag" ? "#165DFF" : undefined,
                }}
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
                style={{
                  borderColor: rightActive === "mcp" ? "#165DFF" : undefined,
                }}
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
              <div style={{ display: "flex", justifyContent: "space-between" }}>
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
          <div style={{ flex: 1 }}>
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
      </Card>
    </div>
  );
};

export default EvaluationIndex;

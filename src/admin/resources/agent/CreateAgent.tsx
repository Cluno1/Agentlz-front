/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { Title, useTranslate } from "react-admin";
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
  Switch,
  Avatar,
  Spin,
} from "@arco-design/web-react";
import { IconUser } from "@arco-design/web-react/icon";
import { useDarkMode } from "../../data/hook/useDark";
import { listDocuments } from "../../data/api/rag";
import type { ListRagDocsNameSpace } from "../../data/api/rag/type";
import { createAgent } from "../../data/api/agent";

const CreateAgent: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const { cardColorStyle } = useDarkMode();
  const [active, setActive] = useState<"base" | "rag" | "mcp">("base");
  const [form] = Form.useForm();
  const [baseMessage, setBaseMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [docs, setDocs] = useState<ListRagDocsNameSpace.ListRagDocsResult[]>(
    [],
  );
  const [ragLoading, setRagLoading] = useState<boolean>(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [titleQuery, setTitleQuery] = useState<string>("");
  const [scope, setScope] = useState<"self" | "tenant" | "system">("tenant");

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
        Message.error(t("rag.msg.loadFail", { _: "加载失败" }));
      } finally {
        setRagLoading(false);
      }
    };
    void run();
  }, [t, scope]);

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
      Message.error(t("rag.msg.loadFail", { _: "加载失败" }));
    } finally {
      setRagLoading(false);
    }
  };

  const toggleSelectDoc = (id?: string) => {
    if (!id) return;
    setSelectedDocIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((d) => d !== id);
      return [...prev, id];
    });
  };

  const selectedDocsText = useMemo(() => {
    if (!selectedDocIds.length)
      return t("rag.ui.selected.none", { _: "未选择" });
    return `${selectedDocIds.length}`;
  }, [selectedDocIds, t]);

  const handleCreate = async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);
      const payload = {
        name: values.name,
        description: values.description || undefined,
        disabled: values.disabled || false,
        document_ids: selectedDocIds.length ? selectedDocIds : undefined,
        mcp_agent_ids: undefined,
      };
      await createAgent(payload);
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
      title: t("rag.ui.columns.id", { _: "ID" }),
      dataIndex: "id",
      width: 120,
    },
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

  const previewHeader = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Avatar size={28}>
        <img src="/agentlz-robot.jpg" alt="agent" />
      </Avatar>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>
          {form.getFieldValue("name") || t("agent.ui.new", { _: "新智能体" })}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {form.getFieldValue("description") || ""}
        </div>
      </div>
    </div>
  );

  const basePreview = (
    <Card style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
      {previewHeader}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          rowGap: 12,
        }}
      >
        {baseMessage && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                display: "flex",
                maxWidth: "80%",
                alignItems: "flex-start",
                gap: 8,
                flexDirection: "row-reverse",
              }}
            >
              <Avatar size={28} style={{ backgroundColor: "#165DFF" }}>
                <IconUser />
              </Avatar>
              <div
                style={{
                  borderRadius: 16,
                  padding: "8px 12px",
                  fontSize: 14,
                  lineHeight: 1.6,
                  backgroundColor: "rgb(22,93,255)",
                  color: "#fff",
                }}
              >
                {baseMessage}
              </div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div
            style={{
              display: "flex",
              maxWidth: "80%",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Avatar size={28}>
              <img src="/agentlz-robot.jpg" alt="assistant" />
            </Avatar>
            <div
              style={{
                borderRadius: 16,
                padding: "8px 12px",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {t("agent.ui.preview.reply", { _: "这是预览回复" })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

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
            <Button
              type={scope === "tenant" ? "primary" : "outline"}
              onClick={() => setScope("tenant")}
            >
              {t("rag.ui.tabs.tenant", { _: "租户" })}
            </Button>
            <Button
              type={scope === "system" ? "primary" : "outline"}
              onClick={() => setScope("system")}
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
    <Card style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
      <div style={{ padding: 12, fontSize: 14, color: "#6b7280" }}>
        {t("agent.ui.mcp.empty", { _: "暂无 MCP 数据" })}
      </div>
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
                  label={t("agent.ui.columns.disabled", { _: "停用" })}
                  field="disabled"
                  triggerPropName="checked"
                >
                  <Switch />
                </Form.Item>
                <Form.Item label={t("agent.ui.baseMessage", { _: "基础消息" })}>
                  <Input.TextArea
                    rows={4}
                    value={baseMessage}
                    onChange={setBaseMessage}
                    placeholder={t("agent.ui.placeholder", { _: "请输入消息" })}
                  />
                </Form.Item>
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
                <div>{t("agent.ui.ragMessage", { _: "RAG 消息" })}</div>
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
          </div>
          <div style={{ flex: 1 }}>
            {active === "base" && basePreview}
            {active === "rag" && ragPreview}
            {active === "mcp" && mcpPreview}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreateAgent;

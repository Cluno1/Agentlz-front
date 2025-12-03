/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Title, useTranslate } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Input,
  Message,
  Select,
  Table,
  Tag,
  Space,
  Popconfirm,
  Modal,
  Form,
  Switch,
  Popover,
} from "@arco-design/web-react";
import {
  IconRefresh,
  IconSearch,
  IconEdit,
  IconDelete,
  IconEye,
} from "@arco-design/web-react/icon";
import { useDarkMode } from "../../data/hook/useDark";
import {
  listAgents,
  updateAgent,
  deleteAgent,
  updateAgentApi,
} from "../../data/api/agent";
import type { ListAgentsNameSpace } from "../../data/api/agent/type";

const DISABLED_OPTIONS: Array<"all" | "enabled" | "disabled"> = [
  "all",
  "enabled",
  "disabled",
];

const AgentListPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const { cardColorStyle } = useDarkMode();
  const [agents, setAgents] = useState<ListAgentsNameSpace.ListAgentsResult[]>(
    [],
  );
  const [query, setQuery] = useState<string>("");
  const [status, setStatus] = useState<"all" | "enabled" | "disabled">("all");
  const [scope, setScope] = useState<"self" | "tenant">("self");
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [sortField, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [editVisible, setEditVisible] = useState<boolean>(false);
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editForm] = Form.useForm();
  const [editRecord, setEditRecord] =
    useState<ListAgentsNameSpace.ListAgentsResult | null>(null);

  const [apiVisible, setApiVisible] = useState<boolean>(false);
  const [apiSubmitting, setApiSubmitting] = useState<boolean>(false);
  const [apiForm] = Form.useForm();
  const [apiRecord, setApiRecord] =
    useState<ListAgentsNameSpace.ListAgentsResult | null>(null);

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, page, pageSize, sortField, sortOrder]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const resp = await listAgents({
        page,
        perPage: pageSize,
        sortField,
        sortOrder,
        filter: { q: query },
        type: scope,
      });
      const rows = resp.data || [];
      const filtered =
        status === "all"
          ? rows
          : rows.filter((a) =>
              status === "enabled" ? !a.disabled : Boolean(a.disabled),
            );
      setAgents(filtered);
      setTotal(resp.total || filtered.length);
    } catch {
      Message.error(t("agent.msg.loadAgentsFail", { _: "加载失败" }));
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = agents.length;
    const enabled = agents.filter((d) => !d.disabled).length;
    const disabled = agents.filter((d) => !!d.disabled).length;
    return { total, enabled, disabled };
  }, [agents]);

  const openEdit = (rec: ListAgentsNameSpace.ListAgentsResult) => {
    setEditRecord(rec);
    editForm.setFieldsValue({
      name: rec.name || "",
      description: rec.description || "",
      disabled: Boolean(rec.disabled),
    });
    setEditVisible(true);
  };

  const submitEdit = async (values: any) => {
    try {
      if (!editRecord?.id && editRecord?.id !== 0) return;
      setEditSubmitting(true);
      await updateAgent(Number(editRecord.id), {
        name: values.name ?? undefined,
        description: values.description ?? undefined,
        disabled: values.disabled ?? undefined,
      });
      Message.success(t("common.success", { _: "操作成功" }));
      setEditVisible(false);
      setEditRecord(null);
      fetchAgents();
    } catch (e: any) {
      Message.error(e?.message || t("common.error", { _: "操作失败" }));
    } finally {
      setEditSubmitting(false);
    }
  };

  const openApiEdit = (rec: ListAgentsNameSpace.ListAgentsResult) => {
    setApiRecord(rec);
    apiForm.setFieldsValue({ api_name: "", api_key: "" });
    setApiVisible(true);
  };

  const submitApi = async (values: any) => {
    try {
      if (!apiRecord?.id && apiRecord?.id !== 0) return;
      setApiSubmitting(true);
      await updateAgentApi(Number(apiRecord.id), {
        api_name: values.api_name ?? undefined,
        api_key: values.api_key ?? undefined,
      });
      Message.success(t("common.success", { _: "操作成功" }));
      setApiVisible(false);
      setApiRecord(null);
      fetchAgents();
    } catch (e: any) {
      Message.error(e?.message || t("common.error", { _: "操作失败" }));
    } finally {
      setApiSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAgent(Number(id));
      Message.success(
        t("userManagement.messages.deleteSuccess", { _: "删除成功" }),
      );
      fetchAgents();
    } catch (e: any) {
      Message.error(
        e?.message ||
          t("userManagement.messages.deleteError", { _: "删除失败" }),
      );
    }
  };

  const handlePageChange = (current: number) => {
    setPage(current);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === "asc" ? "ASC" : "DESC");
    }
  };

  const columns = [
    {
      title: t("agent.ui.columns.name", { _: "名称" }),
      dataIndex: "name",
      sorter: true,
      width: 180,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: t("agent.ui.columns.description", { _: "描述" }),
      dataIndex: "description",
      width: 240,
      render: (v: string) => v || "-",
    },
    {
      title: t("agent.ui.columns.disabled", { _: "停用" }),
      dataIndex: "disabled",
      sorter: true,
      width: 100,
      render: (v: boolean, record: ListAgentsNameSpace.ListAgentsResult) => (
        <Switch
          checked={!!v}
          onChange={async (checked) => {
            try {
              await updateAgent(Number(record.id), { disabled: checked });
              Message.success(
                t("userManagement.messages.updateStatusSuccess", {
                  _: "状态已更新",
                }),
              );
              fetchAgents();
            } catch (e: any) {
              Message.error(
                e?.message ||
                  t("userManagement.messages.updateStatusError", {
                    _: "更新失败",
                  }),
              );
            }
          }}
        />
      ),
    },
    {
      title: t("agent.ui.columns.mcpIds", { _: "MCP ID" }),
      dataIndex: "mcp_agent_ids",
      width: 160,
      render: (v: number[] | undefined) => (
        <Space wrap>
          {(v || []).map((id, idx) => (
            <Tag key={`${id}-${idx}`} size="small">
              {id}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t("agent.ui.columns.docCount", { _: "文档数量" }),
      dataIndex: "documents",
      width: 160,
      render: (docs: Array<{ id: string; name: string }> | undefined) => {
        const list = docs || [];
        const count = list.length;
        if (count === 0) return 0;
        return (
          <Popover
            trigger="hover"
            position="top"
            content={
              <div style={{ maxWidth: 320 }}>
                {list.map((d, idx) => (
                  <div key={`${d.id}-${idx}`} style={{ marginBottom: 4 }}>
                    <span>{d.name}</span>
                  </div>
                ))}
              </div>
            }
          >
            <span style={{ cursor: "pointer" }}>{count}</span>
          </Popover>
        );
      },
    },
    {
      title: t("agent.ui.columns.tenant", { _: "租户" }),
      dataIndex: "tenant_id",
      width: 120,
    },
    {
      title: t("agent.ui.columns.createdAt", { _: "创建时间" }),
      dataIndex: "created_at",
      sorter: true,
      width: 180,
      render: (v: string) => (v ? new Date(v).toLocaleString() : ""),
    },
    {
      title: t("agent.ui.columns.operations", { _: "操作" }),
      dataIndex: "operations",
      width: 140,
      render: (_: any, record: ListAgentsNameSpace.ListAgentsResult) => (
        <Space>
          <Button icon={<IconEdit />} onClick={() => openEdit(record)}>
            {t("agent.ui.columns.edit", { _: "修改" })}
          </Button>
          <Button icon={<IconEye />} onClick={() => openApiEdit(record)}>
            {t("agent.ui.columns.updateApi", { _: "更新密钥" })}
          </Button>
          <Popconfirm
            title={t("agent.ui.columns.deleteConfirm", {
              _: "确认删除该 Agent 吗？",
            })}
            onOk={() => handleDelete(Number(record.id))}
          >
            <Button status="danger" icon={<IconDelete />}>
              {t("agent.ui.columns.delete", { _: "删除" })}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ paddingTop: "30px" }}>
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
              type={scope === "self" ? "primary" : "outline"}
              onClick={() => setScope("self")}
            >
              {t("agent.ui.tabs.self", { _: "个人" })}
            </Button>
            <Button
              type={scope === "tenant" ? "primary" : "outline"}
              onClick={() => setScope("tenant")}
            >
              {t("agent.ui.tabs.tenant", { _: "租户" })}
            </Button>
          </Button.Group>
        </Space>
        <Button type="primary" onClick={() => navigate("/agent/create")}>
          {t("agent.ui.create", { _: "创建智能体" })}
        </Button>
      </div>
      <Card
        title={<Title title={t("agent.title", { _: "智能体管理" })} />}
        bordered
        style={{ ...cardColorStyle }}
      >
        <Space style={{ marginBottom: 16 }}>
          <Input
            allowClear
            style={{ width: 280 }}
            placeholder={t("agent.ui.searchPlaceholder", {
              _: "按名称/描述搜索",
            })}
            value={query}
            onChange={setQuery}
            onPressEnter={fetchAgents}
          />
          <Select value={status} onChange={setStatus} style={{ width: 160 }}>
            {DISABLED_OPTIONS.map((s) => (
              <Select.Option key={s} value={s}>
                {s === "all"
                  ? t("agent.ui.categories.all", { _: "全部" })
                  : s === "enabled"
                    ? t("agent.ui.status.enabled", { _: "启用" })
                    : t("agent.ui.status.disabled", { _: "停用" })}
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<IconSearch />} onClick={fetchAgents}>
            {t("agent.ui.search", { _: "搜索" })}
          </Button>
          <Button icon={<IconRefresh />} onClick={fetchAgents}>
            {t("agent.ui.refresh", { _: "刷新" })}
          </Button>
          <Space style={{ marginLeft: 12 }}>
            <span>
              {t("agent.ui.stats.total", { _: "总计" })}: {stats.total}
            </span>
            <span>
              {t("agent.ui.status.enabled", { _: "启用" })}: {stats.enabled}
            </span>
            <span>
              {t("agent.ui.status.disabled", { _: "停用" })}: {stats.disabled}
            </span>
          </Space>
        </Space>
        <Table
          loading={loading}
          columns={columns as any}
          data={agents}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: true,
            onChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
          onChange={handleTableChange}
        />
        {!loading && agents.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            {t("agent.msg.loadAgentsFail", { _: "加载失败" })}
          </div>
        )}

        <Modal
          title={t("agent.ui.columns.edit", { _: "修改" })}
          visible={editVisible}
          onCancel={() => setEditVisible(false)}
          onOk={() => editForm.submit()}
          confirmLoading={editSubmitting}
        >
          <Form form={editForm} layout="vertical" onSubmit={submitEdit}>
            <Form.Item
              label={t("agent.ui.columns.name", { _: "名称" })}
              field="name"
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={t("agent.ui.columns.description", { _: "描述" })}
              field="description"
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item
              label={t("agent.ui.columns.disabled", { _: "停用" })}
              field="disabled"
              triggerPropName="checked"
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={t("agent.ui.columns.updateApi", { _: "更新密钥" })}
          visible={apiVisible}
          onCancel={() => setApiVisible(false)}
          onOk={() => apiForm.submit()}
          confirmLoading={apiSubmitting}
        >
          <Form form={apiForm} layout="vertical" onSubmit={submitApi}>
            <Form.Item
              label={t("agent.ui.columns.apiName", { _: "API 名称" })}
              field="api_name"
            >
              <Input placeholder="openai / azure / custom" />
            </Form.Item>
            <Form.Item
              label={t("agent.ui.columns.apiKey", { _: "API 密钥" })}
              field="api_key"
            >
              <Input.Password />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default AgentListPage;

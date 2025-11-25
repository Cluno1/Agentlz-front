/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Title, useTranslate } from "react-admin";
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
} from "@arco-design/web-react";
import {
  IconUpload,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconEye,
} from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";
import {
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
} from "../../data/api/rag";
import type { ListRagDocsNameSpace } from "../../data/api/rag/type";

const STATUS_OPTIONS: Array<string | "all"> = ["all", "processing", "ready"];

const RagPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<ListRagDocsNameSpace.ListRagDocsResult[]>(
    [],
  );
  const [query, setQuery] = useState<string>("");
  const [status, setStatus] = useState<string | "all">("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [detailRecord, setDetailRecord] =
    useState<ListRagDocsNameSpace.ListRagDocsResult | null>(null);
  const [editVisible, setEditVisible] = useState<boolean>(false);
  const [editRecord, setEditRecord] =
    useState<ListRagDocsNameSpace.ListRagDocsResult | null>(null);
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editForm] = Form.useForm();
  const [scope, setScope] = useState<"self" | "tenant" | "system">("tenant");

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, scope]);

  const openUploadPage = () => {
    navigate("/rag/upload");
  };

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const resp = await listDocuments({
        page: 1,
        perPage: 50,
        sortField: "id",
        sortOrder: "DESC",
        filter: { q: query },
        type: scope,
      });
      const rows = resp.data || [];
      const filtered =
        status === "all" ? rows : rows.filter((d) => d.status === status);
      setDocs(filtered);
    } catch {
      Message.error(t("rag.msg.loadFail", { _: "加载失败" }));
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = docs.length;
    const processing = docs.filter((d) => d.status === "processing").length;
    const ready = docs.filter((d) => d.status === "ready").length;
    return { total, processing, ready };
  }, [docs]);

  const openDetail = async (rec: ListRagDocsNameSpace.ListRagDocsResult) => {
    try {
      const full = await getDocument(String(rec.id || ""));
      setDetailRecord(full);
      setDetailVisible(true);
    } catch (e: any) {
      Message.error(e?.message || t("common.error", { _: "操作失败" }));
    }
  };

  const openEdit = (rec: ListRagDocsNameSpace.ListRagDocsResult) => {
    setEditRecord(rec);
    editForm.setFieldsValue({ title: rec.title, status: rec.status });
    setEditVisible(true);
  };

  const submitEdit = async (values: any) => {
    try {
      if (!editRecord) return;
      setEditSubmitting(true);
      await updateDocument(String(editRecord.id || ""), {
        title: values.title,
        status: values.status,
      });
      Message.success(t("common.success", { _: "操作成功" }));
      setEditVisible(false);
      setEditRecord(null);
      fetchDocs();
    } catch (e: any) {
      Message.error(e?.message || t("common.error", { _: "操作失败" }));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(String(id));
      Message.success(
        t("userManagement.messages.deleteSuccess", { _: "删除成功" }),
      );
      fetchDocs();
    } catch (e: any) {
      Message.error(
        e?.message ||
          t("userManagement.messages.deleteError", { _: "删除失败" }),
      );
    }
  };

  const columns = [
    {
      title: t("rag.ui.columns.name", { _: "名称" }),
      dataIndex: "title",
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: t("rag.ui.columns.type", { _: "类型" }),
      dataIndex: "type",
      width: 140,
    },
    {
      title: t("rag.ui.columns.status", { _: "状态" }),
      dataIndex: "status",
      render: (s: string) => (
        <Tag color={s === "ready" ? "green" : "orangered"}>
          {s === "ready"
            ? t("rag.ui.status.ready", { _: "已完成" })
            : t("rag.ui.status.processing", { _: "解析中" })}
        </Tag>
      ),
      width: 120,
    },
    {
      title: t("rag.ui.columns.uploadedAt", { _: "上传时间" }),
      dataIndex: "upload_time",
      render: (v: string) => (v ? new Date(v).toLocaleString() : ""),
      width: 180,
    },
    {
      title: t("rag.ui.columns.operations", { _: "操作" }),
      dataIndex: "operations",
      render: (_: any, record: ListRagDocsNameSpace.ListRagDocsResult) => (
        <Space>
          <Button icon={<IconEye />} onClick={() => openDetail(record)}>
            {t("rag.ui.columns.view", { _: "查看详情" })}
          </Button>
          <Button icon={<IconEdit />} onClick={() => openEdit(record)}>
            {t("rag.ui.columns.edit", { _: "修改" })}
          </Button>
          <Popconfirm
            title={t("rag.ui.columns.deleteConfirm", {
              _: "确认删除该文档吗？",
            })}
            onOk={() => handleDelete(String(record.id || ""))}
          >
            <Button status="danger" icon={<IconDelete />}>
              {t("rag.ui.columns.delete", { _: "删除" })}
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 280,
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
        </Space>
        <Button type="primary" icon={<IconUpload />} onClick={openUploadPage}>
          {t("rag.ui.tabs.upload", { _: "上传文档" })}
        </Button>
      </div>
      <Card title={<Title title={t("rag.title")} />} bordered>
        <Space style={{ marginBottom: 16 }}>
          <Input
            allowClear
            style={{ width: 280 }}
            placeholder={t("rag.ui.searchPlaceholder", { _: "按名称搜索" })}
            value={query}
            onChange={setQuery}
          />
          <Select value={status} onChange={setStatus} style={{ width: 180 }}>
            {STATUS_OPTIONS.map((s) => (
              <Select.Option key={s} value={s}>
                {s === "all"
                  ? t("rag.ui.categories.all", { _: "全部" })
                  : s === "processing"
                    ? t("rag.ui.status.processing", { _: "解析中" })
                    : t("rag.ui.status.ready", { _: "已完成" })}
              </Select.Option>
            ))}
          </Select>
          <Button icon={<IconRefresh />} onClick={fetchDocs}>
            {t("rag.ui.refresh", { _: "刷新" })}
          </Button>
          <Space style={{ marginLeft: 12 }}>
            <span>
              {t("rag.ui.stats.total", { _: "总计" })}: {stats.total}
            </span>
            <span>
              {t("rag.ui.stats.processing", { _: "解析中" })}:{" "}
              {stats.processing}
            </span>
            <span>
              {t("rag.ui.stats.ready", { _: "已完成" })}: {stats.ready}
            </span>
          </Space>
        </Space>
        <Table
          loading={loading}
          columns={columns as any}
          data={docs}
          rowKey="id"
          pagination={false}
        />
        {!loading && docs.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--color-text-3)",
              padding: "24px 0",
            }}
          >
            {t("rag.msg.loadFail", { _: "加载失败" })}
          </div>
        )}

        <Modal
          title={t("rag.ui.columns.view", { _: "查看详情" })}
          visible={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
        >
          {detailRecord && (
            <div className="space-y-2">
              <div>
                {t("rag.ui.columns.name", { _: "名称" })}: {detailRecord.title}
              </div>
              <div>
                {t("rag.ui.columns.type", { _: "类型" })}: {detailRecord.type}
              </div>
              <div>
                {t("rag.ui.columns.status", { _: "状态" })}:{" "}
                {detailRecord.status === "ready"
                  ? t("rag.ui.status.ready", { _: "已完成" })
                  : t("rag.ui.status.processing", { _: "解析中" })}
              </div>
              <div>
                {t("rag.ui.columns.uploadedAt", { _: "上传时间" })}:{" "}
                {detailRecord.upload_time
                  ? new Date(detailRecord.upload_time).toLocaleString()
                  : ""}
              </div>
            </div>
          )}
        </Modal>

        <Modal
          title={t("rag.ui.columns.edit", { _: "修改" })}
          visible={editVisible}
          onCancel={() => setEditVisible(false)}
          onOk={() => editForm.submit()}
          confirmLoading={editSubmitting}
        >
          <Form form={editForm} layout="vertical" onSubmit={submitEdit}>
            <Form.Item
              label={t("rag.ui.columns.name", { _: "名称" })}
              field="title"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={t("rag.ui.columns.status", { _: "状态" })}
              field="status"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="processing">
                  {t("rag.ui.status.processing", { _: "解析中" })}
                </Select.Option>
                <Select.Option value="ready">
                  {t("rag.ui.status.ready", { _: "已完成" })}
                </Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default RagPage;

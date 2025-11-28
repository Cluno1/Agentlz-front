/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Title, useTranslate, useCreatePath } from "react-admin";
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
  Popover,
  Switch,
} from "@arco-design/web-react";
import {
  IconUpload,
  IconRefresh,
  IconSearch,
  IconEdit,
  IconDelete,
  IconEye,
} from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";
import {
  listDocuments,
  updateDocument,
  deleteDocument,
} from "../../data/api/rag";
import type { ListRagDocsNameSpace } from "../../data/api/rag/type";
import { useDarkMode } from "../../data/hook/useDark";

const STATUS_OPTIONS: Array<string | "all"> = ["all", "processing", "ready"];

const RagPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const createPath = useCreatePath();
  const { cardColorStyle } = useDarkMode();
  const [docs, setDocs] = useState<ListRagDocsNameSpace.ListRagDocsResult[]>(
    [],
  );
  const [query, setQuery] = useState<string>("");
  const [tagQuery, setTagQuery] = useState<string>("");
  const [descriptionQuery, setDescriptionQuery] = useState<string>("");
  const [status, setStatus] = useState<string | "all">("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [detailRecord] =
    useState<ListRagDocsNameSpace.ListRagDocsResult | null>(null);
  const [editVisible, setEditVisible] = useState<boolean>(false);
  const [editRecord, setEditRecord] =
    useState<ListRagDocsNameSpace.ListRagDocsResult | null>(null);
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editForm] = Form.useForm();
  const [scope, setScope] = useState<"self" | "tenant" | "system">("tenant");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [sortField, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, scope, page, pageSize, sortField, sortOrder]);

  const openUploadPage = () => {
    navigate("/rag/upload");
  };

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const resp = await listDocuments({
        page,
        perPage: pageSize,
        sortField,
        sortOrder,
        filter: {
          q: query,
          tags: tagQuery,
          description: descriptionQuery,
        },
        type: scope,
      });
      const rows = resp.data || [];
      const filtered =
        status === "all" ? rows : rows.filter((d) => d.status === status);
      setDocs(filtered);
      setTotal(resp.total || filtered.length);
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
      const to = createPath({ resource: "rag", type: "show", id: rec.id });
      navigate(to);
    } catch (e: any) {
      Message.error(e?.message || t("common.error", { _: "操作失败" }));
    }
  };

  const openEdit = (rec: ListRagDocsNameSpace.ListRagDocsResult) => {
    setEditRecord(rec);
    const tagsStr = Array.isArray(rec.tags)
      ? (rec.tags as string[]).join(",")
      : (rec.tags as string) || "";
    editForm.setFieldsValue({
      tags: tagsStr,
      description: rec.description || "",
      disabled: Boolean((rec as any).disabled),
    });
    setEditVisible(true);
  };

  const submitEdit = async (values: any) => {
    try {
      if (!editRecord) return;
      setEditSubmitting(true);
      const tagsInput = values.tags;
      const tagsArray = Array.isArray(tagsInput)
        ? tagsInput
        : String(tagsInput || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      await updateDocument(String(editRecord.id || ""), {
        tags: tagsArray.length ? tagsArray : undefined,
        description: values.description ?? undefined,
        disabled: values.disabled ?? undefined,
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

  const handlePageChange = (current: number) => {
    setPage(current);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1); // Reset to first page when page size changes
  };

  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === "asc" ? "ASC" : "DESC");
    }
  };

  const columns = [
    {
      title: t("rag.ui.columns.name", { _: "名称" }),
      dataIndex: "title",
      sorter: true,
      width: 150,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: t("rag.ui.columns.type", { _: "类型" }),
      dataIndex: "type",
      sorter: true,
      width: 100,
    },
    {
      title: t("rag.ui.columns.status", { _: "状态" }),
      dataIndex: "status",
      sorter: true,
      render: (s: string) => (
        <Tag color={s === "ready" ? "green" : "orangered"}>{s}</Tag>
      ),
      width: 100,
    },
    {
      title: t("rag.ui.columns.uploadedBy", { _: "上传者" }),
      dataIndex: "uploaded_by_user_name",
      render: (v: string, record: ListRagDocsNameSpace.ListRagDocsResult) => (
        <Space>
          {record.uploaded_by_user_avatar && (
            <Popover
              content={
                <div style={{ padding: "8px" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <img
                      src={record.uploaded_by_user_avatar}
                      alt="avatar"
                      style={{ width: 48, height: 48, borderRadius: "50%" }}
                    />
                  </div>
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    {v || record.uploaded_by_user_username}
                  </div>
                  <div
                    style={{ color: "var(--color-text-2)", fontSize: "12px" }}
                  >
                    {record.uploaded_by_user_username}
                  </div>
                  {record.uploaded_by_user_email && (
                    <div
                      style={{
                        color: "var(--color-text-2)",
                        fontSize: "12px",
                        marginTop: "4px",
                      }}
                    >
                      {record.uploaded_by_user_email}
                    </div>
                  )}
                </div>
              }
              trigger="hover"
              position="top"
            >
              {record.uploaded_by_user_avatar ? (
                <img
                  src={record.uploaded_by_user_avatar}
                  alt="avatar"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                />
              ) : (
                <span>{v || record.uploaded_by_user_username}</span>
              )}
            </Popover>
          )}
        </Space>
      ),
      width: 80,
    },
    {
      title: t("rag.ui.columns.tenant", { _: "租户" }),
      dataIndex: "tenant_name",
      width: 120,
    },
    {
      title: t("rag.ui.columns.tags", { _: "标签" }),
      dataIndex: "tags",
      sorter: true,
      render: (v: string | string[]) => {
        if (!v) return null;
        const tags = typeof v === "string" ? v.split(",") : v;
        return (
          <Space wrap>
            {tags.map((tag, index) => (
              <Tag key={index} size="small">
                {tag.trim()}
              </Tag>
            ))}
          </Space>
        );
      },
      width: 200,
    },
    {
      title: t("rag.ui.columns.description", { _: "描述" }),
      dataIndex: "description",
      render: (v: string) => v || "-",
      width: 200,
    },
    {
      title: t("rag.ui.columns.uploadedAt", { _: "上传时间" }),
      dataIndex: "upload_time",
      sorter: true,
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
      width: 180,
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
      <Card
        title={<Title title={t("rag.title")} />}
        bordered
        style={{ ...cardColorStyle }}
      >
        <Space style={{ marginBottom: 16 }}>
          <Input
            allowClear
            style={{ width: 280 }}
            placeholder={t("rag.ui.searchPlaceholder", { _: "按名称搜索" })}
            value={query}
            onChange={setQuery}
            onPressEnter={fetchDocs}
          />
          <Input
            allowClear
            style={{ width: 200 }}
            placeholder={t("rag.ui.searchTagPlaceholder", { _: "按标签搜索" })}
            value={tagQuery}
            onChange={setTagQuery}
            onPressEnter={fetchDocs}
          />
          <Input
            allowClear
            style={{ width: 200 }}
            placeholder={t("rag.ui.searchDescriptionPlaceholder", {
              _: "按描述搜索",
            })}
            value={descriptionQuery}
            onChange={setDescriptionQuery}
            onPressEnter={fetchDocs}
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
          <Button type="primary" icon={<IconSearch />} onClick={fetchDocs}>
            {t("rag.ui.search", { _: "搜索" })}
          </Button>
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
        {!loading && docs.length === 0 && (
          <div
            style={{
              textAlign: "center",
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
                {t("rag.ui.columns.tenant", { _: "租户" })}:{" "}
                {detailRecord.tenant_name}
              </div>
              <div>
                {t("rag.ui.columns.uploadedBy", { _: "上传者" })}:{" "}
                {detailRecord.uploaded_by_user_name} ({" "}
                {detailRecord.uploaded_by_user_username})
              </div>
              <div>
                {t("rag.ui.columns.tags", { _: "标签" })}: {detailRecord.tags}
              </div>
              <div>
                {t("rag.ui.columns.description", { _: "描述" })}:{" "}
                {detailRecord.description || "-"}
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
              label={t("rag.ui.columns.tags", { _: "标签" })}
              field="tags"
            >
              <Input
                placeholder={t("rag.ui.searchTagPlaceholder", {
                  _: "按标签搜索",
                })}
              />
            </Form.Item>
            <Form.Item
              label={t("rag.ui.columns.description", { _: "描述" })}
              field="description"
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item
              label={t("rag.ui.columns.disabled", { _: "停用" })}
              field="disabled"
              triggerPropName="checked"
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default RagPage;

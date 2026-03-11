import React, { useEffect, useMemo, useState } from "react";
import { Title, useGetIdentity, useTranslate } from "react-admin";
import {
  Button,
  Card,
  Form,
  Input,
  Message,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../data/api/announcement";
import type { ListAnnouncementsNameSpace } from "../../data/api/announcement/type";

type AnnouncementRow = ListAnnouncementsNameSpace.ListAnnouncementsResult;
type AnnouncementFormValues = {
  title: string;
  content?: string;
  disabled?: boolean;
};

export const SystemManagement = () => {
  const t = useTranslate();
  const { identity } = useGetIdentity();
  const tenantKey = import.meta.env.VITE_TENANT_ID as string;
  const tenantId = localStorage.getItem(tenantKey) || "default";
  const isAdmin = String(identity?.role || "") === "admin";
  const canSystem = isAdmin && tenantId === "system";
  const canTenant = isAdmin && tenantId !== "default" && tenantId !== "system";
  const initialScope = canSystem ? "system" : canTenant ? "tenant" : "tenant";
  const [scope, setScope] = useState<"system" | "tenant">(initialScope);
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [form] = Form.useForm();

  const canView = useMemo(() => canSystem || canTenant, [canSystem, canTenant]);

  const fetchList = React.useCallback(
    async (resetPage?: boolean) => {
      if (!canView) return;
      const nextPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
      try {
        setLoading(true);
        const resp = await listAnnouncements({
          page: nextPage,
          perPage: pageSize,
          sortField: "id",
          sortOrder: "DESC",
          filter: { q: keyword },
          type: scope,
        });
        setRows(resp.data || []);
        setTotal(resp.total || 0);
      } catch {
        Message.error(t("system.msg.loadFail", { _: "加载失败" }));
      } finally {
        setLoading(false);
      }
    },
    [canView, page, pageSize, keyword, scope, t],
  );

  useEffect(() => {
    fetchList(true);
  }, [fetchList, scope]);

  useEffect(() => {
    fetchList();
  }, [page, pageSize, fetchList]);

  const openCreate = () => {
    setModalMode("create");
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ title: "", content: "", disabled: false });
    setModalVisible(true);
  };

  const openEdit = (row: AnnouncementRow) => {
    setModalMode("edit");
    setEditing(row);
    form.setFieldsValue({
      title: row.title,
      content: row.content,
      disabled: !!row.disabled,
    });
    setModalVisible(true);
  };

  const submitForm = async (values: AnnouncementFormValues) => {
    try {
      if (modalMode === "create") {
        const tid = scope === "system" ? "system" : tenantId;
        await createAnnouncement({
          tenant_id: tid,
          title: values.title,
          content: values.content,
          disabled: values.disabled,
        });
        Message.success(t("system.msg.createOk", { _: "创建成功" }));
      } else if (editing?.id) {
        await updateAnnouncement(Number(editing.id), {
          title: values.title,
          content: values.content,
          disabled: values.disabled,
        });
        Message.success(t("system.msg.updateOk", { _: "更新成功" }));
      }
      setModalVisible(false);
      fetchList();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? (e as { message?: string }).message
          : undefined;
      Message.error(msg || t("system.msg.saveFail", { _: "保存失败" }));
    }
  };

  const handleDelete = async (row: AnnouncementRow) => {
    try {
      await deleteAnnouncement(Number(row.id));
      Message.success(t("system.msg.deleteOk", { _: "删除成功" }));
      fetchList();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? (e as { message?: string }).message
          : undefined;
      Message.error(msg || t("system.msg.deleteFail", { _: "删除失败" }));
    }
  };

  const columns: TableColumnProps<AnnouncementRow>[] = [
    {
      title: t("system.announcement.title", { _: "标题" }),
      dataIndex: "title",
      width: 220,
    },
    {
      title: t("system.announcement.content", { _: "内容" }),
      dataIndex: "content",
      render: (val: string) => (
        <Typography.Paragraph ellipsis={{ rows: 2, expandable: false }}>
          {val || "-"}
        </Typography.Paragraph>
      ),
    },
    {
      title: t("system.announcement.status", { _: "状态" }),
      dataIndex: "disabled",
      width: 120,
      render: (val: boolean) =>
        val ? (
          <Tag color="red">{t("common.disabled", { _: "停用" })}</Tag>
        ) : (
          <Tag color="green">{t("common.enabled", { _: "启用" })}</Tag>
        ),
    },
    {
      title: t("system.announcement.updatedAt", { _: "更新时间" }),
      dataIndex: "updated_at",
      width: 180,
    },
    {
      title: t("system.announcement.action", { _: "操作" }),
      dataIndex: "actions",
      width: 180,
      render: (_: unknown, row: AnnouncementRow) => (
        <Space>
          <Button size="mini" onClick={() => openEdit(row)}>
            {t("common.edit", { _: "编辑" })}
          </Button>
          <Popconfirm
            title={t("common.confirmDelete", { _: "确认删除？" })}
            onOk={() => handleDelete(row)}
          >
            <Button size="mini" status="danger">
              {t("common.delete", { _: "删除" })}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!canView) {
    return (
      <div>
        <Title title={t("system.title", { _: "系统管理" })} />
        <Card>
          <Typography.Text>
            {t("system.msg.noPermission", { _: "无权限访问" })}
          </Typography.Text>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title title={t("system.title", { _: "系统管理" })} />
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Tabs
            activeTab={scope}
            onChange={(key) =>
              setScope((key as "system" | "tenant") || "tenant")
            }
            type="line"
          >
            {canSystem && (
              <Tabs.TabPane
                key="system"
                title={t("system.announcement.system", { _: "系统公告" })}
              />
            )}
            {canTenant && (
              <Tabs.TabPane
                key="tenant"
                title={t("system.announcement.tenant", { _: "租户公告" })}
              />
            )}
          </Tabs>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <Input
                allowClear
                style={{ width: 240 }}
                placeholder={t("common.search", { _: "搜索" })}
                value={keyword}
                onChange={setKeyword}
                onPressEnter={() => fetchList(true)}
              />
              <Button onClick={() => fetchList(true)}>
                {t("common.search", { _: "搜索" })}
              </Button>
            </Space>
            <Button type="primary" onClick={openCreate}>
              {t("system.announcement.create", { _: "新建公告" })}
            </Button>
          </Space>
          <Table
            loading={loading}
            columns={columns}
            data={rows}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total,
              showTotal: true,
              onChange: (p) => setPage(p),
              onPageSizeChange: (s) => setPageSize(s),
            }}
          />
        </Space>
      </Card>

      <Modal
        visible={modalVisible}
        title={
          modalMode === "create"
            ? t("system.announcement.create", { _: "新建公告" })
            : t("system.announcement.edit", { _: "编辑公告" })
        }
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onSubmit={submitForm}>
          <Form.Item
            label={t("system.announcement.title", { _: "标题" })}
            field="title"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t("system.announcement.content", { _: "内容" })}
            field="content"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            label={t("system.announcement.status", { _: "状态" })}
            field="disabled"
            triggerPropName="checked"
          >
            <Switch
              checkedText={t("common.disabled", { _: "停用" })}
              uncheckedText={t("common.enabled", { _: "启用" })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from "react";
import { Title, usePermissions, useTranslate } from "react-admin";
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
  Tag,
  Typography,
} from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import {
  listTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from "../../data/api/system/tenant";
import type { ListTenantsNameSpace } from "../../data/api/system/tenant/type";

type TenantRow = ListTenantsNameSpace.ListTenantsResult;
type TenantFormValues = {
  id?: string;
  name: string;
  disabled?: boolean;
};

const TenantManagement: React.FC = () => {
  const t = useTranslate();
  const { permissions } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<TenantRow | null>(null);
  const [form] = Form.useForm();

  const tenantId =
    localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default";
  const isSuperAdmin = useMemo(
    () =>
      permissions === "admin" &&
      (tenantId === "system" || tenantId === "default"),
    [permissions, tenantId],
  );

  const fetchList = React.useCallback(
    async (resetPage?: boolean) => {
      if (!isSuperAdmin) return;
      const nextPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
      try {
        setLoading(true);
        const resp = await listTenants({
          page: nextPage,
          perPage: pageSize,
          sortField: "id",
          sortOrder: "DESC",
          filter: { q: keyword },
        });
        setRows(resp.data || []);
        setTotal(resp.total || 0);
      } catch {
        Message.error(t("system.msg.loadFail", { _: "加载失败" }));
      } finally {
        setLoading(false);
      }
    },
    [isSuperAdmin, page, pageSize, keyword, t],
  );

  useEffect(() => {
    fetchList(true);
  }, [fetchList]);

  useEffect(() => {
    fetchList();
  }, [page, pageSize, fetchList]);

  const openCreate = () => {
    setModalMode("create");
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ id: "", name: "", disabled: false });
    setModalVisible(true);
  };

  const openEdit = (row: TenantRow) => {
    setModalMode("edit");
    setEditing(row);
    form.setFieldsValue({
      id: row.id,
      name: row.name,
      disabled: !!row.disabled,
    });
    setModalVisible(true);
  };

  const submitForm = async (values: TenantFormValues) => {
    try {
      if (modalMode === "create") {
        await createTenant({
          id: values.id || undefined,
          name: values.name,
          disabled: values.disabled,
        });
        Message.success(t("system.msg.createOk", { _: "创建成功" }));
      } else if (editing?.id) {
        await updateTenant(String(editing.id), {
          name: values.name,
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

  const handleDelete = async (row: TenantRow) => {
    try {
      await deleteTenant(String(row.id));
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

  const columns: TableColumnProps<TenantRow>[] = [
    {
      title: t("system.tenant.columns.id", { _: "租户ID" }),
      dataIndex: "id",
      width: 220,
    },
    {
      title: t("system.tenant.columns.name", { _: "名称" }),
      dataIndex: "name",
      width: 180,
    },
    {
      title: t("system.tenant.columns.status", { _: "状态" }),
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
      title: t("system.tenant.columns.createdAt", { _: "创建时间" }),
      dataIndex: "created_at",
      width: 180,
    },
    {
      title: t("system.tenant.columns.updatedAt", { _: "更新时间" }),
      dataIndex: "updated_at",
      width: 180,
    },
    {
      title: t("system.tenant.columns.action", { _: "操作" }),
      dataIndex: "actions",
      width: 180,
      render: (_: unknown, row: TenantRow) => (
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

  if (!isSuperAdmin) {
    return (
      <div>
        <Title title={t("system.tenant.title", { _: "租户管理" })} />
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
      <Title title={t("system.tenant.title", { _: "租户管理" })} />
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
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
              {t("system.tenant.create", { _: "新建租户" })}
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
            ? t("system.tenant.create", { _: "新建租户" })
            : t("system.tenant.edit", { _: "编辑租户" })
        }
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onSubmit={submitForm}>
          {modalMode === "create" && (
            <Form.Item
              label={t("system.tenant.columns.id", { _: "租户ID" })}
              field="id"
            >
              <Input
                placeholder={t("system.tenant.idOptional", {
                  _: "可选，留空自动生成",
                })}
              />
            </Form.Item>
          )}
          <Form.Item
            label={t("system.tenant.columns.name", { _: "名称" })}
            field="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t("system.tenant.columns.status", { _: "状态" })}
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

export default TenantManagement;

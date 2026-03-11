/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { usePermissions, useTranslate } from "react-admin";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Message,
  Select,
  Switch,
} from "@arco-design/web-react";
import { getUser, updateUser } from "../../../data/api/user";
import { listTenants } from "../../../data/api/system/tenant";

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantOptions, setTenantOptions] = useState<string[]>([]);
  const [tenantLoading, setTenantLoading] = useState(false);
  const t = useTranslate();
  const { permissions } = usePermissions();
  const currentTenantId =
    localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default";
  const isSuperAdmin =
    permissions === "admin" &&
    (currentTenantId === "system" || currentTenantId === "default");

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const record = await getUser(id);
        if (record) {
          form.setFieldsValue({
            username: record.username,
            email: record.email,
            fullName: record.full_name ?? record.fullName,
            avatar: record.avatar,
            role: record.role,
            disabled: record.disabled,
            createdAt: record.created_at ?? record.createdAt,
            tenant_id: record.tenant_id,
          });
        }
        setError(null);
      } catch (e: any) {
        setError(e?.message || t("userManagement.editPage.messages.loadError"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, form, t]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      try {
        setTenantLoading(true);
        const resp = await listTenants({
          page: 1,
          perPage: 100,
          sortField: "id",
          sortOrder: "ASC",
        });
        const ids = (resp.data || [])
          .map((r: any) => r.id)
          .filter(Boolean)
          .map((v: any) => String(v));
        setTenantOptions(ids);
      } catch {
        setTenantOptions([]);
      } finally {
        setTenantLoading(false);
      }
    })();
  }, [isSuperAdmin]);

  const handleSubmit = async (values: any) => {
    try {
      if (!id) return;
      setSaving(true);
      const payload = {
        username: values.username,
        email: values.email,
        full_name: values.fullName,
        avatar: values.avatar,
        role: values.role,
        disabled: values.disabled,
        tenant_id: values.tenant_id,
      };
      await updateUser(id, payload);
      Message.success(t("userManagement.editPage.messages.saveSuccess"));
      navigate("/user-management");
    } catch (e: any) {
      Message.error(
        e?.message || t("userManagement.editPage.messages.saveError"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title={t("userManagement.editPage.title")}>
      {loading && <p>{t("common.loading")}</p>}
      {error && <p>{error}</p>}
      {!loading && !error && (
        <Form form={form} onSubmit={handleSubmit} layout="vertical">
          <Form.Item
            label={t("userManagement.editPage.fields.username")}
            field="username"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t("userManagement.editPage.fields.email")}
            field="email"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t("userManagement.editPage.fields.fullName")}
            field="fullName"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t("userManagement.editPage.fields.role")}
            field="role"
          >
            <Select style={{ width: "100%" }} allowClear>
              <Select.Option value="admin">
                {t("user.role.admin")}
              </Select.Option>
              <Select.Option value="user">{t("user.role.user")}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label={t("userManagement.editPage.fields.avatar")}
            field="avatar"
          >
            <Input placeholder="https://avatars.githubusercontent.com/u/12345?v=4" />
          </Form.Item>
          {isSuperAdmin && (
            <Form.Item
              label={t("userManagement.editPage.fields.tenant", { _: "租户" })}
              field="tenant_id"
            >
              <Select
                style={{ width: "100%" }}
                allowClear
                showSearch
                loading={tenantLoading}
                filterOption={false}
                onSearch={async (value) => {
                  if (!value) return;
                  try {
                    setTenantLoading(true);
                    const resp = await listTenants({
                      page: 1,
                      perPage: 100,
                      sortField: "id",
                      sortOrder: "ASC",
                      filter: { q: value },
                    });
                    const ids = (resp.data || [])
                      .map((r: any) => r.id)
                      .filter(Boolean)
                      .map((v: any) => String(v));
                    setTenantOptions(ids);
                  } finally {
                    setTenantLoading(false);
                  }
                }}
              >
                {tenantOptions.map((tid) => (
                  <Select.Option key={tid} value={tid}>
                    {tid}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item
            label={t("userManagement.editPage.fields.disabled")}
            field="disabled"
            triggerPropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label={t("userManagement.editPage.fields.createdAt")}
            field="createdAt"
          >
            <Input disabled />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              {t("common.save")}
            </Button>
          </Form.Item>
        </Form>
      )}
    </Card>
  );
};

export default UserEdit;

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useTranslate, usePermissions } from "react-admin";
import {
  Card,
  Form,
  Input,
  Button,
  Message,
  Select,
  Switch,
} from "@arco-design/web-react";
import { listTenants } from "../../../data/api/system/tenant";
import { createUser } from "../../../data/api/user";

const UserCreate = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [tenantOptions, setTenantOptions] = useState<string[]>([]);
  const [tenantLoading, setTenantLoading] = useState(false);
  const t = useTranslate();
  const { permissions } = usePermissions();
  const tenantId =
    localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default";
  const isSuperAdmin = useMemo(
    () =>
      permissions === "admin" &&
      (tenantId === "system" || tenantId === "default"),
    [permissions, tenantId],
  );

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
      setSubmitting(true);
      // Map form values to match backend API requirements
      const payload = {
        username: values.username,
        email: values.email,
        password: values.password,
        full_name: values.fullName, // Map to snake_case for backend
        avatar: values.avatar,
        role: values.role || "user",
        disabled: values.disabled || false,
        created_by_id: null, // You can modify this if you want to track who created the user
        tenant_id: values.tenant_id,
      };

      await createUser(payload);
      Message.success(t("userManagement.createPage.messages.createSuccess"));
      window.history.back();
    } catch (e: any) {
      Message.error(
        e?.message || t("userManagement.createPage.messages.createError"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title={t("userManagement.createPage.title")}>
      <Form form={form} onSubmit={handleSubmit} layout="vertical">
        <Form.Item
          label={t("userManagement.createPage.fields.username")}
          field="username"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={t("userManagement.createPage.fields.email")}
          field="email"
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={t("userManagement.createPage.fields.fullName")}
          field="fullName"
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={t("userManagement.createPage.fields.role")}
          field="role"
        >
          <Select style={{ width: "100%" }} allowClear>
            <Select.Option value="admin">{t("user.role.admin")}</Select.Option>
            <Select.Option value="user">{t("user.role.user")}</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          label={t("userManagement.createPage.fields.avatar")}
          field="avatar"
        >
          <Input placeholder="https://avatars.githubusercontent.com/u/12345?v=4" />
        </Form.Item>
        {isSuperAdmin && (
          <Form.Item
            label={t("userManagement.createPage.fields.tenant", { _: "租户" })}
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
          label={t("userManagement.createPage.fields.disabled")}
          field="disabled"
          triggerPropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          label={t("userManagement.createPage.fields.password")}
          field="password"
          rules={[{ required: true }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {t("userManagement.createPage.submit")}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UserCreate;

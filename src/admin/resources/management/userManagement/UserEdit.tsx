/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useTranslate } from "react-admin";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Message, Select, Switch } from "@arco-design/web-react";
import usersApi from "../../../api/users";

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslate();

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const record = await usersApi.getUser(id);
        if (record) {
          form.setFieldsValue(record);
        }
        setError(null);
      } catch (e: any) {
        setError(e?.message || t("userManagement.editPage.messages.loadError"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, form]);

  const handleSubmit = async (values: any) => {
    try {
      if (!id) return;
      setSaving(true);
      await usersApi.updateUser(id, values);
      Message.success(t("userManagement.editPage.messages.saveSuccess"));
      navigate("/user-management");
    } catch (e: any) {
      Message.error(e?.message || t("userManagement.editPage.messages.saveError"));
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
          <Form.Item label={t("userManagement.editPage.fields.email")} field="email">
            <Input />
          </Form.Item>
          <Form.Item label={t("userManagement.editPage.fields.fullName")} field="fullName">
            <Input />
          </Form.Item>
          <Form.Item label={t("userManagement.editPage.fields.role")} field="role">
            <Select style={{ width: "100%" }} allowClear>
              <Select.Option value="admin">{t("user.role.admin")}</Select.Option>
              <Select.Option value="user">{t("user.role.user")}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={t("userManagement.editPage.fields.avatar")} field="avatar">
            <Input placeholder="https://avatars.githubusercontent.com/u/12345?v=4" />
          </Form.Item>
          <Form.Item label={t("userManagement.editPage.fields.disabled")} field="disabled" triggerPropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label={t("userManagement.editPage.fields.createdAt")} field="createdAt">
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useTranslate } from "react-admin";
import {
  Card,
  Form,
  Input,
  Button,
  Message,
  Select,
  Switch,
} from "@arco-design/web-react";
import usersApi from "../../../data/api/users";

const UserCreate = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslate();

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      await usersApi.createUser(values);
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

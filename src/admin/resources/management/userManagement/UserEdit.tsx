/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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
        setError(e?.message || "加载失败");
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
      Message.success("保存成功");
      navigate("/user-management");
    } catch (e: any) {
      Message.error(e?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="编辑用户">
      {loading && <p>加载中...</p>}
      {error && <p>加载出错：{error}</p>}
      {!loading && !error && (
        <Form form={form} onSubmit={handleSubmit} layout="vertical">
          <Form.Item
            label="用户名"
            field="username"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" field="email">
            <Input />
          </Form.Item>
          <Form.Item label="姓名" field="fullName">
            <Input />
          </Form.Item>
          <Form.Item label="角色" field="role">
            <Select style={{ width: "100%" }} allowClear>
              <Select.Option value="admin">admin</Select.Option>
              <Select.Option value="user">user</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="头像链接" field="avatar">
            <Input placeholder="https://avatars.githubusercontent.com/u/12345?v=4" />
          </Form.Item>
          <Form.Item label="禁用登录" field="disabled" triggerPropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="创建时间" field="createdAt">
            <Input disabled />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存
            </Button>
          </Form.Item>
        </Form>
      )}
    </Card>
  );
};

export default UserEdit;

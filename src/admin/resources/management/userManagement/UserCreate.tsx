/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, Form, Input, Button, Message, Select, Switch } from "@arco-design/web-react";
import usersApi from "../../../api/users";

const UserCreate = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      await usersApi.createUser(values);
      Message.success("创建成功");
      window.history.back();
    } catch (e: any) {
      Message.error(e?.message || "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="新建用户">
      <Form form={form} onSubmit={handleSubmit} layout="vertical">
        <Form.Item label="用户名" field="username" rules={[{ required: true }]}>
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
        <Form.Item label="密码" field="password" rules={[{ required: true }]}> 
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            创建
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UserCreate;

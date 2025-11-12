/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useLogin } from "react-admin";
import {
  Form,
  Input,
  Button,
  Card,
  Message,
  Typography,
  Link,
} from "@arco-design/web-react";
import { useNavigate } from "react-router-dom";

const FormItem = Form.Item;

export default function LoginPage() {
  const login = useLogin();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      await login({ username: values.username, password: values.password });
      Message.success("登录成功");

      // 登录成功后，react-admin 会自动跳转
    } catch (err: any) {
      Message.warning(err?.message ?? "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card style={{ width: 420 }} title="登录" bordered>
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
          <FormItem
            label="用户名"
            field="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input allowClear placeholder="请输入用户名或邮箱" />
          </FormItem>
          <FormItem
            label="密码"
            field="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password placeholder="请输入密码" allowClear />
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit" loading={loading} long>
              登录
            </Button>
          </FormItem>
          <Typography.Text type="secondary">
            还没有账号？{" "}
            <Link
              href="/register"
              onClick={(e) => {
                e.preventDefault();
                navigate("/register");
              }}
            >
              去注册
            </Link>
          </Typography.Text>
        </Form>
      </Card>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Message,
  Typography,
  Link,
} from "@arco-design/web-react";
// 认证 API：注册接口
import { register } from "../data/api/auth";
import type { RegisterNameSpace } from "../data/api/auth/type";

const FormItem = Form.Item;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  /**
   * 提交注册表单
   * 说明: 基础校验后调用后端 /v1/register 接口
   */
  const handleSubmit = async (values: {
    username: string;
    email: string;
    password: string;
    confirm: string;
  }) => {
    if (values.password.length < 4) {
      Message.warning("密码长度至少 4 位");
      return;
    }
    if (values.password !== values.confirm) {
      Message.warning("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    try {
      // 构建请求负载（类型安全）
      const payload: RegisterNameSpace.RegisterParams = {
        username: values.username,
        email: values.email,
        password: values.password,
      };
      // 调用后端注册接口
      await register(payload);
      Message.success("注册成功，请登录");
      navigate("/login?username=" + values.username);
    } catch (err: any) {
      // 错误提示（httpClient 已做统一处理，这里兜底显示 message）
      Message.warning(err?.message ?? "注册失败");
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
      <Card style={{ width: 480 }} title="注册" bordered>
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
          <FormItem
            label="用户名"
            field="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input allowClear placeholder="请输入用户名" />
          </FormItem>
          <FormItem
            label="邮箱（可选）"
            field="email"
            rules={[{ type: "email", message: "邮箱格式不正确" }]}
          >
            <Input allowClear placeholder="example@163.com" />
          </FormItem>
          <FormItem
            label="密码"
            field="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password placeholder="请输入密码" />
          </FormItem>
          <FormItem
            label="确认密码"
            field="confirm"
            rules={[
              {
                required: true,
                message: "请再次输入密码",
              },
              {
                validator: (value, cb) => {
                  if (value !== form.getFieldValue("password")) {
                    cb("两次输入的密码不一致");
                  } else {
                    cb();
                  }
                },
              },
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit" loading={loading} long>
              注册
            </Button>
          </FormItem>
          <Typography.Text type="secondary">
            已有账号？{" "}
            <Link
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              去登录
            </Link>
          </Typography.Text>
        </Form>
      </Card>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Message,
  Avatar,
} from "@arco-design/web-react";
import { useDataProvider } from "react-admin";

const ProfilePage = () => {
  const dataProvider = useDataProvider();
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await dataProvider.getProfile();
        if (profile) {
          form.setFieldsValue(profile);
        }
        setLoadError(null);
      } catch (e: any) {
        setLoadError(e?.message || "获取个人资料失败");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [dataProvider, form]);

  const handleUpdateProfile = async (values: any) => {
    try {
      setIsUpdating(true);
      await dataProvider.updateProfile({ data: values });
      Message.success("资料更新成功");
    } catch (e: any) {
      Message.error(e?.message || "更新资料出错");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setIsChangingPassword(true);
      await dataProvider.changePassword({ data: values });
      Message.success("密码修改成功");
      pwdForm.resetFields();
    } catch (e: any) {
      Message.error(e?.message || "修改密码出错");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Card title="个人资料">
      {isLoading && <p>加载中...</p>}
      {loadError && <p>获取个人资料出错：{loadError}</p>}
      {!isLoading && !loadError && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Avatar
              size={48}
              imageProps={{ src: form.getFieldValue("avatar") }}
            />
            <span>
              {form.getFieldValue("fullName") || form.getFieldValue("username")}
            </span>
          </div>
          <Form form={form} onSubmit={handleUpdateProfile}>
            <Form.Item label="用户名" field="username">
              <Input />
            </Form.Item>
            <Form.Item label="邮箱" field="email">
              <Input />
            </Form.Item>
            <Form.Item label="头像链接" field="avatar">
              <Input placeholder="https://avatars.githubusercontent.com/u/12345?v=4" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isUpdating}>
                更新资料
              </Button>
            </Form.Item>
          </Form>
          <Form form={pwdForm} onSubmit={handleChangePassword}>
            <Form.Item label="当前密码" field="currentPassword">
              <Input.Password />
            </Form.Item>
            <Form.Item label="新密码" field="newPassword">
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isChangingPassword}
              >
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </>
      )}
    </Card>
  );
};

export default ProfilePage;

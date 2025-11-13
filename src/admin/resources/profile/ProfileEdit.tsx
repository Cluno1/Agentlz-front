/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Card, Form, Input, Button, Message } from "@arco-design/web-react";
import { useDataProvider, useTranslate } from "react-admin";
import { useNavigate } from "react-router-dom";

const ProfileEdit = () => {
  const dataProvider = useDataProvider();
  const t = useTranslate();
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const navigate = useNavigate();

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
        setLoadError(e?.message || t("profile.messages.loadFail"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [dataProvider, form, t]);

  const handleUpdateProfile = async (values: any) => {
    try {
      setIsUpdating(true);
      await dataProvider.updateProfile({ data: values });
      Message.success(t("profile.messages.updateSuccess"));
      navigate("/profile");
    } catch (e: any) {
      Message.error(e?.message || t("profile.messages.updateError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setIsChangingPassword(true);
      await dataProvider.changePassword({ data: values });
      Message.success(t("profile.messages.changePwdSuccess"));
      pwdForm.resetFields();
    } catch (e: any) {
      Message.error(e?.message || t("profile.messages.changePwdError"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onCancel = () => {
    navigate("/profile");
  };

  return (
    <Card title={t("profile.editTitle")}>
      {isLoading && <p>{t("common.loading")}</p>}
      {loadError && (
        <p>
          {t("profile.messages.loadError")}: {loadError}
        </p>
      )}
      {!isLoading && !loadError && (
        <>
          <Form form={form} onSubmit={handleUpdateProfile} layout="vertical">
            <Form.Item label={t("profile.fields.username")} field="username">
              <Input />
            </Form.Item>
            <Form.Item label={t("profile.fields.email")} field="email">
              <Input />
            </Form.Item>
            <Form.Item label={t("profile.fields.fullName")} field="fullName">
              <Input />
            </Form.Item>
            <Form.Item label={t("profile.fields.avatar")} field="avatar">
              <Input
                placeholder={
                  form.getFieldValue("avatar") || t("profile.fields.avatar")
                }
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isUpdating}>
                {t("common.save")}
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={onCancel}>
                {t("common.cancel")}
              </Button>
            </Form.Item>
          </Form>
          <Card
            style={{ marginTop: 16 }}
            title={t("profile.messages.pwdTitle")}
            bordered
          >
            <Form form={pwdForm} onSubmit={handleChangePassword}>
              <Form.Item
                label={t("profile.messages.currentPassword")}
                field="currentPassword"
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                label={t("profile.messages.newPassword")}
                field="newPassword"
              >
                <Input.Password />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isChangingPassword}
                >
                  {t("profile.messages.pwdTitle")}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </>
      )}
    </Card>
  );
};

export default ProfileEdit;

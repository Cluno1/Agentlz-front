/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Message,
  Drawer,
} from "@arco-design/web-react";
import { useTranslate, useGetIdentity, useLogout } from "react-admin";
import { useNavigate } from "react-router-dom";
import { getUser, updateUser } from "../../data/api/user";
// import { profileProvider } from "../../data/provider/profileProvider";
import { useDarkMode } from "../../data/hook/useDark";

const ProfileEdit = () => {
  const t = useTranslate();
  const { identity } = useGetIdentity();
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const { isDark, textColor, cardColorStyle } = useDarkMode();
  const logout = useLogout();
  const [pwdOpen, setPwdOpen] = useState<boolean>(false);
  const inputStyle = {
    color: textColor,
    background: isDark ? "#222" : undefined,
    borderColor: isDark ? "#444" : undefined,
  } as const;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        if (!identity?.id) {
          setLoadError(t("profile.messages.loadFail"));
          return;
        }
        const profile = await getUser(String(identity.id));
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
  }, [identity?.id, form, t]);

  const handleUpdateProfile = async (values: any) => {
    try {
      setIsUpdating(true);
      if (!identity?.id) throw new Error(t("profile.messages.updateError"));
      const res = await updateUser(String(identity.id), values);
      Message.success(t("profile.messages.updateSuccess"));
      localStorage.setItem(
        import.meta.env.VITE_IDENTITY_KEY,
        JSON.stringify({
          id: res?.id || "",
          fullName: res?.full_name || res?.username || "",
          disabled: !!res?.disabled,
          email: res?.email || "",
          username: res?.username || "",
          avatar: res?.avatar || "",
          role: res?.role || "user",
          createdAt: res?.created_at || "",
          createdById: res?.created_by_id || "",
        }),
      );
      window.location.reload();
    } catch (e: any) {
      Message.error(e?.message || t("profile.messages.updateError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (values: {
    new_password: string;
    current_password: string;
    again_new_password: string;
  }) => {
    try {
      setIsChangingPassword(true);
      if (!identity?.id) throw new Error(t("profile.messages.updateError"));
      if (values.new_password !== values.again_new_password) {
        throw new Error(t("profile.messages.passwordNotMatch"));
      }
      // await profileProvider.changePassword({ data: values });
      await updateUser(String(identity.id), {
        current_password: values.current_password,
        new_password: values.new_password,
      });
      Message.success(t("profile.messages.changePwdSuccess"));
      logout();
      pwdForm.resetFields();
      setPwdOpen(false);
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
    <Card
      title={t("profile.editTitle")}
      bordered={false}
      style={cardColorStyle}
    >
      {isLoading && <p style={{ color: textColor }}>{t("common.loading")}</p>}
      {loadError && (
        <p style={{ color: textColor }}>
          {t("profile.messages.loadError")}: {loadError}
        </p>
      )}
      {!isLoading && !loadError && (
        <>
          <Form form={form} onSubmit={handleUpdateProfile} layout="vertical">
            <Form.Item
              label={
                <span style={{ color: textColor }}>
                  {t("profile.fields.username")}
                </span>
              }
              field="username"
            >
              <Input style={inputStyle} />
            </Form.Item>
            <Form.Item
              label={
                <span style={{ color: textColor }}>
                  {t("profile.fields.email")}
                </span>
              }
              field="email"
            >
              <Input style={inputStyle} />
            </Form.Item>
            <Form.Item
              label={
                <span style={{ color: textColor }}>
                  {t("profile.fields.fullName")}
                </span>
              }
              field="full_name"
            >
              <Input style={inputStyle} />
            </Form.Item>
            <Form.Item
              label={
                <span style={{ color: textColor }}>
                  {t("profile.fields.avatar")}
                </span>
              }
              field="avatar"
            >
              <Input
                placeholder={
                  form.getFieldValue("avatar") || t("profile.fields.avatar")
                }
                style={inputStyle}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isUpdating}>
                {t("common.save")}
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={onCancel}>
                {t("common.cancel")}
              </Button>
              <Button
                style={{ marginLeft: 8 }}
                onClick={() => setPwdOpen(true)}
              >
                {t("profile.messages.pwdTitle")}
              </Button>
            </Form.Item>
          </Form>
          <Drawer
            style={cardColorStyle}
            title={
              <span style={{ color: textColor }}>
                {t("profile.messages.pwdTitle")}
              </span>
            }
            visible={pwdOpen}
            width={420}
            placement="right"
            onCancel={() => setPwdOpen(false)}
            footer={
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="primary"
                  onClick={() => pwdForm.submit()}
                  loading={isChangingPassword}
                >
                  {t("common.save")}
                </Button>
                <Button
                  style={{ marginLeft: 8 }}
                  onClick={() => setPwdOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            }
          >
            <div style={cardColorStyle}>
              <Form
                form={pwdForm}
                onSubmit={handleChangePassword}
                layout="vertical"
              >
                <Form.Item
                  label={
                    <span style={{ color: textColor }}>
                      {t("profile.messages.currentPassword")}
                    </span>
                  }
                  field="current_password"
                >
                  <Input.Password style={inputStyle} />
                </Form.Item>
                <Form.Item
                  label={
                    <span style={{ color: textColor }}>
                      {t("profile.messages.newPassword")}
                    </span>
                  }
                  field="new_password"
                >
                  <Input.Password style={inputStyle} />
                </Form.Item>
                <Form.Item
                  label={
                    <span style={{ color: textColor }}>
                      {t("profile.messages.againNewPassword")}
                    </span>
                  }
                  field="again_new_password"
                >
                  <Input.Password style={inputStyle} />
                </Form.Item>
              </Form>
            </div>
          </Drawer>
        </>
      )}
    </Card>
  );
};

export default ProfileEdit;

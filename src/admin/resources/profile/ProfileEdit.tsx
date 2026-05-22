/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  Avatar,
  Button,
  Drawer,
  Form,
  Input,
  Message,
  Result,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { useGetIdentity, useLogout, useTranslate } from "react-admin";
import { useNavigate } from "react-router-dom";
import { getUser, updateUser } from "../../data/api/user";

const pageStyle: CSSProperties = {
  width: "100%",
  minHeight: "100%",
  color: "#1D2129",
};

const posterStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 8,
  padding: "32px 36px",
  color: "#FFFFFF",
  background: "linear-gradient(135deg, #111827 0%, #1B365D 42%, #0B7A75 100%)",
  boxShadow: "0 18px 45px rgba(17, 24, 39, 0.18)",
};

const sectionStyle: CSSProperties = {
  border: "1px solid #E5E6EB",
  borderRadius: 8,
  background: "#FFFFFF",
  padding: 22,
};

const mutedTextStyle: CSSProperties = {
  color: "#4E5969",
  lineHeight: 1.7,
};

const inputStyle: CSSProperties = {
  borderRadius: 6,
};

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
  const logout = useLogout();
  const [pwdOpen, setPwdOpen] = useState<boolean>(false);

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

  const displayName =
    form.getFieldValue("full_name") || form.getFieldValue("username") || "-";
  const avatar = form.getFieldValue("avatar");
  const initial = String(displayName || "U").slice(0, 1).toUpperCase();

  return (
    <div style={pageStyle}>
      <Skeleton loading={isLoading} text={{ rows: 6 }} animation>
        {!isLoading && loadError && (
          <div style={sectionStyle}>
            <Result
              status="error"
              title={t("profile.messages.loadError")}
              subTitle={loadError}
              extra={<Button onClick={onCancel}>{t("common.cancel")}</Button>}
            />
          </div>
        )}

        {!isLoading && !loadError && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div style={posterStyle}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 24,
                  alignItems: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Space size="large" align="center">
                  <Avatar
                    size={72}
                    style={{
                      flexShrink: 0,
                      border: "2px solid rgba(255,255,255,0.72)",
                      background: "rgba(255,255,255,0.16)",
                    }}
                  >
                    {avatar ? <img src={avatar} alt={displayName} /> : initial}
                  </Avatar>
                  <div>
                    <Tag color="arcoblue" style={{ marginBottom: 14 }}>
                      PROFILE SETTINGS
                    </Tag>
                    <Typography.Title
                      heading={3}
                      style={{ color: "#FFFFFF", margin: 0, lineHeight: 1.2 }}
                    >
                      {t("profile.editTitle")}
                    </Typography.Title>
                    <Typography.Paragraph
                      style={{
                        color: "rgba(255,255,255,0.82)",
                        margin: "12px 0 0",
                        lineHeight: 1.8,
                      }}
                    >
                      {displayName} · {form.getFieldValue("email") || "-"}
                    </Typography.Paragraph>
                  </div>
                </Space>
                <Space wrap>
                  <Button
                    size="large"
                    style={{
                      color: "#FFFFFF",
                      borderColor: "rgba(255,255,255,0.42)",
                      background: "rgba(255,255,255,0.08)",
                    }}
                    onClick={() => setPwdOpen(true)}
                  >
                    {t("profile.messages.pwdTitle")}
                  </Button>
                  <Button type="primary" size="large" onClick={() => form.submit()}>
                    {t("common.save")}
                  </Button>
                </Space>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 6,
                  background:
                    "linear-gradient(90deg, #165DFF 0%, #00B42A 33%, #F7BA1E 66%, #722ED1 100%)",
                }}
              />
            </div>

            <div style={sectionStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "flex-start",
                  marginBottom: 18,
                }}
              >
                <div>
                  <Typography.Title heading={5} style={{ marginTop: 0 }}>
                    {t("profile.fields.basic")}
                  </Typography.Title>
                  <Typography.Paragraph style={mutedTextStyle}>
                    保持与仪表盘一致的信息区块风格，编辑常用账号资料。
                  </Typography.Paragraph>
                </div>
              </div>

              <Form form={form} onSubmit={handleUpdateProfile} layout="vertical">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 16,
                  }}
                >
                  <Form.Item label={t("profile.fields.username")} field="username">
                    <Input style={inputStyle} />
                  </Form.Item>
                  <Form.Item label={t("profile.fields.email")} field="email">
                    <Input style={inputStyle} />
                  </Form.Item>
                  <Form.Item label={t("profile.fields.fullName")} field="full_name">
                    <Input style={inputStyle} />
                  </Form.Item>
                  <Form.Item label={t("profile.fields.avatar")} field="avatar">
                    <Input
                      placeholder={
                        form.getFieldValue("avatar") || t("profile.fields.avatar")
                      }
                      style={inputStyle}
                    />
                  </Form.Item>
                </div>

                <Space wrap style={{ marginTop: 10 }}>
                  <Button type="primary" htmlType="submit" loading={isUpdating}>
                    {t("common.save")}
                  </Button>
                  <Button onClick={onCancel}>{t("common.cancel")}</Button>
                  <Button onClick={() => setPwdOpen(true)}>
                    {t("profile.messages.pwdTitle")}
                  </Button>
                </Space>
              </Form>
            </div>

            <Drawer
              title={t("profile.messages.pwdTitle")}
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
              <div style={sectionStyle}>
                <Form form={pwdForm} onSubmit={handleChangePassword} layout="vertical">
                  <Form.Item
                    label={t("profile.messages.currentPassword")}
                    field="current_password"
                  >
                    <Input.Password style={inputStyle} />
                  </Form.Item>
                  <Form.Item
                    label={t("profile.messages.newPassword")}
                    field="new_password"
                  >
                    <Input.Password style={inputStyle} />
                  </Form.Item>
                  <Form.Item
                    label={t("profile.messages.againNewPassword")}
                    field="again_new_password"
                  >
                    <Input.Password style={inputStyle} />
                  </Form.Item>
                </Form>
              </div>
            </Drawer>
          </Space>
        )}
      </Skeleton>
    </div>
  );
};

export default ProfileEdit;

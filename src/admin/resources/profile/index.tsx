/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  Avatar,
  Button,
  Form,
  Result,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { useGetIdentity, useTranslate } from "react-admin";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../data/api/user";
import { listTenants } from "../../data/api/system/tenant";

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

const infoCardStyle = (accent: string): CSSProperties => ({
  border: "1px solid #E5E6EB",
  borderTop: `4px solid ${accent}`,
  borderRadius: 8,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,248,250,0.9) 100%)",
  padding: 18,
  minHeight: 138,
  boxShadow: "0 8px 24px rgba(29, 33, 41, 0.06)",
});

const valueStyle: CSSProperties = {
  marginTop: 8,
  color: "#1D2129",
  fontSize: 15,
  fontWeight: 600,
  wordBreak: "break-word",
};

const ProfileShow = () => {
  const t = useTranslate();
  const { identity } = useGetIdentity();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>("");
  const navigate = useNavigate();
  const isDefaultTenant =
    (localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default") ===
    "default";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        if (!identity?.id) {
          setLoadError(t("profile.messages.loadFail"));
          return;
        }
        const profile = await getUser(identity.id as string);

        if (profile) {
          form.setFieldsValue(profile);
          try {
            const _tid = (profile as any)?.tenant_id;
            if (_tid) {
              const _tr = await listTenants({
                page: 1,
                perPage: 100,
                sortField: "id",
                sortOrder: "ASC",
              });
              const _hit = (_tr.data || []).find(
                (x: any) => String(x.id) === String(_tid),
              );
              if (_hit && _hit.name) setTenantName(String(_hit.name));
            }
          } catch (_e) {
            /* 租户名解析失败则回退显示 id */
          }
          localStorage.setItem(
            import.meta.env.VITE_IDENTITY_KEY,
            JSON.stringify({
              id: profile?.id || "",
              fullName: profile?.full_name || profile?.username || "",
              disabled: !!profile?.disabled,
              email: profile?.email || "",
              username: profile?.username || "",
              avatar: profile?.avatar || "",
              role: profile?.role || "user",
              createdAt: profile?.created_at || "",
              createdById: profile?.created_by_id || "",
            }),
          );
          localStorage.removeItem("undefined");
        }
        setLoadError(null);
      } catch (e: any) {
        setLoadError(e?.message || t("profile.messages.loadFail"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [identity, identity?.id, form, t]);

  const goEdit = () => {
    navigate("/profile/edit");
  };

  const displayName =
    form.getFieldValue("full_name") || form.getFieldValue("username") || "-";
  const username = form.getFieldValue("username") || "-";
  const email = form.getFieldValue("email") || "-";
  const role = form.getFieldValue("role") || "user";
  const roleText = role ? t(`user.role.${role}`) : "-";
  const tenantLabel = tenantName || form.getFieldValue("tenant_id") || "-";
  const accountStatus = form.getFieldValue("disabled")
    ? t("profile.disabledYes")
    : t("profile.disabledNo");
  const avatar = form.getFieldValue("avatar");
  const initial = String(displayName || username || "U").slice(0, 1).toUpperCase();

  const InfoCard = ({
    label,
    value,
    accent,
    hint,
  }: {
    label: string;
    value: string;
    accent: string;
    hint?: string;
  }) => (
    <div style={infoCardStyle(accent)}>
      <Typography.Text style={{ color: accent, fontWeight: 600 }}>
        {label}
      </Typography.Text>
      <div style={valueStyle}>{value || "-"}</div>
      {hint && (
        <Typography.Text style={{ ...mutedTextStyle, display: "block", marginTop: 8 }}>
          {hint}
        </Typography.Text>
      )}
    </div>
  );

  return (
    <div style={pageStyle}>
      <Skeleton loading={isLoading} text={{ rows: 6 }} animation>
        {!isLoading && loadError && (
          <div style={sectionStyle}>
            <Result
              status="error"
              title={t("profile.messages.loadError")}
              subTitle={loadError}
              extra={
                <Button type="primary" onClick={() => window.location.reload()}>
                  {t("common.reload")}
                </Button>
              }
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
                      PROFILE WORKSPACE
                    </Tag>
                    <Typography.Title
                      heading={3}
                      style={{ color: "#FFFFFF", margin: 0, lineHeight: 1.2 }}
                    >
                      {displayName}
                    </Typography.Title>
                    <Typography.Paragraph
                      style={{
                        color: "rgba(255,255,255,0.82)",
                        margin: "12px 0 0",
                        lineHeight: 1.8,
                      }}
                    >
                      {username} · {email}
                    </Typography.Paragraph>
                    <Space wrap style={{ marginTop: 14 }}>
                      <Tag color="arcoblue">
                        {t("profile.fields.role")}: {roleText}
                      </Tag>
                      {!isDefaultTenant && (
                        <Tag color="green">
                          {t("profile.fields.tenant")}: {tenantLabel}
                        </Tag>
                      )}
                      <Tag color={form.getFieldValue("disabled") ? "red" : "green"}>
                        {t("profile.fields.disabled")}: {accountStatus}
                      </Tag>
                    </Space>
                  </div>
                </Space>
                <Button type="primary" size="large" onClick={goEdit}>
                  {t("profile.editButton")}
                </Button>
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
                    账号身份、联系方式和登录资料集中展示，便于核对企业工作台使用状态。
                  </Typography.Paragraph>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                }}
              >
                <InfoCard
                  label={t("profile.fields.username")}
                  value={username}
                  accent="#165DFF"
                />
                <InfoCard
                  label={t("profile.fields.fullName")}
                  value={form.getFieldValue("full_name") || "-"}
                  accent="#00B42A"
                />
                <InfoCard
                  label={t("profile.fields.email")}
                  value={email}
                  accent="#F7BA1E"
                />
                <InfoCard
                  label={t("profile.fields.avatar")}
                  value={avatar || "-"}
                  accent="#722ED1"
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 18,
              }}
            >
              <div style={sectionStyle}>
                <Typography.Title heading={5} style={{ marginTop: 0 }}>
                  {t("profile.fields.account")}
                </Typography.Title>
                <Space direction="vertical" size="medium" style={{ width: "100%" }}>
                  {[
                    [t("profile.fields.role"), roleText, "#165DFF"],
                    [t("profile.fields.disabled"), accountStatus, "#00B42A"],
                    [t("profile.fields.createdById"), form.getFieldValue("created_by_id") || "-", "#F7BA1E"],
                    [t("profile.fields.id"), form.getFieldValue("id") || "-", "#722ED1"],
                  ].map(([label, value, accent]) => (
                    <div
                      key={`${label}-${value}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "10px 1fr",
                        gap: 12,
                        alignItems: "start",
                        padding: 12,
                        borderRadius: 8,
                        background: "#F7F8FA",
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 10,
                          background: accent,
                          marginTop: 6,
                        }}
                      />
                      <div>
                        <Typography.Text style={mutedTextStyle}>{label}</Typography.Text>
                        <div style={{ ...valueStyle, marginTop: 2 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                  {!isDefaultTenant && (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: "rgba(22,93,255,0.06)",
                      }}
                    >
                      <Typography.Text style={mutedTextStyle}>
                        {t("profile.fields.tenant")}
                      </Typography.Text>
                      <div style={{ ...valueStyle, marginTop: 2 }}>{tenantLabel}</div>
                    </div>
                  )}
                </Space>
              </div>

              <div style={sectionStyle}>
                <Typography.Title heading={5} style={{ marginTop: 0 }}>
                  {t("profile.fields.activity")}
                </Typography.Title>
                <Typography.Paragraph style={mutedTextStyle}>
                  与仪表盘一致的概览样式，用于快速检查账号基础状态。
                </Typography.Paragraph>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  {[
                    [username, t("profile.fields.username")],
                    [email, t("profile.fields.email")],
                    [form.getFieldValue("created_at") || "-", t("profile.fields.createdAt")],
                    [roleText, t("profile.fields.role")],
                  ].map(([value, label]) => (
                    <div
                      key={`${label}-${value}`}
                      style={{
                        border: "1px solid #E5E6EB",
                        borderRadius: 8,
                        background: "#F7F8FA",
                        padding: 16,
                        minHeight: 96,
                      }}
                    >
                      <Typography.Title
                        heading={6}
                        style={{ margin: 0, wordBreak: "break-word" }}
                      >
                        {value}
                      </Typography.Title>
                      <Typography.Text style={mutedTextStyle}>{label}</Typography.Text>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Space>
        )}
      </Skeleton>
    </div>
  );
};

export default ProfileShow;

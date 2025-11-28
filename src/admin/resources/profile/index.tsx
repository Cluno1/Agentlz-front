/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Button,
  Avatar,
  Typography,
  Tag,
  Grid,
  Statistic,
  Divider,
  Skeleton,
  Result,
} from "@arco-design/web-react";
import { useTranslate, useGetIdentity } from "react-admin";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../data/api/user";
import { useDarkMode } from "../../data/hook/useDark";

const ProfileShow = () => {
  const t = useTranslate();
  const { identity } = useGetIdentity();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { textColor, cardColorStyle } = useDarkMode();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        console.log(identity, "identity");
        if (!identity?.id) {
          setLoadError(t("profile.messages.loadFail"));
          return;
        }
        const profile = await getUser(identity.id as string);

        if (profile) {
          form.setFieldsValue(profile);
          localStorage.setItem(
            import.meta.env.IDENTITY_KEY,
            JSON.stringify(profile),
          );
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

  return (
    <div>
      <Card
        bordered={false}
        style={{
          marginBottom: 16,
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.12))",
        }}
      >
        <Skeleton loading={isLoading} text={{ rows: 1 }} animation>
          {!isLoading && loadError && (
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
          )}
          {!isLoading && !loadError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
              className="mt-40"
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <Avatar size={64}>
                  <img
                    src={form.getFieldValue("avatar")}
                    alt={
                      form.getFieldValue("full_name") ||
                      form.getFieldValue("username")
                    }
                  />
                </Avatar>
                <div
                  style={{
                    marginLeft: "12px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  className="mt-40"
                >
                  <Typography.Title
                    style={{ margin: 0, color: textColor }}
                    heading={5}
                  >
                    {form.getFieldValue("full_name") ||
                      form.getFieldValue("username") ||
                      "-"}
                  </Typography.Title>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "8px", // Tailwind 的 gap-2 对应 8px
                      minWidth: "200px",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {form.getFieldValue("role") && (
                        <Tag color="blue">
                          {t(`user.role.${form.getFieldValue("role")}`)}
                        </Tag>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {form.getFieldValue("tenant_id") && (
                        <Tag color="blue">
                          {form.getFieldValue("tenant_id")}
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button type="primary" onClick={goEdit}>
                {t("profile.editButton")}
              </Button>
            </div>
          )}
        </Skeleton>
      </Card>
      <Grid.Row gutter={16}>
        <Grid.Col span={12} xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card hoverable style={cardColorStyle}>
            <Typography.Title
              heading={5}
              style={{ marginBottom: 12, color: textColor }}
            >
              {t("profile.fields.basic")}
            </Typography.Title>
            <div className="flex flex-col gap-2 w-full">
              <div>
                <div
                  style={{
                    marginBottom: 2,
                    color: textColor,
                  }}
                >
                  {t("profile.fields.username")}
                </div>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: "bold",
                    color: textColor,
                  }}
                >
                  {form.getFieldValue("username") || "-"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    marginBottom: 2,
                    color: textColor,
                  }}
                >
                  {t("profile.fields.fullName")}
                </div>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: "bold",
                    color: textColor,
                  }}
                >
                  {form.getFieldValue("full_name") || "-"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    marginBottom: 2,
                    color: textColor,
                  }}
                >
                  {t("profile.fields.email")}
                </div>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: "bold",
                    color: textColor,
                  }}
                >
                  {form.getFieldValue("email") || "-"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    marginBottom: 2,
                    color: textColor,
                  }}
                >
                  {t("profile.fields.avatar")}
                </div>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: "bold",
                    color: textColor,
                  }}
                >
                  {form.getFieldValue("avatar") || "-"}
                </div>
              </div>
            </div>
          </Card>
        </Grid.Col>
        <Grid.Col span={12} xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card hoverable style={cardColorStyle}>
            <Typography.Title
              heading={5}
              style={{ marginBottom: 12, color: textColor }}
            >
              {t("profile.fields.account")}
            </Typography.Title>
            <div className="flex flex-col gap-2 w-full">
              <div>
                <div
                  style={{
                    marginBottom: 2,
                    color: textColor,
                  }}
                >
                  {t("profile.fields.role")}
                </div>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: "bold",
                    color: textColor,
                  }}
                >
                  {form.getFieldValue("role")
                    ? t(`user.role.${form.getFieldValue("role")}`)
                    : "-"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    marginBottom: 2,
                    color: textColor,
                  }}
                >
                  {t("profile.fields.disabled")}
                </div>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: "bold",
                    color: textColor,
                  }}
                >
                  {form.getFieldValue("disabled")
                    ? t("profile.disabledYes")
                    : t("profile.disabledNo")}
                </div>
              </div>
              <div>
                <div
                  style={{
                    marginBottom: 2,
                    color: textColor,
                  }}
                >
                  {t("profile.fields.createdById")}
                </div>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: "bold",
                    color: textColor,
                  }}
                >
                  {form.getFieldValue("created_by_id") || "-"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    marginBottom: 2,
                    color: textColor,
                  }}
                >
                  {t("profile.fields.tenant")}
                </div>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: "bold",
                    color: textColor,
                  }}
                >
                  {form.getFieldValue("tenant_id") || "-"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    marginBottom: 2,
                    color: textColor,
                  }}
                >
                  {t("profile.fields.id")}
                </div>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: "bold",
                    color: textColor,
                  }}
                >
                  {form.getFieldValue("id") || "-"}
                </div>
              </div>
            </div>
          </Card>
        </Grid.Col>
      </Grid.Row>
      <Grid.Row gutter={16} style={{ marginTop: 16 }}>
        <Grid.Col span={24}>
          <Card hoverable style={cardColorStyle}>
            <Typography.Title
              heading={5}
              style={{ marginBottom: 12, color: textColor }}
            >
              {t("profile.fields.activity")}
            </Typography.Title>
            <div className="flex flex-wrap gap-8">
              <Statistic
                title={t("profile.fields.username")}
                value={form.getFieldValue("username") || "-"}
                styleValue={{ color: textColor }}
              />
              <Divider type="vertical" />
              <Statistic
                title={t("profile.fields.email")}
                value={form.getFieldValue("email") || "-"}
                styleValue={{ color: textColor }}
              />
              <Divider type="vertical" />
              <Statistic
                title={t("profile.fields.createdAt")}
                value={form.getFieldValue("created_at") || "-"}
                styleValue={{ color: textColor }}
              />
              <Divider type="vertical" />
            </div>
          </Card>
        </Grid.Col>
      </Grid.Row>
    </div>
  );
};

export default ProfileShow;

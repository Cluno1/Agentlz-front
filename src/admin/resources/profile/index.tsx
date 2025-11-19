/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Card, Form, Button, Avatar } from "@arco-design/web-react";
import { useTranslate, useGetIdentity } from "react-admin";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../data/api/user";

const ProfileShow = () => {
  const t = useTranslate();
  const { identity } = useGetIdentity();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

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
  }, [identity?.id, form, t]);

  const goEdit = () => {
    navigate("/profile/edit");
  };

  return (
    <Card title={t("profile.title")}>
      {isLoading && <p>{t("common.loading")}</p>}
      {loadError && (
        <p>
          {t("profile.messages.loadError")}: {loadError}
        </p>
      )}
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
            <Avatar size={48}>
              <img
                src={form.getFieldValue("avatar")}
                alt={
                  form.getFieldValue("fullName") ||
                  form.getFieldValue("username")
                }
              />
            </Avatar>
            <span>
              {form.getFieldValue("fullName") || form.getFieldValue("username")}
            </span>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={{ color: "#666", marginBottom: 4 }}>
                {t("profile.fields.username")}
              </div>
              <div>{form.getFieldValue("username") || "-"}</div>
            </div>
            <div>
              <div style={{ color: "#666", marginBottom: 4 }}>
                {t("profile.fields.fullName")}
              </div>
              <div>{form.getFieldValue("fullName") || "-"}</div>
            </div>
            <div>
              <div style={{ color: "#666", marginBottom: 4 }}>
                {t("profile.fields.email")}
              </div>
              <div>{form.getFieldValue("email") || "-"}</div>
            </div>
            <div>
              <div style={{ color: "#666", marginBottom: 4 }}>
                {t("profile.fields.avatar")}
              </div>
              <div>{form.getFieldValue("avatar") || "-"}</div>
            </div>
            <div>
              <div style={{ color: "#666", marginBottom: 4 }}>
                {t("profile.fields.role")}
              </div>
              <div>
                {form.getFieldValue("role")
                  ? t(`user.role.${form.getFieldValue("role")}`)
                  : "-"}
              </div>
            </div>
            <div>
              <div style={{ color: "#666", marginBottom: 4 }}>
                {t("profile.fields.disabled")}
              </div>
              <div>
                {form.getFieldValue("disabled")
                  ? t("profile.disabledYes")
                  : t("profile.disabledNo")}
              </div>
            </div>
            <div>
              <div style={{ color: "#666", marginBottom: 4 }}>
                {t("profile.fields.createdAt")}
              </div>
              <div>{form.getFieldValue("createdAt") || "-"}</div>
            </div>
            <div>
              <div style={{ color: "#666", marginBottom: 4 }}>
                {t("profile.fields.createdById")}
              </div>
              <div>{form.getFieldValue("createdById") || "-"}</div>
            </div>
            <div>
              <div style={{ color: "#666", marginBottom: 4 }}>
                {t("profile.fields.id")}
              </div>
              <div>{form.getFieldValue("id") || "-"}</div>
            </div>
            <Button type="primary" onClick={goEdit}>
              {t("profile.editButton")}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default ProfileShow;

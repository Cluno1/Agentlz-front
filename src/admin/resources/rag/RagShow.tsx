import React, { useState } from "react";
import { useGetOne, useTranslate, Title } from "react-admin";
import { useParams } from "react-router-dom";
import {
  Card,
  Button,
  Drawer,
  Space,
  Tag,
  Typography,
  Avatar,
  Popover,
  Divider,
} from "@arco-design/web-react";
import { IconDownload, IconEye } from "@arco-design/web-react/icon";
import { useDarkMode } from "../../data/hook/useDark";

const RagShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const translate = useTranslate();
  const { data, isLoading, error } = useGetOne("rag", { id });
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { textColor, cardColorStyle } = useDarkMode();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

  const t = (key: string, def?: string) =>
    translate(`rag.ui.columns.${key}`, { _: def || key });

  return (
    <Card
      title={
        <Title title={translate("rag.ui.columns.view", { _: "查看详情" })} />
      }
      bordered
      style={cardColorStyle}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Typography.Title heading={4} style={{ color: textColor }}>
          {data.title}
        </Typography.Title>

        <Divider />

        <Space size="large">
          <div>
            <strong style={{ color: textColor }}>{t("type", "类型")}:</strong>{" "}
            <Tag color="blue">{data.type}</Tag>
          </div>
          <div>
            <strong style={{ color: textColor }}>{t("status", "状态")}:</strong>{" "}
            <Tag color={data.status === "ready" ? "green" : "orangered"}>
              {data.status}
            </Tag>
          </div>
          <div>
            <strong style={{ color: textColor }}>{t("tenant", "租户")}:</strong>{" "}
            {data.tenant_name}
          </div>
        </Space>

        <Divider />

        <div>
          <strong style={{ color: textColor }}>
            {t("uploadedBy", "上传者")}:
          </strong>
          <Popover
            content={
              <div style={{ padding: "8px" }}>
                <Avatar>
                  <img
                    src={data.uploaded_by_user_avatar}
                    alt={data.uploaded_by_user_name}
                  />
                </Avatar>
                <div>{data.uploaded_by_user_name}</div>
                <div>{data.uploaded_by_user_username}</div>
                <div>{data.uploaded_by_user_email}</div>
              </div>
            }
          >
            <Avatar style={{ marginLeft: 8 }}>
              <img
                src={data.uploaded_by_user_avatar}
                alt={data.uploaded_by_user_name}
              />
            </Avatar>
          </Popover>
        </div>

        <div>
          <strong style={{ color: textColor }}>{t("tags", "标签")}:</strong>{" "}
          {data.tags
            ? data.tags
                .split(",")
                .map((tag: string) => <Tag key={tag}>{tag.trim()}</Tag>)
            : "-"}
        </div>

        <div>
          <strong style={{ color: textColor }}>
            {t("description", "描述")}:
          </strong>{" "}
          {data.description || "-"}
        </div>

        <div>
          <strong style={{ color: textColor }}>
            {t("uploadedAt", "上传时间")}:
          </strong>{" "}
          {new Date(data.upload_time).toLocaleString()}
        </div>

        <Divider />

        <Space>
          <Button
            type="primary"
            icon={<IconEye />}
            onClick={() => setDrawerVisible(true)}
          >
            {translate("rag.ui.columns.view", { _: "查看解析后内容" })}
          </Button>
          <Button
            type="secondary"
            icon={<IconDownload />}
            href={data.save_https}
            target="_blank"
          >
            {translate("rag.ui.download", { _: "下载原文件" })}
          </Button>
        </Space>
      </Space>

      <Drawer
        width="60%"
        title={translate("rag.ui.content", {
          _: "文档内容(已解析为markdown格式,仅供大模型参考)",
        })}
        visible={drawerVisible}
        onOk={() => setDrawerVisible(false)}
        onCancel={() => setDrawerVisible(false)}
        style={cardColorStyle}
      >
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: textColor,
          }}
        >
          {data.content}
        </pre>
      </Drawer>
    </Card>
  );
};

export default RagShow;

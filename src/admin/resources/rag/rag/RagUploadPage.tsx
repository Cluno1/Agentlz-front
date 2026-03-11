/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Title, useTranslate } from "react-admin";
import {
  Card,
  Upload,
  Button,
  Space,
  Input,
  Select,
  Popover,
  Tag,
} from "@arco-design/web-react";
import { IconUpload, IconRefresh } from "@arco-design/web-react/icon";
import type { UploadItem } from "@arco-design/web-react/es/Upload/interface";
import { useLocation, useNavigate } from "react-router-dom";
import { strategyOptions } from "./strategyOptions";

const RagUploadPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const location = useLocation();
  const [fileList, setFileList] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [docType, setDocType] = useState<string>(() => {
    const s = (location.state as any)?.scope;
    if (s === "self" || s === "tenant" || s === "system") return s;
    return "self";
  });
  const [fileName, setFileName] = useState<string>("");
  const [strategies, setStrategies] = useState<string[]>(["-1"]);
  const backTo = "/rag?tab=knowledge";

  const isDefaultTenant =
    (localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default") ===
    "default";

  const docTypeOptions = [
    {
      label: t("rag.ui.type.self", { _: "个人文档" }),
      value: "self",
    },
    ...(!isDefaultTenant
      ? [
          {
            label: t("rag.ui.type.tenant", { _: "租户文档" }),
            value: "tenant",
          },
        ]
      : []),
    {
      label: t("rag.ui.type.system", { _: "系统文档" }),
      value: "system",
    },
  ];

  const handleUpload = async () => {
    setUploading(true);
    const file = fileList[0]?.originFile as File;
    if (!file) {
      setUploading(false);
      return;
    }
    const tagArray = tags.split(/[,\s]+/).filter(Boolean);
    navigate(backTo, {
      state: {
        uploadFrom: "ragUpload",
        file,
        uploadParams: {
          type: docType,
          title: fileName || file.name,
          description,
          tags: tagArray,
          strategy: strategies,
        },
      },
    });
    setUploading(false);
  };

  return (
    <Card
      title={<Title title={t("rag.ui.tabs.upload", { _: "上传文档" })} />}
      bordered
    >
      <Space style={{ marginBottom: 12 }}>
        <Tag color="arcoblue">
          {t("rag.ui.knowledgeDocs", { _: "知识文档" })}
        </Tag>
      </Space>
      <Upload
        drag
        autoUpload={false}
        fileList={fileList}
        accept=".pdf,.doc,.docx,.md,.txt,.ppt,.pptx,.xls,.xlsx,.csv,.mp4,.mov,.avi,.mkv"
        onChange={(list: UploadItem[]) => {
          setFileList(list);
          if (list.length > 0 && list[0].originFile) {
            setFileName(list[0].originFile.name);
          } else {
            setFileName("");
          }
        }}
      />

      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}
          >
            {t("rag.ui.fileName", { _: "文件名称" })}
          </label>
          <Input
            value={fileName}
            onChange={setFileName}
            placeholder={t("rag.ui.fileNamePlaceholder", {
              _: "请输入文件名称",
            })}
            style={{ width: "100%" }}
            disabled={!fileList.length}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}
          >
            {t("rag.ui.documentType", { _: "文档类型" })}
          </label>
          <Select
            value={docType}
            onChange={setDocType}
            style={{ width: 200 }}
            options={docTypeOptions as any}
            disabled={!fileList.length}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}
          >
            {t("rag.ui.strategy", { _: "切割策略" })}
          </label>
          <Select
            mode="multiple"
            value={strategies}
            style={{ width: "100%" }}
            disabled={!fileList.length}
            onChange={(vals) => {
              const next = (vals as unknown[]).map((v) => String(v));
              if (next.includes("-1")) {
                setStrategies(["-1"]);
              } else {
                setStrategies(next.filter((v) => v !== "-1"));
              }
            }}
            allowClear
            placeholder={t("rag.ui.selectStrategies", { _: "选择切割策略" })}
          >
            {strategyOptions.map((opt) => (
              <Select.Option
                key={opt.value}
                value={opt.value}
                disabled={strategies.includes("-1") && opt.value !== "-1"}
              >
                <Space align="center">
                  <Popover
                    trigger="hover"
                    position="top"
                    content={
                      <div style={{ maxWidth: 360 }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>
                          {opt.label}
                        </div>
                        <div style={{ display: "grid", rowGap: 4 }}>
                          {opt.details.map((d) => (
                            <div key={d}>{d}</div>
                          ))}
                        </div>
                      </div>
                    }
                  >
                    <span>{opt.label}</span>
                  </Popover>
                  {typeof opt.rating === "number" && (
                    <Tag size="small" color="arcoblue">
                      {opt.rating}/10
                    </Tag>
                  )}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}
          >
            {t("rag.ui.tags", { _: "标签" })}
          </label>
          <Input
            value={tags}
            onChange={setTags}
            placeholder={t("rag.ui.tagsPlaceholder", {
              _: "请输入标签，用空格分隔",
            })}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}
          >
            {t("rag.ui.description", { _: "描述" })}
          </label>
          <Input.TextArea
            value={description}
            onChange={setDescription}
            placeholder={t("rag.ui.descriptionPlaceholder", {
              _: "请输入文档描述（可选）",
            })}
            rows={3}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <Space style={{ marginTop: 16 }}>
        <Button
          type="primary"
          icon={<IconUpload />}
          onClick={handleUpload}
          disabled={!fileList.length}
          loading={uploading}
        >
          {t("rag.ui.startUpload", { _: "上传并解析" })}
        </Button>
        <Button
          icon={<IconRefresh />}
          onClick={() => {
            setFileList([]);
            setFileName("");
            setTags("");
            setDescription("");
            setDocType("self");
            setStrategies(["-1"]);
          }}
          disabled={!fileList.length}
        >
          {t("rag.ui.clear", { _: "清空" })}
        </Button>
      </Space>
    </Card>
  );
};

export default RagUploadPage;

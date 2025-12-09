/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Title, useTranslate } from "react-admin";
import {
  Card,
  Upload,
  Button,
  Message,
  Space,
  Input,
  Select,
} from "@arco-design/web-react";
import { IconUpload, IconRefresh } from "@arco-design/web-react/icon";
import type { UploadItem } from "@arco-design/web-react/es/Upload/interface";
import { useNavigate } from "react-router-dom";
import { createDocument } from "../../data/api/rag";

const RagUploadPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const [fileList, setFileList] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [docType, setDocType] = useState<string>("self");
  const [fileName, setFileName] = useState<string>("");

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

  const toArrayBuffer = (file: File) =>
    new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

  const inferDocType = (file: File) => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    return ext || file.type || "txt";
  };
  const handleUpload = async () => {
    try {
      setUploading(true);
      const file = fileList[0]?.originFile as File;
      if (!file) return;

      const arrayBuffer = await toArrayBuffer(file);
      const blob = new Blob([arrayBuffer], { type: file.type });

      const formData = new FormData();
      formData.append("document", blob, file.name);
      formData.append("document_type", inferDocType(file));
      formData.append("title", fileName || file.name);
      formData.append("type", docType);
      if (description) formData.append("description", description);
      if (tags) {
        const tagArray = tags.split(/[,\s]+/).filter(Boolean);
        if (tagArray.length) {
          formData.append("tags", JSON.stringify(tagArray));
        }
      }

      await createDocument(formData);

      Message.success(t("rag.msg.uploadSuccess", { _: "上传成功，正在解析" }));
      navigate("/rag");
    } catch (e: any) {
      Message.error(e?.message || t("rag.msg.uploadError", { _: "上传失败" }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card
      title={<Title title={t("rag.ui.tabs.upload", { _: "上传文档" })} />}
      bordered
    >
      <Upload
        drag
        autoUpload={false}
        fileList={fileList}
        accept=".pdf,.doc,.docx,.md,.txt,.ppt,.pptx,.xls,.xlsx,.csv"
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

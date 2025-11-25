/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Title, useTranslate } from "react-admin";
import { Card, Upload, Button, Message, Space } from "@arco-design/web-react";
import { IconUpload, IconRefresh } from "@arco-design/web-react/icon";
import type { UploadItem } from "@arco-design/web-react/es/Upload/interface";
import { useNavigate } from "react-router-dom";
import { createDocument } from "../../data/api/rag";
import type { CreateRagDocNameSpace } from "../../data/api/rag/type";

const RagUploadPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const [fileList, setFileList] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });

  const inferDocType = (file: File) => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    return ext || file.type || "txt";
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      const files = fileList.map((f) => f.originFile as File).filter(Boolean);
      if (!files.length) return;
      for (const f of files) {
        const content = await toBase64(f);
        const payload: CreateRagDocNameSpace.CreateRagDocParams = {
          document: content,
          document_type: inferDocType(f),
          title: f.name,
        };
        await createDocument(payload, "self");
      }
      setFileList([]);
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
        multiple
        autoUpload={false}
        fileList={fileList}
        accept=".pdf,.doc,.docx,.md,.txt,.ppt,.pptx,.xls,.xlsx,.csv"
        onChange={(list: UploadItem[]) => setFileList(list)}
      />
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
          onClick={() => setFileList([])}
          disabled={!fileList.length}
        >
          {t("rag.ui.clear", { _: "清空" })}
        </Button>
      </Space>
    </Card>
  );
};

export default RagUploadPage;

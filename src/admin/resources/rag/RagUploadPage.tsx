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
  Popover,
  Tag,
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
  const [strategies, setStrategies] = useState<string[]>(["-1"]);

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

  const strategyOptions: Array<{
    value: string;
    label: string;
    rating?: number;
    details: string[];
  }> = [
    {
      value: "-1",
      label: "先不切块",
      details: ["上传后暂不进行切片，稍后可在“切片策略”页面发布任务。"],
    },
    {
      value: "0",
      label: "基础中文切割",
      rating: 6.5,
      details: [
        "JSON观察：total_chunks=4；长度[min=116, max=496, avg=399]；meta(max_size=500, overlap=50)",
        "优点：实现简单、成本低；中文标点与简单Markdown边界可用；长度控制合理",
        "局限：结构保持弱；句法与主题边界可能出现“句中断裂”",
        "适用：快速原型、轻量FAQ/公告类文本",
      ],
    },
    {
      value: "1",
      label: "递归字符切割（结构感知）",
      rating: 7.5,
      details: [
        "JSON观察：total_chunks=4；长度[min=156, max=495, avg=374]；meta(chunk_size=500, chunk_overlap=50)",
        "优点：保持段落与标题分隔，结构保真优于朴素切分",
        "局限：对表格/代码围栏的完整保持取决于分隔符配置",
        "适用：Markdown 文档的通用向量化",
      ],
    },
    {
      value: "2",
      label: "固定长度 + 边界感知",
      rating: 8.2,
      details: [
        "JSON观察：total_chunks=3；长度[min=339, max=597, avg=467]；meta(target_length=600, overlap=80)",
        "优点：优先句边界/换行/标题切分，减少句中断裂；稳定高效",
        "局限：结构保持有限；主题跨段需配合重排器",
        "适用：通用文档，默认策略",
      ],
    },
    {
      value: "3",
      label: "语义相似度驱动切分",
      rating: 8.8,
      details: [
        "JSON观察：total_chunks=4；长度[min=190, max=790, avg=408]；meta(max_size=800, min_size=200, overlap=100, threshold=0.35)",
        "优点：相邻句嵌入相似度驱动边界，主题连续性好",
        "局限：成本较高；阈值与超参需调优",
        "适用：高精度检索问答、论述/白皮书/手册",
      ],
    },
    {
      value: "4",
      label: "LLM 语义分段",
      rating: 7.2,
      details: [
        "JSON观察：total_chunks=5；长度[min=128, max=696, avg=289]；meta(chunk_size=800)",
        "优点：目标形态为“主题/任务/意图”分段；复杂布局优势",
        "局限：稳定性依赖模型与提示",
        "适用：规章制度、技术方案、规范条款（接入更强模型后评分可达9+）",
      ],
    },
    {
      value: "5",
      label: "层次切片（章节/段落/句子）",
      rating: 8.0,
      details: [
        "JSON观察：total_chunks=13；长度[min=8, max=320, avg=108]；meta(target_length=600, overlap=80)",
        "优点：多粒度组织；利于粗召回、细重排与答案拼接",
        "局限：索引规模与维护复杂；小块偏多依赖重排质量",
        "适用：书籍、手册、长报告、法律文本",
      ],
    },
    {
      value: "6",
      label: "滑动窗口",
      rating: 7.6,
      details: [
        "JSON观察：total_chunks=4；长度[min=316, max=600, avg=525]；meta(window_size=600, overlap=220)",
        "优点：高重叠保证跨块信息连续；实现简单",
        "局限：冗余与索引膨胀显著；成本上升",
        "适用：代码、公式、规范条款、术语密集文本",
      ],
    },
    {
      value: "7",
      label: "结构感知（代码块/列表/表格）",
      rating: 8.6,
      details: [
        "JSON观察：total_chunks=5；长度[min=29, max=781, avg=280]；meta(max_size=800)",
        "优点：保持结构整体，混排Markdown更友好",
        "局限：当语义跨度大时需配合语义切片或重排器",
        "适用：技术文档、设计文档（含代码/表格）",
      ],
    },
    {
      value: "8",
      label: "动态自适应（密度驱动）",
      rating: 8.1,
      details: [
        "JSON观察：total_chunks=7；长度[min=76, max=511, avg=203]；meta(base_chunk_size=700, overlap=80)",
        "优点：根据密度自适应长度，提升信息均衡性",
        "局限：启发式对语料特性敏感；需评估调优",
        "适用：主题密度波动较大的综合文档",
      ],
    },
    {
      value: "9",
      label: "关系联结",
      rating: 7.4,
      details: [
        "JSON观察：total_chunks=12；长度[min=25, max=673, avg=149]；meta(max_size=700)",
        "优点：跨块引用/链接联结，利于多段证据召回",
        "局限：就近合并可能引入噪声与跨主题混拼",
        "适用：知识性文档、跨段引用丰富的规范/说明",
      ],
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
      if (strategies && strategies.length) {
        formData.append("strategy", JSON.stringify(strategies));
      }
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

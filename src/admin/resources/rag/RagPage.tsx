/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Space,
  Tabs,
  Upload,
  Button,
  Input,
  Message,
  Select,
  Table,
  Tag,
} from "@arco-design/web-react";
import { IconUpload, IconRefresh } from "@arco-design/web-react/icon";
import { useTranslate } from "react-admin";
import { useLocation, useNavigate } from "react-router-dom";
import {
  mockListRagDocs,
  mockUploadRagFiles,
  type RagDoc,
  type RagDocStatus,
} from "../../data/mock/rag";
import type { UploadItem } from "@arco-design/web-react/es/Upload/interface";

const STATUS_OPTIONS: Array<RagDocStatus | "all"> = [
  "all",
  "processing",
  "ready",
];

const RagPage: React.FC = () => {
  const t = useTranslate();
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState<"upload" | "docs">("upload");
  const [fileList, setFileList] = useState<UploadItem[]>([]);
  const [docs, setDocs] = useState<RagDoc[]>([]);
  const [query, setQuery] = useState<string>("");
  const [status, setStatus] = useState<RagDocStatus | "all">("all");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "upload" || tab === "docs") setActive(tab as any);
  }, [location.search]);

  const onTabChange = (key: string) => {
    setActive(key as any);
    const params = new URLSearchParams(location.search);
    params.set("tab", key);
    navigate(
      { pathname: "/rag", search: params.toString() },
      { replace: true },
    );
  };

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const list = await mockListRagDocs({ query, status });
      setDocs(list);
    } catch {
      Message.error(t("rag.msg.loadFail", { _: "加载失败" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status]);

  const stats = useMemo(() => {
    const total = docs.length;
    const processing = docs.filter((d) => d.status === "processing").length;
    const ready = docs.filter((d) => d.status === "ready").length;
    return { total, processing, ready };
  }, [docs]);

  const handleUpload = async () => {
    try {
      const files = fileList.map((f) => f.originFile as File).filter(Boolean);
      if (!files.length) return;
      await mockUploadRagFiles(files);
      setFileList([]);
      Message.success(t("rag.msg.uploadSuccess", { _: "上传成功，正在解析" }));
      setActive("docs");
      const params = new URLSearchParams(location.search);
      params.set("tab", "docs");
      navigate(
        { pathname: "/rag", search: params.toString() },
        { replace: true },
      );
      fetchDocs();
    } catch {
      Message.error(t("rag.msg.uploadError", { _: "上传失败" }));
    }
  };

  const columns = [
    {
      title: t("rag.ui.columns.name", { _: "名称" }),
      dataIndex: "name",
      render: (v: string) => <span className="font-medium">{v}</span>,
    },
    {
      title: t("rag.ui.columns.size", { _: "大小" }),
      dataIndex: "size",
      render: (v: number) => `${(v / 1024).toFixed(1)} KB`,
      width: 120,
    },
    {
      title: t("rag.ui.columns.type", { _: "类型" }),
      dataIndex: "type",
      width: 140,
    },
    {
      title: t("rag.ui.columns.status", { _: "状态" }),
      dataIndex: "status",
      render: (s: RagDocStatus) => (
        <Tag color={s === "ready" ? "green" : "orangered"}>
          {s === "ready"
            ? t("rag.ui.status.ready", { _: "已完成" })
            : t("rag.ui.status.processing", { _: "解析中" })}
        </Tag>
      ),
      width: 120,
    },
    {
      title: t("rag.ui.columns.uploadedAt", { _: "上传时间" }),
      dataIndex: "uploadedAt",
      render: (ts: number) => new Date(ts).toLocaleString(),
      width: 180,
    },
  ];

  return (
    <div className="h-full">
      <div className="bg-gradient-to-r from-[rgb(22,93,255)] to-[rgb(0,200,255)] text-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Typography.Title heading={3} style={{ color: "#fff" }}>
                {t("rag.title")}
              </Typography.Title>
              <div className="text-sm opacity-90">
                {t("rag.ui.uploadTip", {
                  _: "支持 pdf、doc/docx、md、txt、ppt/pptx、xls/xlsx、csv 等",
                })}
              </div>
            </div>
            <Space size={24}>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {t("rag.ui.stats.total", { _: "总计" })}
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {t("rag.ui.stats.processing", { _: "解析中" })}
                </div>
                <div className="text-2xl font-bold">{stats.processing}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {t("rag.ui.stats.ready", { _: "已完成" })}
                </div>
                <div className="text-2xl font-bold">{stats.ready}</div>
              </div>
            </Space>
          </div>
          <div className="mt-6">
            <Tabs activeTab={active} onChange={onTabChange}>
              <Tabs.TabPane
                key="upload"
                title={t("rag.ui.tabs.upload", { _: "上传文档" })}
              >
                <Card>
                  <Upload
                    drag
                    multiple
                    autoUpload={false}
                    fileList={fileList}
                    accept=".pdf,.doc,.docx,.md,.txt,.ppt,.pptx,.xls,.xlsx,.csv"
                    onChange={(list: UploadItem[]) => setFileList(list)}
                  />
                  <div className="mt-4">
                    <Space>
                      <Button
                        type="primary"
                        icon={<IconUpload />}
                        onClick={handleUpload}
                        disabled={!fileList.length}
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
                  </div>
                </Card>
              </Tabs.TabPane>
              <Tabs.TabPane
                key="docs"
                title={t("rag.ui.tabs.docs", { _: "查看文档" })}
              >
                <Card>
                  <div className="flex items-center gap-3 mb-4">
                    <Input
                      allowClear
                      placeholder={t("rag.ui.searchPlaceholder", {
                        _: "按名称搜索",
                      })}
                      value={query}
                      onChange={setQuery}
                    />
                    <Select
                      value={status}
                      onChange={setStatus}
                      style={{ width: 180 }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <Select.Option key={s} value={s}>
                          {s === "all"
                            ? t("rag.ui.categories.all", { _: "全部" })
                            : s === "processing"
                              ? t("rag.ui.status.processing", { _: "解析中" })
                              : t("rag.ui.status.ready", { _: "已完成" })}
                        </Select.Option>
                      ))}
                    </Select>
                    <Button icon={<IconRefresh />} onClick={fetchDocs}>
                      {t("rag.ui.refresh", { _: "刷新" })}
                    </Button>
                  </div>
                  <Table
                    loading={loading}
                    columns={columns as any}
                    data={docs}
                    rowKey="id"
                    pagination={false}
                  />
                  {!loading && docs.length === 0 && (
                    <div className="text-center text-gray-500 py-6">
                      {t("rag.msg.loadFail", { _: "加载失败" })}
                    </div>
                  )}
                </Card>
              </Tabs.TabPane>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RagPage;

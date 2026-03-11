/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePermissions, useTranslate } from "react-admin";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Input,
  Message,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import {
  getEvaluationDoc,
  listEvaluationData,
  listEvaluationDocs,
} from "../../../data/api/evaluation";
import type { EvaluationNameSpace } from "../../../data/api/evaluation/type";
import { uploadFileForRag } from "../../../utils/upload/uploader";

type EvalDoc = EvaluationNameSpace.EvaluationDoc;
type EvalDataRow = EvaluationNameSpace.EvaluationDataRow;

const EvaluationDocsPage: React.FC = () => {
  const t = useTranslate();
  const { permissions } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const [docs, setDocs] = useState<EvalDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docQuery, setDocQuery] = useState("");
  const [docPage, setDocPage] = useState(1);
  const [docPageSize, setDocPageSize] = useState(10);
  const [docTotal, setDocTotal] = useState(0);
  const [scope, setScope] = useState<"self" | "tenant" | "system">("tenant");

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailDoc, setDetailDoc] = useState<EvalDoc | null>(null);
  const [detailRows, setDetailRows] = useState<EvalDataRow[]>([]);
  const [detailRowPage, setDetailRowPage] = useState(1);
  const [detailRowPageSize, setDetailRowPageSize] = useState(50);
  const [detailRowTotal, setDetailRowTotal] = useState(0);

  const [jsonVisible, setJsonVisible] = useState(false);
  const [jsonTitle, setJsonTitle] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [datasetJsonVisible, setDatasetJsonVisible] = useState(false);
  const [datasetJsonTitle, setDatasetJsonTitle] = useState("");
  const [datasetJsonText, setDatasetJsonText] = useState("");

  const uploadStartedRef = useRef(false);

  const tenantId =
    localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default";
  const isDefaultTenant = tenantId === "default";
  const isSuperAdmin = useMemo(() => {
    const role =
      typeof permissions === "string"
        ? permissions
        : (permissions as any)?.role;
    return (
      role === "admin" && (tenantId === "system" || tenantId === "default")
    );
  }, [permissions, tenantId]);

  useEffect(() => {
    if ((isDefaultTenant || isSuperAdmin) && scope === "tenant") {
      setScope("self");
    }
  }, [isDefaultTenant, isSuperAdmin, scope]);

  const fetchDocs = React.useCallback(
    async (q: string) => {
      try {
        setDocsLoading(true);
        const resp = await listEvaluationDocs({
          page: docPage,
          perPage: docPageSize,
          sortField: "id",
          sortOrder: "DESC",
          filter: { q: q || undefined },
          type: scope,
        });
        const list = resp?.data ?? [];
        setDocs(list);
        setDocTotal(resp?.total ?? list.length);
      } catch {
        Message.error(
          t("evaluation.msg.loadDocsFail", { _: "加载测评文件失败" }),
        );
      } finally {
        setDocsLoading(false);
      }
    },
    [docPage, docPageSize, scope, t],
  );

  const fetchDetail = React.useCallback(
    async (docId: string, page: number, perPage: number) => {
      if (!docId) return;
      try {
        setDetailLoading(true);
        const [doc, data] = await Promise.all([
          getEvaluationDoc(docId, scope),
          listEvaluationData({ docId, page, perPage, type: scope }),
        ]);
        setDetailDoc(doc);
        setDetailRows(data?.data ?? []);
        setDetailRowTotal(data?.total ?? (data?.data ?? []).length);
      } catch {
        Message.error(
          t("evaluation.msg.loadDataFail", { _: "加载测评数据失败" }),
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [scope, t],
  );

  useEffect(() => {
    fetchDocs(docQuery.trim());
  }, [fetchDocs, docQuery, scope]);

  useEffect(() => {
    if (uploadStartedRef.current) return;
    const state = location.state as {
      uploadFrom?: string;
      file?: File;
      uploadParams?: Record<string, unknown>;
    } | null;
    if (state && state.uploadFrom === "evaluationUpload" && state.file) {
      uploadStartedRef.current = true;
      navigate(location.pathname, { replace: true });
      const params = (state.uploadParams || {}) as {
        type?: string;
        title?: string;
        description?: string;
        tags?: string[];
        strategy?: string[];
        is_evaluation?: boolean;
      };
      (async () => {
        try {
          setUploading(true);
          await uploadFileForRag(state.file as File, {
            type: params.type || "self",
            title: params.title,
            description: params.description,
            tags: params.tags,
            strategy: params.strategy,
            is_evaluation: true,
          });
          Message.success(
            t("rag.msg.uploadSuccess", { _: "上传成功，等待解析" }),
          );
          setDocPage(1);
          await fetchDocs("");
        } catch (e: any) {
          Message.error(
            e?.message || t("rag.msg.uploadError", { _: "上传失败" }),
          );
        } finally {
          setUploading(false);
          uploadStartedRef.current = false;
        }
      })();
    }
  }, [fetchDocs, location, navigate, t]);

  useEffect(() => {
    setDetailVisible(false);
    setDetailDoc(null);
    setDetailRows([]);
    setDetailRowPage(1);
    setDetailRowPageSize(50);
    setDetailRowTotal(0);
  }, [scope]);

  const docColumns = useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        width: 120,
      },
      {
        title: t("evaluation.ui.docTitle", { _: "标题" }),
        dataIndex: "name",
        render: (_: unknown, record: EvalDoc) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{record.name || "-"}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {String(record.id || "")}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t("evaluation.ui.scope", { _: "范围" }),
        dataIndex: "scope",
        width: 100,
        render: (v: unknown) => <Tag>{String(v || "-")}</Tag>,
      },
      {
        title: t("common.status", { _: "状态" }),
        dataIndex: "status",
        width: 120,
        render: (v: unknown) => {
          const s = String(v || "");
          const color =
            s === "ready"
              ? "green"
              : s === "processing"
                ? "arcoblue"
                : s.includes("failed")
                  ? "red"
                  : "gray";
          return <Tag color={color}>{s || "-"}</Tag>;
        },
      },
      {
        title: t("evaluation.ui.count", { _: "条数" }),
        dataIndex: "total_count",
        width: 100,
        render: (_: unknown, r: EvalDoc) =>
          typeof r.total_count === "number" ? r.total_count : "-",
      },
      {
        title: t("evaluation.ui.uploadTime", { _: "上传时间" }),
        dataIndex: "updated_at",
        width: 180,
        render: (v: unknown) => String(v || "-"),
      },
      {
        title: t("common.action", { _: "操作" }),
        width: 120,
        render: (_: unknown, record: EvalDoc) => (
          <Space>
            <Button
              size="mini"
              type="primary"
              onClick={() => {
                const docId = String(record.id || "");
                if (!docId) return;
                setDetailVisible(true);
                setDetailDoc(null);
                setDetailRows([]);
                setDetailRowPage(1);
                setDetailRowPageSize(50);
                setDetailRowTotal(0);
                fetchDetail(docId, 1, 50);
              }}
            >
              {t("common.detail", { _: "详情" })}
            </Button>
            <Button
              size="mini"
              onClick={() => {
                const name = String(record.name || "");
                setDatasetJsonTitle(
                  name
                    ? `${t("evaluation.ui.docJson", { _: "数据集 JSON" })}（${name}）`
                    : t("evaluation.ui.docJson", { _: "数据集 JSON" }),
                );
                let text = "[]";
                try {
                  const raw = String((record as any).data_json || "[]");
                  const parsed = JSON.parse(raw);
                  text = JSON.stringify(parsed, null, 2);
                } catch {
                  text = String((record as any).data_json || "[]");
                }
                setDatasetJsonText(text);
                setDatasetJsonVisible(true);
              }}
            >
              {t("common.view", { _: "查看" })}
            </Button>
          </Space>
        ),
      },
    ],
    [fetchDetail, t],
  );

  const rowColumns = useMemo(
    () => [
      {
        title: t("evaluation.ui.rowIndex", { _: "序号" }),
        dataIndex: "row_index",
        width: 80,
      },
      {
        title: t("evaluation.ui.modelInput", { _: "输入" }),
        dataIndex: "model_input",
        render: (v: unknown) => (
          <Typography.Paragraph
            style={{ margin: 0, maxWidth: 520 }}
            ellipsis={{ rows: 2, expandable: false }}
          >
            {String(v || "")}
          </Typography.Paragraph>
        ),
      },
      {
        title: t("evaluation.ui.expectOutput", { _: "预期输出" }),
        dataIndex: "expect_output",
        render: (v: unknown) => (
          <Typography.Paragraph
            style={{ margin: 0, maxWidth: 520 }}
            ellipsis={{ rows: 2, expandable: false }}
          >
            {String(v || "")}
          </Typography.Paragraph>
        ),
      },
      {
        title: t("evaluation.ui.metricHint", { _: "指标提示" }),
        dataIndex: "metric_hint",
        width: 180,
        render: (v: unknown) => (
          <Typography.Paragraph
            style={{ margin: 0 }}
            ellipsis={{ rows: 2, expandable: false }}
          >
            {String(v || "")}
          </Typography.Paragraph>
        ),
      },
      {
        title: t("evaluation.ui.actualOutput", { _: "实际输出" }),
        dataIndex: "actual_output",
        render: (v: unknown) => (
          <Typography.Paragraph
            style={{ margin: 0, maxWidth: 520 }}
            ellipsis={{ rows: 2, expandable: false }}
          >
            {String(v || "")}
          </Typography.Paragraph>
        ),
      },
      {
        title: t("common.status", { _: "状态" }),
        dataIndex: "status",
        width: 120,
        render: (v: unknown) => String(v || "-"),
      },
      {
        title: t("common.action", { _: "操作" }),
        width: 120,
        render: (_: unknown, r: EvalDataRow) => (
          <Button
            size="mini"
            onClick={() => {
              setJsonTitle(
                t("evaluation.ui.rowJsonTitle", { _: "行数据 JSON" }) +
                  ` #${String(r.row_index ?? "")}`,
              );
              setJsonText(
                JSON.stringify(
                  {
                    eva_doc_id: r.eva_doc_id,
                    row_index: r.row_index,
                    model_input: r.model_input,
                    expect_output: r.expect_output,
                    metric_hint: r.metric_hint,
                    actual_output: r.actual_output,
                    metric_result: r.metric_result,
                    status: r.status,
                  },
                  null,
                  2,
                ),
              );
              setJsonVisible(true);
            }}
          >
            {t("common.view", { _: "查看" })}
          </Button>
        ),
      },
    ],
    [t],
  );

  const runSearch = () => {
    setDocPage(1);
    fetchDocs(docQuery.trim());
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Space>
          <Button.Group>
            <Button
              type={scope === "self" ? "primary" : "outline"}
              onClick={() => setScope("self")}
            >
              {t("rag.ui.tabs.self", { _: "个人" })}
            </Button>
            {!isSuperAdmin && !isDefaultTenant && (
              <Button
                type={scope === "tenant" ? "primary" : "outline"}
                onClick={() => setScope("tenant")}
              >
                {t("rag.ui.tabs.tenant", { _: "租户" })}
              </Button>
            )}
            <Button
              type={scope === "system" ? "primary" : "outline"}
              onClick={() => setScope("system")}
            >
              {t("rag.ui.tabs.system", { _: "系统" })}
            </Button>
          </Button.Group>
        </Space>
      </div>
      <Card bordered style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            allowClear
            style={{ width: 320 }}
            value={docQuery}
            onChange={setDocQuery}
            placeholder={t("evaluation.ui.searchDoc", {
              _: "按标题/文件名搜索",
            })}
            onPressEnter={runSearch}
          />
          <Button
            type="primary"
            icon={<IconSearch />}
            onClick={runSearch}
            loading={docsLoading}
          >
            {t("common.search", { _: "搜索" })}
          </Button>
          <Button
            icon={<IconRefresh />}
            onClick={() => fetchDocs(docQuery.trim())}
            loading={docsLoading}
          >
            {t("common.refresh", { _: "刷新" })}
          </Button>
        </Space>
      </Card>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <Card
          bordered
          style={{ flex: 1, minWidth: 720 }}
          title={t("evaluation.ui.docList", { _: "测评文件列表" })}
        >
          <Table
            rowKey="id"
            loading={docsLoading}
            columns={docColumns as any}
            data={docs}
            pagination={{
              current: docPage,
              pageSize: docPageSize,
              total: docTotal,
              showTotal: true,
              onChange: (p: number) => setDocPage(p),
              onPageSizeChange: (ps: number) => {
                setDocPageSize(ps);
                setDocPage(1);
              },
            }}
          />
        </Card>
      </div>

      <Modal
        title={t("evaluation.ui.docDetail", { _: "测评文档详情" })}
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        style={{ width: 1100 }}
      >
        {!detailDoc ? (
          <Typography.Text type="secondary">
            {detailLoading
              ? t("common.loading", { _: "加载中..." })
              : t("evaluation.ui.selectDocTip", {
                  _: "请选择一个测评文件查看详情。",
                })}
          </Typography.Text>
        ) : (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space direction="vertical" size={2}>
              <Typography.Text>
                {t("evaluation.ui.docTitle", { _: "标题" })}：
                {detailDoc.title || detailDoc.filename || "-"}
              </Typography.Text>
              <Typography.Text type="secondary">
                {t("evaluation.ui.filename", { _: "文件名" })}：
                {detailDoc.filename || "-"}
              </Typography.Text>
              <Typography.Text type="secondary">
                {t("common.status", { _: "状态" })}：
                {String(detailDoc.status || "-")}
              </Typography.Text>
              {detailDoc.save_https && (
                <Typography.Text type="secondary">
                  {t("evaluation.ui.sourceFile", { _: "源文件" })}：
                  <a
                    href={String(detailDoc.save_https)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: 6 }}
                  >
                    {t("common.open", { _: "打开" })}
                  </a>
                </Typography.Text>
              )}
            </Space>

            <Table
              rowKey="id"
              loading={detailLoading}
              columns={rowColumns as any}
              data={detailRows}
              pagination={{
                current: detailRowPage,
                pageSize: detailRowPageSize,
                total: detailRowTotal,
                showTotal: true,
                onChange: (p: number) => {
                  setDetailRowPage(p);
                  fetchDetail(String(detailDoc.id), p, detailRowPageSize);
                },
                onPageSizeChange: (ps: number) => {
                  setDetailRowPageSize(ps);
                  setDetailRowPage(1);
                  fetchDetail(String(detailDoc.id), 1, ps);
                },
              }}
            />
          </Space>
        )}
      </Modal>

      <Modal
        title={jsonTitle}
        visible={jsonVisible}
        footer={null}
        onCancel={() => setJsonVisible(false)}
        style={{ width: 820 }}
      >
        <pre style={{ margin: 0, maxHeight: 520, overflow: "auto" }}>
          {jsonText}
        </pre>
      </Modal>
      <Modal
        title={datasetJsonTitle}
        visible={datasetJsonVisible}
        footer={null}
        onCancel={() => setDatasetJsonVisible(false)}
        style={{ width: 820 }}
      >
        <pre style={{ margin: 0, maxHeight: 520, overflow: "auto" }}>
          {datasetJsonText}
        </pre>
      </Modal>
    </>
  );
};

export default EvaluationDocsPage;

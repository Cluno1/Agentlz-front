import React, { useEffect, useMemo, useState } from "react";
import { useTranslate, useGetIdentity } from "react-admin";
import {
  Card,
  Button,
  Message,
  Space,
  Input,
  Select,
  Table,
  Tag,
  Spin,
  Typography,
  Modal,
} from "@arco-design/web-react";
import {
  IconUpload,
  IconRefresh,
  IconHistory,
} from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";
import { listAccessibleAgents } from "../../../data/api/agent";
import {
  getEvaluationContent,
  listAgentContents,
  listAgentVersions,
  listEvaluationDatasets,
  startEvaluation,
} from "../../../data/api/evaluation";
import type { EvaluationNameSpace } from "../../../data/api/evaluation/type";
import { wsClient } from "../../../data/wsClient";
import type { WSMessage } from "../../../data/wsClient";
import ToolCallInline from "../../chat/components/ToolCallInline";
import type { ToolCall } from "../../../data/api/agent/type";
import { useDarkMode } from "../../../data/hook/useDark";

type ApiAgentRow = {
  id?: number | string;
  agent_id?: number | string;
  name?: string;
  description?: string;
  avatar?: string;
  tags?: string[];
};

type EvalRow = {
  id: string;
  instruction?: string;
  input?: string;
  output?: string;
  fact_output?: string;
  score?: number;
  opinion?: string;
  tool_calls?: ToolCall[];
};

const Evaluation: React.FC = () => {
  const t = useTranslate();
  const { identity } = useGetIdentity();
  const [agents, setAgents] = useState<
    Array<{ id: string; name: string; description?: string; avatar?: string }>
  >([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentId, setAgentId] = useState<string>("");
  const navigate = useNavigate();
  const [rows, setRows] = useState<EvalRow[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [datasetType, setDatasetType] = useState<"self" | "tenant" | "system">(
    "tenant",
  );
  const [datasetQuery, setDatasetQuery] = useState("");
  const [datasets, setDatasets] = useState<
    EvaluationNameSpace.EvaluationDataset[]
  >([]);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [currentContentId, setCurrentContentId] = useState<number | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [versions, setVersions] = useState<
    EvaluationNameSpace.EvaluationVersion[]
  >([]);
  const [contents, setContents] = useState<
    EvaluationNameSpace.EvaluationContent[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<
    number | undefined
  >(undefined);
  const [contentPreview, setContentPreview] = useState<string>("");
  const [contentPreviewVisible, setContentPreviewVisible] = useState(false);
  const [detailRow, setDetailRow] = useState<EvalRow | null>(null);
  const isDark = useDarkMode();

  const fetchAgents = React.useCallback(async () => {
    try {
      setAgentsLoading(true);
      const resp = await listAccessibleAgents({
        page: 1,
        perPage: 50,
      });
      const mapped = (resp?.data ?? [])
        .map((a: ApiAgentRow) => ({
          id: String(a.id ?? a.agent_id ?? ""),
          name: a.name ?? "",
          description: a.description ?? "",
          avatar: a.avatar ?? "",
        }))
        .filter((a: { id: string }) => !!a.id);
      setAgents(mapped);
      if (!agentId && mapped.length > 0) setAgentId(mapped[0].id);
    } catch {
      Message.error(t("agent.msg.loadAgentsFail", { _: "加载失败" }));
    } finally {
      setAgentsLoading(false);
    }
  }, [t, agentId]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const wsTopic = useMemo(() => {
    const uid = identity?.id ? String(identity.id) : "";
    return uid ? `evaluation:user:${uid}` : "evaluation:global";
  }, [identity?.id]);

  const handleWsMessage = React.useCallback(
    (msg: WSMessage) => {
      if (!msg || typeof msg.type !== "string") return;
      if (msg.type === "evaluation.started") {
        setEvaluating(true);
        const contentId = Number(
          (msg.data as { eva_content_id?: number })?.eva_content_id || 0,
        );
        if (contentId > 0) setCurrentContentId(contentId);
        setRows([]);
        return;
      }
      if (msg.type === "evaluation.done") {
        setEvaluating(false);
        return;
      }
      if (msg.type !== "evaluation.item_done") return;
      const data = (msg.data || {}) as {
        eva_content_id?: number;
        item?: EvalRow;
      };
      if (
        currentContentId &&
        Number(data.eva_content_id || 0) !== currentContentId
      )
        return;
      const item = data.item || {};
      setRows((prev) => {
        const next = [...prev];
        next.push({
          id: `${next.length + 1}`,
          instruction: item.instruction,
          input: item.input,
          output: item.output,
          fact_output: item.fact_output,
          score: item.score,
          opinion: item.opinion,
          tool_calls: Array.isArray((item as { tool_calls?: ToolCall[] }).tool_calls)
            ? ((item as { tool_calls?: ToolCall[] }).tool_calls as ToolCall[])
            : [],
        });
        return next;
      });
    },
    [currentContentId],
  );

  useEffect(() => {
    wsClient.subscribe(wsTopic, handleWsMessage);
    return () => {
      wsClient.unsubscribe(wsTopic, handleWsMessage);
    };
  }, [wsTopic, handleWsMessage]);

  const fetchDatasets = React.useCallback(
    async (q: string) => {
      try {
        setDatasetLoading(true);
        const resp = await listEvaluationDatasets({
          page: 1,
          perPage: 200,
          filter: { q },
          type: datasetType,
        });
        const list = resp?.data ?? [];
        setDatasets(list);
        setSelectedDatasetId(
          (prev) => prev || (list.length > 0 ? String(list[0].id) : ""),
        );
      } catch {
        Message.error(
          t("evaluation.msg.loadDocsFail", { _: "加载测评集失败" }),
        );
      } finally {
        setDatasetLoading(false);
      }
    },
    [datasetType, t],
  );

  const getErrorMessage = React.useCallback((err: unknown) => {
    if (err && typeof err === "object" && "message" in err) {
      const msg = (err as { message?: unknown }).message;
      return typeof msg === "string" ? msg : "";
    }
    return "";
  }, []);

  useEffect(() => {
    fetchDatasets("");
  }, [fetchDatasets]);

  const handleEvaluate = React.useCallback(async () => {
    if (!agentId || !selectedDatasetId || evaluating) return;
    try {
      setEvaluating(true);
      setRows([]);
      await startEvaluation({
        eva_json_id: selectedDatasetId,
        agent_id: Number(agentId),
        type: datasetType,
      });
      Message.success(t("evaluation.msg.started", { _: "已开始评测" }));
    } catch (e: unknown) {
      Message.error(
        getErrorMessage(e) ||
          t("evaluation.msg.startFail", { _: "评测启动失败" }),
      );
      setEvaluating(false);
    }
  }, [agentId, selectedDatasetId, evaluating, datasetType, t, getErrorMessage]);

  const openHistory = React.useCallback(async () => {
    if (!agentId) return;
    try {
      setHistoryVisible(true);
      setHistoryLoading(true);
      const [versionResp, contentResp] = await Promise.all([
        listAgentVersions({ agent_id: Number(agentId), page: 1, perPage: 100 }),
        listAgentContents({ agent_id: Number(agentId), page: 1, perPage: 100 }),
      ]);
      setVersions(versionResp.data || []);
      setContents(contentResp.data || []);
      if ((versionResp.data || []).length > 0) {
        setSelectedVersionId(Number(versionResp.data[0].id));
      } else {
        setSelectedVersionId(undefined);
      }
    } catch {
      Message.error(
        t("evaluation.msg.loadDataFail", { _: "加载历史数据失败" }),
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [agentId, t]);

  const loadContentsByVersion = React.useCallback(
    async (versionId?: number) => {
      if (!agentId) return;
      setHistoryLoading(true);
      try {
        const resp = await listAgentContents({
          agent_id: Number(agentId),
          eva_version_id: versionId,
          page: 1,
          perPage: 100,
        });
        setContents(resp.data || []);
      } finally {
        setHistoryLoading(false);
      }
    },
    [agentId],
  );

  const progressText = useMemo(() => {
    const done = rows.length;
    const total = Number(
      datasets.find((x) => String(x.id) === selectedDatasetId)?.total_count ||
        0,
    );
    if (!total) return `${done}`;
    return `${done}/${total}`;
  }, [rows.length, datasets, selectedDatasetId]);

  const surfaceStyle: React.CSSProperties = {
    border: "1px solid #E5E6EB",
    borderRadius: 8,
    background: "#FFFFFF",
    boxShadow: "0 10px 28px rgba(29, 33, 41, 0.06)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", rowGap: 16 }}>
      <Card style={surfaceStyle}>
        <div style={{ marginBottom: 16 }}>
          <Typography.Title heading={6} style={{ margin: 0 }}>
            批量评测任务
          </Typography.Title>
          <Typography.Text style={{ color: "#4E5969" }}>
            选择助手和测试集后启动评测，用统一数据集验证输出质量和稳定性。
          </Typography.Text>
        </div>
        <div
          style={{
            marginBottom: 12,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            alignItems: "center",
          }}
        >
          <Space wrap>
            <Select
              style={{ minWidth: 220 }}
              value={agentId}
              onChange={setAgentId}
              placeholder={t("agent.ui.selectAgent", { _: "选择助手" })}
              loading={agentsLoading}
            >
              {agents.map((a) => (
                <Select.Option key={a.id} value={a.id}>
                  <span>{a.name}</span>
                </Select.Option>
              ))}
            </Select>
            <Button
              icon={<IconUpload />}
              onClick={() => navigate("/evaluation/datasets/upload")}
            >
              {t("evaluation.ui.uploadFile", { _: "上传测试集" })}
            </Button>
            <Button
              icon={<IconHistory />}
              onClick={openHistory}
              disabled={!agentId}
            >
              {t("evaluation.ui.history", { _: "历史测评结果" })}
            </Button>
          </Space>
        </div>
        <Space wrap style={{ marginBottom: 12, width: "100%" }}>
          <Select
            style={{ width: 150 }}
            value={datasetType}
            onChange={(v) => {
              setDatasetType(v as "self" | "tenant" | "system");
              setSelectedDatasetId("");
            }}
          >
            <Select.Option value="self">个人</Select.Option>
            <Select.Option value="tenant">租户</Select.Option>
            <Select.Option value="system">系统</Select.Option>
          </Select>
          <Input
            allowClear
            style={{ width: 200 }}
            placeholder={t("evaluation.ui.fileSearch", { _: "搜索测评集" })}
            value={datasetQuery}
            onChange={setDatasetQuery}
            onPressEnter={() => fetchDatasets(datasetQuery.trim())}
          />
          <Button
            onClick={() => fetchDatasets(datasetQuery.trim())}
            loading={datasetLoading}
          >
            {t("agent.ui.search", { _: "搜索" })}
          </Button>
          <Button
            icon={<IconRefresh />}
            onClick={() => fetchDatasets(datasetQuery.trim())}
            loading={datasetLoading}
          >
            {t("rag.ui.refresh", { _: "刷新" })}
          </Button>
          <Button
            type="primary"
            onClick={handleEvaluate}
            loading={evaluating}
            disabled={!agentId || !selectedDatasetId}
          >
            {t("evaluation.ui.start", { _: "开始评测" })}
          </Button>
        </Space>
        <Table
          rowKey="id"
          loading={datasetLoading}
          pagination={false}
          columns={[
            { title: "ID", dataIndex: "id", width: 120 },
            { title: "名称", dataIndex: "name" },
            {
              title: "范围",
              dataIndex: "scope",
              width: 100,
              render: (v: string) => <Tag>{v || "-"}</Tag>,
            },
            {
              title: "状态",
              dataIndex: "status",
              width: 100,
              render: (v: string) => <Tag>{v || "-"}</Tag>,
            },
            { title: "总数", dataIndex: "total_count", width: 100 },
            { title: "更新时间", dataIndex: "updated_at", width: 180 },
            {
              title: "操作",
              width: 100,
              render: (_, r) => (
                <Space>
                  <Button
                    type={
                      String(r.id) === selectedDatasetId ? "outline" : "primary"
                    }
                    onClick={() => setSelectedDatasetId(String(r.id))}
                  >
                    {String(r.id) === selectedDatasetId
                      ? t("rag.ui.columns.selected", { _: "已选择" })
                      : t("rag.ui.columns.select", { _: "选择" })}
                  </Button>
                </Space>
              ),
            },
          ]}
          data={datasets}
          onRow={(record) => ({
            style:
              String(record.id) === selectedDatasetId
                ? { background: "var(--color-fill-2)" }
                : {},
          })}
        />
      </Card>

      <Card style={surfaceStyle}>
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Typography.Text>
            {t("evaluation.ui.progress", { _: "评测进度" })}: {progressText}
          </Typography.Text>
          {evaluating && <Spin size={16} />}
        </div>
        <Table
          loading={false}
          pagination={false}
          rowKey="id"
          columns={[
            { title: "ID", dataIndex: "id", width: 80 },
            {
              title: "instruction",
              dataIndex: "instruction",
              width: 220,
              render: (v: string) => v || "-",
            },
            {
              title: "input",
              dataIndex: "input",
              width: 280,
              render: (v: string) => v || "-",
            },
            {
              title: "output",
              dataIndex: "output",
              width: 220,
              render: (v: string) => v || "-",
            },
            {
              title: "fact_output",
              dataIndex: "fact_output",
              render: (v: string) => v || "-",
            },
            {
              title: "score",
              dataIndex: "score",
              width: 100,
              render: (v: number) => (
                <Tag>{typeof v === "number" ? v : "-"}</Tag>
              ),
            },
            {
              title: "opinion",
              dataIndex: "opinion",
              width: 300,
              render: (v: string) => v || "-",
            },
          ]}
          data={rows}
          onRow={(record) => ({
            onClick: () => setDetailRow(record as EvalRow),
            style: { cursor: "pointer" },
          })}
        />
      </Card>

      <Modal
        title={t("evaluation.ui.detail", { _: "评测详情" })}
        visible={!!detailRow}
        onCancel={() => setDetailRow(null)}
        onOk={() => setDetailRow(null)}
        style={{ width: "min(960px, 90vw)" }}
      >
        {detailRow ? (
          <div style={{ maxHeight: "70vh", overflow: "auto", fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ marginBottom: 8 }}>
              <b>ID：</b>{detailRow.id}
              {typeof detailRow.score === "number" ? (
                <Tag style={{ marginLeft: 8 }}>score: {detailRow.score}</Tag>
              ) : null}
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>instruction：</b>
              <div style={{ whiteSpace: "pre-wrap" }}>{detailRow.instruction || "-"}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>input：</b>
              <div style={{ whiteSpace: "pre-wrap" }}>{detailRow.input || "-"}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>期望 output：</b>
              <div style={{ whiteSpace: "pre-wrap" }}>{detailRow.output || "-"}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>实际 fact_output：</b>
              <div style={{ whiteSpace: "pre-wrap" }}>{detailRow.fact_output || "-"}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>opinion：</b>
              <div style={{ whiteSpace: "pre-wrap" }}>{detailRow.opinion || "-"}</div>
            </div>
            {Array.isArray(detailRow.tool_calls) && detailRow.tool_calls.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <b>工具调用：</b>
                <ToolCallInline calls={detailRow.tool_calls} isDark={isDark} />
              </div>
            ) : (
              <div style={{ marginTop: 12, color: "#86909C" }}>本条无工具调用记录</div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        title={t("evaluation.ui.history", { _: "历史测评结果" })}
        visible={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        style={{ width: 1000 }}
      >
        <Space style={{ width: "100%", alignItems: "start" }}>
          <div style={{ width: 360 }}>
            <Typography.Text style={{ fontWeight: 600 }}>
              版本列表
            </Typography.Text>
            <Table
              rowKey="id"
              loading={historyLoading}
              pagination={false}
              style={{ marginTop: 8 }}
              columns={[
                { title: "版本ID", dataIndex: "id", width: 90 },
                { title: "创建时间", dataIndex: "created_at" },
              ]}
              data={versions}
              onRow={(record) => ({
                onClick: () => {
                  const id = Number(record.id || 0);
                  setSelectedVersionId(id);
                  loadContentsByVersion(id);
                },
                style:
                  Number(record.id || 0) === Number(selectedVersionId || 0)
                    ? { background: "var(--color-fill-2)" }
                    : {},
              })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Typography.Text style={{ fontWeight: 600 }}>
              测评结果
            </Typography.Text>
            <Table
              rowKey="id"
              loading={historyLoading}
              pagination={false}
              style={{ marginTop: 8 }}
              columns={[
                { title: "结果ID", dataIndex: "id", width: 90 },
                {
                  title: "状态",
                  dataIndex: "status",
                  width: 100,
                  render: (v: string) => <Tag>{v || "-"}</Tag>,
                },
                {
                  title: "进度",
                  render: (_, r) =>
                    `${r.completed_count || 0}/${r.total_count || 0}`,
                },
                { title: "完成时间", dataIndex: "finished_at", width: 180 },
                {
                  title: "操作",
                  width: 100,
                  render: (_, r) => (
                    <Button
                      size="mini"
                      onClick={async () => {
                        const detail = await getEvaluationContent(Number(r.id));
                        setContentPreview(String(detail.content_json || "[]"));
                        setContentPreviewVisible(true);
                      }}
                    >
                      查看
                    </Button>
                  ),
                },
              ]}
              data={contents}
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title="测评结果详情"
        visible={contentPreviewVisible}
        onCancel={() => setContentPreviewVisible(false)}
        footer={null}
        style={{ width: 860 }}
      >
        <Typography.Paragraph
          style={{ whiteSpace: "pre-wrap", maxHeight: 500, overflow: "auto" }}
        >
          {contentPreview}
        </Typography.Paragraph>
      </Modal>
    </div>
  );
};

export default Evaluation;

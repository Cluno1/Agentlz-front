import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslate, useGetIdentity } from "react-admin";
import {
  Card,
  Upload,
  Button,
  Message,
  Space,
  Input,
  Select,
  Table,
  Tag,
  Spin,
  Divider,
  Grid,
  Statistic,
  Progress,
  Avatar,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import type { UploadItem } from "@arco-design/web-react/es/Upload/interface";
import {
  IconUpload,
  IconRefresh,
  IconCheckCircle,
  IconCloseCircle,
} from "@arco-design/web-react/icon";
import { listAccessibleAgents, chatAgentStream } from "../../../data/api/agent";
import type {
  AgentChatInput,
  AgentChatStreamChunk,
} from "../../../data/api/agent/type";
import { wsClient } from "../../../data/wsClient";
import type { WSMessage } from "../../../data/wsClient";

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
  data: Record<string, string>;
  question: string;
  expected?: string;
  answer?: string;
  timeMs?: number;
  correct?: boolean;
};

const Evaluation: React.FC = () => {
  const t = useTranslate();
  const { identity } = useGetIdentity();
  const [agents, setAgents] = useState<
    Array<{ id: string; name: string; description?: string; avatar?: string }>
  >([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentId, setAgentId] = useState<string>("");
  const [agentQuery, setAgentQuery] = useState<string>("");
  const [selectOpen, setSelectOpen] = useState(false);

  const [fileList, setFileList] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [rows, setRows] = useState<EvalRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [questionCol, setQuestionCol] = useState<string>("");
  const [answerCol, setAnswerCol] = useState<string>("");
  const [evaluating, setEvaluating] = useState(false);
  const abortCtrlRef = useRef<AbortController | null>(null);

  const headers = useMemo(() => csvHeaders, [csvHeaders]);

  const fetchAgents = React.useCallback(
    async (q: string) => {
      try {
        setAgentsLoading(true);
        const resp = await listAccessibleAgents({
          page: 1,
          perPage: 50,
          filter: { q },
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
        if (!agentId && mapped.length) setAgentId(mapped[0].id);
      } catch {
        Message.error(t("agent.msg.loadAgentsFail", { _: "加载失败" }));
      } finally {
        setAgentsLoading(false);
      }
    },
    [t, agentId],
  );

  useEffect(() => {
    fetchAgents("");
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
        return;
      }
      if (msg.type === "evaluation.done") {
        setEvaluating(false);
        return;
      }
      if (msg.type !== "evaluation.item_done") return;
      const data = (msg.data || {}) as {
        row_id?: string | number;
        row_index?: number;
        question?: string;
        expected?: string;
        answer?: string;
        time_ms?: number;
        correct?: boolean;
      };
      const rowId =
        data.row_id !== undefined
          ? String(data.row_id)
          : typeof data.row_index === "number"
            ? String(data.row_index)
            : "";
      setRows((prev) => {
        const copy = [...prev];
        let idx = -1;
        if (rowId) idx = copy.findIndex((x) => x.id === rowId);
        if (idx === -1 && typeof data.row_index === "number") {
          idx =
            data.row_index >= 0 && data.row_index < copy.length
              ? data.row_index
              : -1;
        }
        if (idx !== -1) {
          copy[idx] = {
            ...copy[idx],
            answer: data.answer ?? copy[idx].answer,
            timeMs: data.time_ms ?? copy[idx].timeMs,
            correct: data.correct ?? copy[idx].correct,
          };
          return copy;
        }
        if (data.question || data.answer) {
          copy.push({
            id: rowId || `${copy.length + 1}`,
            question: data.question || "",
            expected: data.expected,
            answer: data.answer,
            timeMs: data.time_ms,
            correct: data.correct,
            data: {},
          });
        }
        return copy;
      });
    },
    [setRows],
  );

  useEffect(() => {
    wsClient.subscribe(wsTopic, handleWsMessage);
    return () => {
      wsClient.unsubscribe(wsTopic, handleWsMessage);
    };
  }, [wsTopic, handleWsMessage]);

  const runAgentSearch = React.useCallback(() => {
    const q = agentQuery.trim();
    fetchAgents(q);
    setSelectOpen(true);
  }, [agentQuery, fetchAgents]);

  const toText = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (!lines.length) return [];
    const headerLine = lines[0];
    const hs = headerLine.split(",").map((h) => h.trim());
    setCsvHeaders(hs);
    const list: EvalRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const rec: Record<string, string> = {};
      hs.forEach((h, idx) => {
        rec[h] = (cols[idx] || "").trim();
      });
      const id = `${i}`;
      list.push({
        id,
        data: rec,
        question: rec[hs[0]] || "",
        expected: rec[hs[1]] || "",
      });
    }
    return list;
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      const file = fileList[0]?.originFile as File;
      if (!file) return;
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (ext === "csv") {
        const text = await toText(file);
        const parsed = parseCsv(text);
        setRows(parsed);
        const hs = Object.keys(parsed[0] || {});
        const qc =
          hs.find((h) => h.toLowerCase().includes("question")) || hs[0];
        const ac =
          hs.find((h) => h.toLowerCase().includes("answer")) || hs[1] || "";
        setQuestionCol(qc || "");
        setAnswerCol(ac || "");
        Message.success(t("common.success", { _: "解析成功" }));
      } else {
        Message.info(
          t("evaluation.msg.xlsxUnsupported", {
            _: "暂不支持xlsx解析，请使用CSV",
          }),
        );
      }
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? (e as { message?: string }).message
          : undefined;
      Message.error(msg || t("rag.msg.uploadError", { _: "解析失败" }));
    } finally {
      setUploading(false);
    }
  };

  const normalize = (s?: string) =>
    String(s || "")
      .toLowerCase()
      .replace(/[\s\r\n]+/g, " ")
      .trim();

  const compare = (pred?: string, gt?: string) => {
    const a = normalize(pred);
    const b = normalize(gt);
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.includes(b)) return true;
    return false;
  };

  const handleEvaluate = async () => {
    if (!agentId || !rows.length || evaluating) return;
    try {
      setEvaluating(true);
      abortCtrlRef.current = new AbortController();
      const next: EvalRow[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const q =
          (r.data && questionCol ? r.data[questionCol] : undefined) ??
          r.question ??
          "";
        const gt =
          (r.data && answerCol ? r.data[answerCol] : undefined) ??
          r.expected ??
          "";
        const ts = Date.now();
        const payload: AgentChatInput = {
          agent_id: Number.isNaN(Number(agentId)) ? undefined : Number(agentId),
          type: 0,
          meta: { user_id: String(identity?.id ?? "") },
          message: q,
        };
        let text = "";
        try {
          const gen = chatAgentStream(payload, {
            signal: abortCtrlRef.current?.signal,
          });
          for await (const chunk of gen as AsyncGenerator<
            AgentChatStreamChunk,
            void,
            unknown
          >) {
            text += chunk.delta || chunk.text || "";
            if (chunk.done) break;
          }
        } catch {
          void 0;
        }
        const dur = Date.now() - ts;
        const correct = compare(text, gt);
        next.push({
          id: r.id,
          question: q,
          expected: gt,
          answer: text,
          timeMs: dur,
          correct,
          data: undefined,
        });
        setRows((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex((x) => x.id === r.id);
          if (idx !== -1)
            copy[idx] = {
              ...copy[idx],
              answer: text,
              timeMs: dur,
              correct,
            };
          return copy;
        });
      }
    } finally {
      setEvaluating(false);
      abortCtrlRef.current = null;
    }
  };

  const accuracy = useMemo(() => {
    const done = rows.filter((r) => typeof r.correct === "boolean");
    if (!done.length) return 0;
    const ok = done.filter((r) => r.correct).length;
    return Math.round((ok / done.length) * 100);
  }, [rows]);

  const avgTimeMs = useMemo(() => {
    const done = rows.filter((r) => typeof r.timeMs === "number");
    if (!done.length) return 0;
    const sum = done.reduce((acc, cur) => acc + (cur.timeMs || 0), 0);
    return Math.round(sum / done.length);
  }, [rows]);

  const totalCount = useMemo(() => rows.length, [rows]);
  const evaluatedCount = useMemo(
    () => rows.filter((r) => typeof r.timeMs === "number").length,
    [rows],
  );
  const correctCount = useMemo(
    () => rows.filter((r) => r.correct === true).length,
    [rows],
  );
  const wrongCount = useMemo(
    () => rows.filter((r) => r.correct === false).length,
    [rows],
  );
  const pendingCount = useMemo(
    () => Math.max(0, totalCount - evaluatedCount),
    [totalCount, evaluatedCount],
  );
  const donePercent = useMemo(() => {
    if (!totalCount) return 0;
    return Math.round((evaluatedCount / totalCount) * 100);
  }, [totalCount, evaluatedCount]);

  return (
    <div style={{ display: "flex", flexDirection: "column", rowGap: 16 }}>
      <Card>
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Space>
            <Input
              allowClear
              style={{ width: 280 }}
              placeholder={t("agent.ui.searchPlaceholder", {
                _: "按名称/描述搜索",
              })}
              value={agentQuery}
              onChange={setAgentQuery}
              onPressEnter={runAgentSearch}
            />
            <Button
              type="primary"
              onClick={runAgentSearch}
              loading={agentsLoading}
            >
              {t("agent.ui.search", { _: "搜索" })}
            </Button>
          </Space>
          <Space>
            <Select
              style={{ width: 320 }}
              value={agentId}
              onChange={setAgentId}
              placeholder={t("agent.ui.selectAgent", { _: "选择助手" })}
              loading={agentsLoading}
              triggerProps={{
                popupVisible: selectOpen,
                onVisibleChange: setSelectOpen,
              }}
            >
              {agents.map((a) => (
                <Select.Option key={a.id} value={a.id}>
                  <Space>
                    <Avatar size={20} style={{ backgroundColor: "#f6f7fb" }}>
                      {a.avatar ? (
                        <img src={a.avatar} alt={a.name} />
                      ) : (
                        a.name?.slice(0, 1) || "A"
                      )}
                    </Avatar>
                    <span>{a.name}</span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Space>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Space>
            {agentId && (
              <Space>
                <Avatar size={32} style={{ backgroundColor: "#f6f7fb" }}>
                  {agents.find((x) => x.id === agentId)?.avatar ? (
                    <img
                      src={agents.find((x) => x.id === agentId)?.avatar || ""}
                      alt={agents.find((x) => x.id === agentId)?.name || ""}
                    />
                  ) : (
                    (agents.find((x) => x.id === agentId)?.name || "A").slice(
                      0,
                      1,
                    )
                  )}
                </Avatar>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <Typography.Text style={{ fontWeight: 600 }}>
                    {agents.find((x) => x.id === agentId)?.name || "-"}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    {agents.find((x) => x.id === agentId)?.description || ""}
                  </Typography.Text>
                </div>
              </Space>
            )}
          </Space>
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder={t("evaluation.ui.questionCol", { _: "问题列" })}
              value={questionCol}
              onChange={setQuestionCol}
            >
              {headers.map((h) => (
                <Select.Option key={h} value={h}>
                  {h}
                </Select.Option>
              ))}
            </Select>
            <Select
              style={{ width: 200 }}
              placeholder={t("evaluation.ui.answerCol", { _: "答案列" })}
              value={answerCol}
              onChange={setAnswerCol}
            >
              {headers.map((h) => (
                <Select.Option key={h} value={h}>
                  {h}
                </Select.Option>
              ))}
            </Select>
          </Space>
        </div>
        <Upload
          drag
          autoUpload={false}
          fileList={fileList}
          accept=".xlsx,.csv"
          onChange={(list: UploadItem[]) => {
            setFileList(list);
          }}
        />
        <Space style={{ marginTop: 12 }}>
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
              setRows([]);
              setQuestionCol("");
              setAnswerCol("");
            }}
            disabled={!fileList.length}
          >
            {t("rag.ui.clear", { _: "清空" })}
          </Button>
          <Button
            type="primary"
            onClick={handleEvaluate}
            loading={evaluating}
            disabled={!agentId || !questionCol || !rows.length}
          >
            {t("evaluation.ui.start", { _: "开始评测" })}
          </Button>
        </Space>
      </Card>

      {rows.length > 0 && (
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Space>
              <Tag color="arcoblue">
                {t("rag.ui.selected.count", { _: "已选择" })}: {rows.length}
              </Tag>
            </Space>
            <Space>
              <Button
                type="primary"
                onClick={handleEvaluate}
                loading={evaluating}
                disabled={!agentId || !questionCol || !rows.length}
              >
                {t("evaluation.ui.start", { _: "开始评测" })}
              </Button>
            </Space>
          </div>
          <Grid.Row gutter={16} style={{ marginBottom: 12 }}>
            <Grid.Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card bordered hoverable>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Progress
                    type="circle"
                    percent={accuracy}
                    style={{ marginRight: 12 }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Typography.Text style={{ fontWeight: 600 }}>
                      {t("evaluation.ui.accuracy", { _: "准确率" })}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {t("evaluation.ui.avgTime", { _: "平均用时" })}:{" "}
                      {avgTimeMs}ms
                    </Typography.Text>
                  </div>
                </div>
              </Card>
            </Grid.Col>
            <Grid.Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card bordered hoverable>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <Statistic
                    title={t("evaluation.ui.columns.correct", {
                      _: "是否正确",
                    })}
                    value={`${correctCount}/${evaluatedCount}`}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Tag color="green">
                      {t("common.yes", { _: "是" })}: {correctCount}
                    </Tag>
                    <Tag color="red">
                      {t("common.no", { _: "否" })}: {wrongCount}
                    </Tag>
                  </div>
                </div>
              </Card>
            </Grid.Col>
            <Grid.Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card bordered hoverable>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <Statistic
                    title={t("evaluation.ui.total", { _: "总题数" })}
                    value={totalCount}
                  />
                  <Tooltip content={`${donePercent}%`}>
                    <Progress percent={donePercent} status="normal" />
                  </Tooltip>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Tag color="arcoblue">
                      {t("evaluation.ui.done", { _: "已评测" })}:{" "}
                      {evaluatedCount}
                    </Tag>
                    <Tag>
                      {t("evaluation.ui.pending", { _: "未评测" })}:{" "}
                      {pendingCount}
                    </Tag>
                  </div>
                </div>
              </Card>
            </Grid.Col>
            <Grid.Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card bordered hoverable>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar size={40} style={{ backgroundColor: "#f6f7fb" }}>
                    {agents.find((x) => x.id === agentId)?.avatar ? (
                      <img
                        src={agents.find((x) => x.id === agentId)?.avatar || ""}
                        alt={agents.find((x) => x.id === agentId)?.name || ""}
                      />
                    ) : (
                      (agents.find((x) => x.id === agentId)?.name || "A").slice(
                        0,
                        1,
                      )
                    )}
                  </Avatar>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Typography.Text style={{ fontWeight: 600 }}>
                      {agents.find((x) => x.id === agentId)?.name || "-"}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {agents.find((x) => x.id === agentId)?.description || ""}
                    </Typography.Text>
                  </div>
                </div>
              </Card>
            </Grid.Col>
          </Grid.Row>
          <Divider />
          <Table
            loading={evaluating && !rows.length}
            pagination={false}
            rowKey="id"
            expandedRowRender={(record) => (
              <div style={{ display: "flex", gap: 12 }}>
                <Card style={{ flex: 1 }} bordered>
                  <Typography.Text style={{ fontWeight: 600 }}>
                    {t("evaluation.ui.columns.expected", { _: "期望答案" })}
                  </Typography.Text>
                  <Typography.Paragraph style={{ marginBottom: 0 }}>
                    {record.expected || "-"}
                  </Typography.Paragraph>
                </Card>
                <Card style={{ flex: 1 }} bordered>
                  <Typography.Text style={{ fontWeight: 600 }}>
                    {t("evaluation.ui.columns.answer", { _: "生成答案" })}
                  </Typography.Text>
                  <Typography.Paragraph style={{ marginBottom: 0 }}>
                    {record.answer || "-"}
                  </Typography.Paragraph>
                </Card>
              </div>
            )}
            columns={[
              { title: "ID", dataIndex: "id", width: 80 },
              {
                title: t("evaluation.ui.columns.question", { _: "问题" }),
                dataIndex: "question",
                width: 280,
                render: (v: string) => (
                  <Tooltip content={v || "-"}>
                    <Typography.Paragraph
                      style={{ marginBottom: 0 }}
                      ellipsis={{ rows: 2 }}
                    >
                      {v || "-"}
                    </Typography.Paragraph>
                  </Tooltip>
                ),
              },
              {
                title: t("evaluation.ui.columns.expected", { _: "期望答案" }),
                dataIndex: "expected",
                width: 280,
                render: (v: string) => (
                  <Tooltip content={v || "-"}>
                    <Typography.Paragraph
                      style={{ marginBottom: 0 }}
                      ellipsis={{ rows: 2 }}
                    >
                      {v || "-"}
                    </Typography.Paragraph>
                  </Tooltip>
                ),
              },
              {
                title: t("evaluation.ui.columns.answer", { _: "生成答案" }),
                dataIndex: "answer",
                render: (v: string) => (
                  <Tooltip content={v || "-"}>
                    <Typography.Paragraph
                      style={{ marginBottom: 0 }}
                      ellipsis={{ rows: 2 }}
                    >
                      {v || "-"}
                    </Typography.Paragraph>
                  </Tooltip>
                ),
              },
              {
                title: t("evaluation.ui.columns.time", { _: "用时(ms)" }),
                dataIndex: "timeMs",
                width: 140,
                render: (v: unknown) =>
                  typeof v === "number" ? `${v}ms` : "-",
              },
              {
                title: t("evaluation.ui.columns.correct", { _: "是否正确" }),
                dataIndex: "correct",
                width: 140,
                render: (v: unknown) =>
                  typeof v === "boolean" ? (
                    <Space>
                      {v ? (
                        <IconCheckCircle style={{ color: "#04C877" }} />
                      ) : (
                        <IconCloseCircle style={{ color: "#F53F3F" }} />
                      )}
                      <Tag color={v ? "green" : "red"}>
                        {v
                          ? t("common.yes", { _: "是" })
                          : t("common.no", { _: "否" })}
                      </Tag>
                    </Space>
                  ) : (
                    <Tag>...</Tag>
                  ),
              },
            ]}
            data={rows}
          />
          {evaluating && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 12,
              }}
            >
              <Spin />
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Evaluation;

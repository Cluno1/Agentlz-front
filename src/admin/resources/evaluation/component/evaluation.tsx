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
} from "@arco-design/web-react";
import type { UploadItem } from "@arco-design/web-react/es/Upload/interface";
import { IconUpload, IconRefresh } from "@arco-design/web-react/icon";
import { listAccessibleAgents, chatAgentStream } from "../../../data/api/agent";
import type {
  AgentChatInput,
  AgentChatStreamChunk,
} from "../../../data/api/agent/type";

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
    Array<{ id: string; name: string; description?: string }>
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
              style={{ width: 280 }}
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
                  {a.name}
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
        </Space>
      </Card>

      {rows.length > 0 && (
        <Card>
          <Space style={{ marginBottom: 12 }}>
            <Tag color="arcoblue">
              {t("rag.ui.selected.count", { _: "已选择" })}: {rows.length}
            </Tag>
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
            <Button
              type="primary"
              onClick={handleEvaluate}
              loading={evaluating}
              disabled={!agentId || !questionCol}
            >
              {t("evaluation.ui.start", { _: "开始评测" })}
            </Button>
          </Space>
          <Divider />
          <Space style={{ marginBottom: 12 }}>
            <Tag color="green">
              {t("evaluation.ui.accuracy", { _: "准确率" })}: {accuracy}%
            </Tag>
            <Tag color="gold">
              {t("evaluation.ui.avgTime", { _: "平均用时" })}: {avgTimeMs}ms
            </Tag>
          </Space>
          <Table
            loading={evaluating && !rows.length}
            pagination={false}
            rowKey="id"
            columns={[
              { title: "ID", dataIndex: "id", width: 80 },
              {
                title: t("evaluation.ui.columns.question", { _: "问题" }),
                dataIndex: "question",
                width: 240,
              },
              {
                title: t("evaluation.ui.columns.expected", { _: "期望答案" }),
                dataIndex: "expected",
                width: 240,
              },
              {
                title: t("evaluation.ui.columns.answer", { _: "生成答案" }),
                dataIndex: "answer",
              },
              {
                title: t("evaluation.ui.columns.time", { _: "用时(ms)" }),
                dataIndex: "timeMs",
                width: 120,
                render: (v: unknown) => (typeof v === "number" ? v : "-"),
              },
              {
                title: t("evaluation.ui.columns.correct", { _: "是否正确" }),
                dataIndex: "correct",
                width: 120,
                render: (v: unknown) =>
                  typeof v === "boolean" ? (
                    <Tag color={v ? "green" : "red"}>
                      {v
                        ? t("common.yes", { _: "是" })
                        : t("common.no", { _: "否" })}
                    </Tag>
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

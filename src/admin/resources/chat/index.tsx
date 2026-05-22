/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Avatar,
  Button,
  Card,
  Input,
  Message,
  Select,
  Space,
  Spin,
  Tag,
  Empty,
  Drawer,
} from "@arco-design/web-react";
import { IconUser, IconCopy, IconSearch, IconDownload } from "@arco-design/web-react/icon";
import { useTranslate, useGetIdentity } from "react-admin";
import { type AgentInfo, type ChatMessage } from "../../data/agent";
import {
  chatAgentStream,
  listAgentChatSessions,
} from "../../data/api/agent";
import type {
  AgentChatInput,
  AgentChatRecord,
  AgentChatStreamChunk,
  ArtifactFile,
  PdcEventEnvelope,
} from "../../data/api/agent/type";
import HistoryDrawer from "./components/HistoryDrawer";
import { listAccessibleAgents } from "../../data/api/agent";
import { useDarkMode } from "../../data/hook/useDark";
import PdcTracePanel from "./components/PdcTracePanel";
import { dispatchSseChunk } from "./sseRegistry";
import ToolCallInline from "./components/ToolCallInline";
import type { ToolCall } from "../../data/api/agent/type";
type ApiAgentRow = {
  id?: number | string;
  agent_id?: number | string;
  name?: string;
  description?: string;
  avatar?: string;
  tags?: string[];
};

function pdcPayloadToText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function assistantTextFromPdcEvent(event: PdcEventEnvelope): string {
  if (event.evt !== "final") return "";
  const payload = event.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const value = (payload as Record<string, unknown>).text ??
      (payload as Record<string, unknown>).content ??
      (payload as Record<string, unknown>).message;
    if (value != null) return pdcPayloadToText(value);
  }
  return pdcPayloadToText(event.payload);
}

function tryParseArtifactJsonText(text: string): unknown[] {
  const values: unknown[] = [];
  const pushJson = (candidate: string) => {
    const raw = candidate.trim();
    if (!raw) return;
    const variants = [
      raw,
      raw
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'"),
    ];
    for (const item of variants) {
      try {
        values.push(JSON.parse(item));
        return;
      } catch {
        // continue
      }
    }
  };
  pushJson(text);
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    pushJson(text.slice(start, end + 1));
  }
  const contentPattern = /content=(['"])([\s\S]*?)\1(?:\s+\w+=|$)/g;
  for (const match of text.matchAll(contentPattern)) {
    pushJson(match[2] || "");
  }
  return values;
}

function artifactNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const name = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
    return name || "文件";
  } catch {
    return "文件";
  }
}

const ARTIFACT_EXTS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv", "txt", "md", "rtf",
  "odt", "odp", "ods",
  "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "tiff", "heic",
  "zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz",
  "mp3", "mp4", "mov", "avi", "wav", "flac", "ogg", "webm", "m4a", "mkv",
  "json", "xml", "yaml", "yml",
]);

function isLikelyArtifactUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const last = pathname.split("/").filter(Boolean).pop() || "";
    const dot = last.lastIndexOf(".");
    if (dot < 0) return false;
    return ARTIFACT_EXTS.has(last.slice(dot + 1));
  } catch {
    return false;
  }
}

function normalizeArtifactPayload(payload: unknown): ArtifactFile[] {
  const found: ArtifactFile[] = [];
  const visit = (value: unknown) => {
    if (!value) return;
    if (typeof value === "string") {
      for (const parsed of tryParseArtifactJsonText(value)) visit(parsed);
      const markdownPattern = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g;
      for (const match of value.matchAll(markdownPattern)) {
        const label = match[0].split("]", 1)[0].replace("[", "").replace(/^下载\s*/, "").trim();
        found.push({
          url: match[1],
          filename: label || artifactNameFromUrl(match[1]),
        });
      }
      const urlPattern = /https?:\/\/[^\s)'"]+/g;
      for (const match of value.matchAll(urlPattern)) {
        const url = match[0].replace(/[，。,.;]+$/, "");
        found.push({
          url,
          filename: artifactNameFromUrl(url),
        });
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value !== "object") return;
    const item = value as Record<string, unknown>;
    const url = String(item.url || "");
    if (/^https?:\/\//.test(url)) {
      found.push({
        ...item,
        url,
        filename: String(item.filename || "文件"),
        artifact_type: item.artifact_type ? String(item.artifact_type) : undefined,
        content_type: item.content_type ? String(item.content_type) : undefined,
        size: (item.size as ArtifactFile["size"]) ?? null,
        cos_key: item.cos_key ? String(item.cos_key) : undefined,
        request_id: item.request_id ? String(item.request_id) : undefined,
        markdown: item.markdown ? String(item.markdown) : undefined,
      });
    }
    visit(item.artifact);
    visit(item.artifacts);
    visit(item.files);
  };
  visit(payload);
  const seen = new Set<string>();
  return found.filter((item) => {
    if (seen.has(item.url)) return false;
    if (!isLikelyArtifactUrl(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function appendArtifactsForMessage(
  setArtifactsByMsg: React.Dispatch<React.SetStateAction<Record<string, ArtifactFile[]>>>,
  messageId: string,
  artifacts: ArtifactFile[],
) {
  if (!messageId || !artifacts.length) return;
  setArtifactsByMsg((prev) => {
    const existing = prev[messageId] || [];
    const seen = new Set(existing.map((item) => item.url));
    const nextItems = artifacts.filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
    if (!nextItems.length) return prev;
    return {
      ...prev,
      [messageId]: [...existing, ...nextItems],
    };
  });
}

function artifactLabel(item: ArtifactFile): string {
  const type = String(item.artifact_type || "").toUpperCase();
  const name = item.filename || "文件";
  return type ? `下载 ${type}` : `下载 ${name}`;
}

const ArtifactDownloads: React.FC<{ artifacts: ArtifactFile[]; isDark?: boolean }> = ({
  artifacts,
  isDark,
}) => {
  if (!artifacts.length) return null;
  const borderColor = isDark ? "rgba(96, 165, 250, 0.28)" : "rgba(59, 130, 246, 0.16)";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0", borderColor }}>
      {artifacts.map((item) => (
        <a
          key={`${item.url}-${item.filename || ""}`}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          title={item.filename || item.url}
          style={{ textDecoration: "none" }}
        >
          <Button type="primary" size="small" icon={<IconDownload />} style={{ borderRadius: 6 }}>
            {artifactLabel(item)}
          </Button>
        </a>
      ))}
    </div>
  );
};

const Chat: React.FC = () => {
  const t = useTranslate();
  const { identity } = useGetIdentity();
  /** 可选助手列表 */
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  /** 助手列表加载中 */
  const [agentsLoading, setAgentsLoading] = useState(false);
  /** 当前选中的助手ID */
  const [agentId, setAgentId] = useState<string>("");
  /** 顶部搜索框的关键词 */
  const [query, setQuery] = useState<string>("");
  /** 助手选择下拉是否打开 */
  const [selectOpen, setSelectOpen] = useState(false);
  /** 当前对话消息列表（包含用户和助手） */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /** 输入框内容 */
  const [input, setInput] = useState<string>("");
  /** 是否处于流式回复中 */
  const [streaming, setStreaming] = useState<boolean>(false);
  /** 中间步骤（例如检索/生成等过程展示） */
  const [steps, setSteps] = useState<
    Array<{ step: string; detail?: Record<string, unknown> }>
  >([]);
  const [pdcEvents, setPdcEvents] = useState<PdcEventEnvelope[]>([]);
  const [pdcOpen, setPdcOpen] = useState(false);
  const [toolCallsByMsg, setToolCallsByMsg] = useState<Record<string, ToolCall[]>>({});
  const [artifactsByMsg, setArtifactsByMsg] = useState<Record<string, ArtifactFile[]>>({});
  /** 流式中止标记（用于用户点击“停止”） */
  const streamAbortRef = useRef<{ aborted: boolean }>({ aborted: false });
  /** 当前流式请求的 AbortController */
  const abortCtrlRef = useRef<AbortController | null>(null);
  /** 当前助手消息在 messages 中的 ID（用于累积增量） */
  const assistantIdRef = useRef<string | null>(null);
  /** 消息列表容器 Ref（滚动控制） */
  const listRef = useRef<HTMLDivElement | null>(null);
  /** 暗色模式标识 */
  const { isDark } = useDarkMode();
  /** 当前会话记录ID（有则为续聊，无则为新对话） */
  const [recordId, setRecordId] = useState<number | null>(null);
  /** 会话加载状态（历史会话拉取中） */
  const [sessionsLoading, setSessionsLoading] = useState(false);
  /** 历史抽屉是否可见 */
  const [historyVisible, setHistoryVisible] = useState(false);
  /** 当前用户头像（从本地 identity 读取） */
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  /** 会话分页当前页码 */
  const [sessionsPage, setSessionsPage] = useState(1);
  /** 会话分页每页数量 */
  const [sessionsPerPage] = useState(25);
  /** 会话总条数 */
  const [sessionsTotal, setSessionsTotal] = useState(0);
  /** 已加载的会话条数（用于滚动加载判断） */
  const [sessionsLoadedCount, setSessionsLoadedCount] = useState(0);
  /** 历史会话强制重载标记（支持点击当前 record 重新加载） */
  const [sessionsReloadKey, setSessionsReloadKey] = useState(0);
  /** 上一次更新是否是向前追加（用于保持滚动位置） */
  const lastUpdateWasPrependRef = useRef(false);
  /** 是否由历史记录选择触发加载（仅在 onPick 时为真） */
  const continueRef = useRef(false);
  /** 最近一次点击的历史 record，用于零 session 记录兜底展示 */
  const selectedHistoryRecordRef = useRef<AgentChatRecord | null>(null);
  /** 会话加载互斥锁，避免重复触发 */
  const sessionsFetchLockRef = useRef(false);
  /** 是否允许分页加载（滚动增页/请求下一页的开关） */
  const sessionsPagingEnabledRef = useRef(false);
  /** 悬停的消息ID（用于显示复制按钮） */
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(import.meta.env.VITE_IDENTITY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUserAvatar(parsed?.avatar || null);
      }
    } catch {
      setUserAvatar(null);
    }
  }, []);

  const fetchAgents = React.useCallback(
    async (q: string) => {
      try {
        setAgentsLoading(true);
        const resp = await listAccessibleAgents({
          page: 1,
          perPage: 50,
          filter: { q },
        });
        const rows = (resp?.data ?? []) as ApiAgentRow[];
        const mapped: AgentInfo[] = rows.map((a) => ({
          id: String(a.id ?? a.agent_id ?? ""),
          name: a.name ?? "",
          description: a.description ?? "",
          avatar: a.avatar,
          tags: a.tags ?? [],
        }));
        setAgents(mapped);
      } catch {
        Message.error(t("agent.msg.loadAgentsFail", { _: "加载失败" }));
      } finally {
        setAgentsLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchAgents("");
  }, [fetchAgents]);

  // 搜索仅在用户点击按钮或按下回车时触发
  const runAgentSearch = React.useCallback(() => {
    const q = query.trim();
    fetchAgents(q);
    setSelectOpen(true);
  }, [query, fetchAgents]);

  useEffect(() => {
    if (!agentId && agents.length > 0) setAgentId(agents[0].id);
  }, [agents, agentId]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (lastUpdateWasPrependRef.current) {
      lastUpdateWasPrependRef.current = false;
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const currentAgent = useMemo(
    () => agents.find((a) => a.id === agentId),
    [agents, agentId],
  );

  const appendPdcEvent = React.useCallback((event: PdcEventEnvelope) => {
    setPdcEvents((prev) => [...prev, event]);
    if (event.evt === "chain.step") {
      const step = String(event.payload || "");
      if (step) {
        setSteps((prev) => [...prev, { step, detail: { trace_id: event.trace_id } }]);
      }
    }
  }, []);

  const onToolCall = React.useCallback((event: PdcEventEnvelope) => {
    const mid = assistantIdRef.current;
    if (!mid) return;
    const tc = (event.payload || {}) as ToolCall;
    setToolCallsByMsg((prev) => ({
      ...prev,
      [mid]: [...(prev[mid] || []), tc],
    }));
    appendArtifactsForMessage(
      setArtifactsByMsg,
      mid,
      normalizeArtifactPayload(tc.output || event.payload),
    );
  }, []);

  const onArtifact = React.useCallback((event: PdcEventEnvelope) => {
    const mid = assistantIdRef.current;
    if (!mid) return;
    const artifacts = normalizeArtifactPayload(event.payload);
    appendArtifactsForMessage(setArtifactsByMsg, mid, artifacts);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !agentId || streaming) return;
    // 清空当前的步骤
    setSteps([]);
    setPdcEvents([]);
    streamAbortRef.current.aborted = false;
    const ts = Date.now();
    const assistantId = `${ts}-a`;
    assistantIdRef.current = assistantId;
    const userMsg: ChatMessage = {
      id: `${ts}-u`,
      role: "user",
      content: text,
      createdAt: ts,
    };
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: ts,
      },
    ]);
    setInput("");
    setStreaming(true);
    try {
      abortCtrlRef.current = new AbortController();
      const isContinue = recordId != null;
      const appendAssistant = (content: string) => {
        if (!content) return;
        setMessages((prev) => {
          const next = [...prev];
          const idx = next.findIndex((m) => m.id === assistantIdRef.current);
          if (idx !== -1)
            next[idx] = {
              ...next[idx],
              content: next[idx].content + content,
            };
          return next;
        });
      };

      const gen = chatAgentStream(
        {
          agent_id: Number.isNaN(Number(agentId)) ? undefined : Number(agentId),
          type: (isContinue ? 1 : 0) as 0 | 1,
          meta: { user_id: String(identity?.id ?? "") },
          message: text,
          ...(isContinue ? { record_id: recordId as number } : {}),
        } as AgentChatInput,
        {
          signal: abortCtrlRef.current.signal,
        },
      );

      for await (const chunk of gen as AsyncGenerator<
        AgentChatStreamChunk & { record_id?: number },
        void,
        unknown
      >) {
        if (streamAbortRef.current.aborted) break;
        const _stop = dispatchSseChunk(chunk, {
          appendPdcEvent,
          onToolCall,
          onArtifact,
          appendAssistant,
          assistantTextFromPdcEvent,
          onRecordId: (id: number) => {
            if (recordId == null && !Number.isNaN(id)) setRecordId(id);
          },
        });
        if (_stop) break;
      }
    } catch (e) {
      Message.error(t("agent.msg.streamFail", { _: "流式失败" }));
    } finally {
      setStreaming(false);
      streamAbortRef.current.aborted = false;
      abortCtrlRef.current = null;
      assistantIdRef.current = null;
    }
  };

  const fetchSessions = React.useCallback(async () => {
    console.log(
      "进入fetchSessions 变量检查",
      agentId,
      recordId,
      streaming,
      continueRef.current,
      sessionsPage,
      sessionsPerPage,
      sessionsTotal,
      sessionsLoadedCount,
    );
    if (!agentId || !recordId || streaming || !continueRef.current) return;
    if (sessionsPage > 1 && !sessionsPagingEnabledRef.current) return;
    if (sessionsFetchLockRef.current) return;
    try {
      sessionsFetchLockRef.current = true;
      setSessionsLoading(true);
      const resp = await listAgentChatSessions({
        agent_id: Number.isNaN(Number(agentId)) ? undefined : Number(agentId),
        meta: { user_id: String(identity?.id ?? "") },
        record_id: recordId as number,
        page: sessionsPage,
        per_page: sessionsPerPage,
      });
      const rows = resp.data || [];
      if (sessionsPage === 1) {
        sessionsPagingEnabledRef.current = true;
      }
      setSessionsTotal(resp.total || 0);
      setSessionsLoadedCount((prev) =>
        sessionsPage === 1 ? rows.length : prev + rows.length,
      );
      const el = listRef.current;
      const prevHeight = el?.scrollHeight ?? 0;
      const prevTop = el?.scrollTop ?? 0;
      const list: Array<{
        id: string;
        role: "user" | "assistant" | "system";
        content: string;
        createdAt: number;
      }> = [];
      const pickText = (v: unknown): string | undefined => {
        if (typeof v === "string") return v;
        if (!v || typeof v !== "object") return undefined;
        const vv = v as Record<string, unknown>;
        const text = vv.text ?? vv.content ?? vv.message ?? vv.value;
        return typeof text === "string" ? text : undefined;
      };
      const getCount = (v: unknown): number | undefined => {
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string") {
          const n = Number(v);
          return Number.isFinite(n) ? n : undefined;
        }
        return undefined;
      };
      for (const s of rows) {
        const ts = s.created_at
          ? new Date(s.created_at).getTime()
          : s.time
            ? new Date(String(s.time)).getTime()
            : Date.now();
        const count = getCount((s as { count?: unknown }).count);
        const orderKey = count != null ? count : ts;
        const input = pickText((s as { input?: unknown }).input);
        const output = pickText((s as { output?: unknown }).output);
        if (input && input.trim()) {
          list.push({
            id: `${String(s.id ?? Math.random())}-u`,
            role: "user",
            content: input,
            createdAt: orderKey * 2,
          });
        }
        if (output && output.trim()) {
          list.push({
            id: `${String(s.id ?? Math.random())}-a`,
            role: "assistant",
            content: output,
            createdAt: orderKey * 2 + 1,
          });
        }
        if ((!input || !input.trim()) && (!output || !output.trim())) {
          const content = String(
            pickText((s as { content?: unknown }).content) ??
              pickText((s as { message?: unknown }).message) ??
              pickText((s as { zip?: unknown }).zip) ??
              "",
          );
          if (content) {
            list.push({
              id: `${String(s.id ?? Math.random())}-m`,
              role: (s.role as "user" | "assistant" | "system") || "assistant",
              content,
              createdAt: orderKey * 2,
            });
          }
        }
      }
      if (sessionsPage === 1 && rows.length === 0) {
        const fallback = selectedHistoryRecordRef.current;
        const fallbackText = String(
          pickText(fallback?.name) ??
            pickText(fallback?.message) ??
            pickText(fallback?.content) ??
            pickText(fallback?.summary) ??
            "",
        ).trim();
        if (fallback && fallbackText) {
          const fallbackTs = fallback.created_at
            ? new Date(fallback.created_at).getTime()
            : Date.now();
          list.push({
            id: `record-${String(fallback.record_id ?? fallback.id ?? recordId)}-u`,
            role: "user",
            content: fallbackText,
            createdAt: Number.isFinite(fallbackTs) ? fallbackTs : Date.now(),
          });
        }
      }
      list.sort((a, b) => a.createdAt - b.createdAt);
      lastUpdateWasPrependRef.current = sessionsPage > 1;
      setMessages((prev) => {
        const map = new Map<string, (typeof prev)[number]>();
        for (const m of [...prev, ...list]) map.set(m.id, m);
        const merged = Array.from(map.values());
        merged.sort((a, b) => a.createdAt - b.createdAt);
        return merged;
      });
      setTimeout(() => {
        const el2 = listRef.current;
        if (!el2) return;
        const newHeight = el2.scrollHeight;
        if (sessionsPage > 1) {
          el2.scrollTop = prevTop + (newHeight - prevHeight);
        }
      }, 0);
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? (e as { message?: string }).message
          : undefined;
      Message.error(msg || "加载失败");
    } finally {
      sessionsFetchLockRef.current = false;
      setSessionsLoading(false);
      continueRef.current = false;
    }
  }, [
    agentId,
    recordId,
    streaming,
    sessionsPage,
    sessionsPerPage,
    sessionsTotal,
    sessionsLoadedCount,
    identity?.id,
  ]);

  useEffect(() => {
    fetchSessions();
  }, [recordId, sessionsPage, sessionsReloadKey, fetchSessions]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (!sessionsPagingEnabledRef.current) return;
      if (
        el.scrollTop <= 10 &&
        !sessionsLoading &&
        sessionsLoadedCount < sessionsTotal
      ) {
        lastUpdateWasPrependRef.current = true;
        setSessionsPage((p) => p + 1);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
    };
  }, [sessionsLoading, sessionsLoadedCount, sessionsTotal, recordId]);

  useEffect(() => {
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const handleStop = () => {
    if (!streaming) return;
    streamAbortRef.current.aborted = true;
    abortCtrlRef.current?.abort();
    setStreaming(false);
  };

  const handleEnter = (
    _v: string,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const tabbarComponent = (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          justifyContent: "space-between",
        }}
      >
        <Button
          onClick={() => {
            setMessages([]);
            setSteps([]);
            setPdcEvents([]);
            setToolCallsByMsg({});
            setArtifactsByMsg({});
            streamAbortRef.current.aborted = false;
            abortCtrlRef.current?.abort();
            setStreaming(false);
            assistantIdRef.current = null;
            setRecordId(null);
            selectedHistoryRecordRef.current = null;
            continueRef.current = false;
            setSessionsPage(1);
            setSessionsTotal(0);
            setSessionsLoadedCount(0);
            setSessionsReloadKey((v) => v + 1);
          }}
        >
          新对话 +
        </Button>
        <Space>
          <Input.Search
            allowClear
            placeholder={t("agent.ui.searchPlaceholder", {
              _: "搜索助手名称",
            })}
            onChange={setQuery}
            onSearch={runAgentSearch}
            onPressEnter={runAgentSearch}
            style={{ width: 180 }}
            searchButton={<IconSearch />}
          />

          <Select
            value={agentId}
            placeholder={t("agent.ui.selectAgent", { _: "选择助手" })}
            onChange={setAgentId}
            style={{ width: 220 }}
            popupVisible={selectOpen}
            onVisibleChange={setSelectOpen}
            loading={agentsLoading}
          >
            {agents.map((a) => (
              <Select.Option key={a.id} value={a.id}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {a.avatar ? (
                    <Avatar size={20} style={{ flexShrink: 0 }}>
                      <img
                        src={a.avatar}
                        alt={a.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Avatar>
                  ) : (
                    <Avatar size={20} style={{ flexShrink: 0 }}>
                      <img
                        src="/agentlz-logo.png"
                        alt={a.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Avatar>
                  )}
                  <span>{a.name}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
          {agentsLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Spin size={16} />
              <span>搜索中</span>
            </div>
          )}
        </Space>
        <Button
          disabled={agentsLoading || agents.length === 0}
          onClick={() => {
            setHistoryVisible(true);
          }}
        >
          历史纪录
        </Button>
      </div>
      {currentAgent && (
        <Card style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {currentAgent.avatar ? (
              <Avatar size={28} style={{ flexShrink: 0 }}>
                <img
                  src={currentAgent.avatar}
                  alt={currentAgent.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Avatar>
            ) : (
              <Avatar size={28} style={{ flexShrink: 0 }}>
                <img
                  src="/agentlz-logo.png"
                  alt={currentAgent.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Avatar>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{currentAgent.name}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {currentAgent.description}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {(currentAgent.tags || []).map((tag) => (
                <Tag key={tag} size="small" color="arcoblue">
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const sendMessageComponent = (
    <div style={{ marginTop: 16 }}>
      <div>
        <Card>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <Input.TextArea
              value={input}
              placeholder={t("agent.ui.placeholder", {
                _: "请输入消息，Shift+Enter 换行",
              })}
              autoSize={{ minRows: 2, maxRows: 6 }}
              onChange={setInput}
              onPressEnter={(e) => handleEnter(input, e)}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "stretch",
              }}
            >
              <Space>
                <Button
                  type="primary"
                  onClick={handleSend}
                  disabled={!agentId || streaming}
                >
                  {t("agent.ui.send", { _: "发送" })}
                </Button>
                <Button onClick={handleStop} disabled={!streaming}>
                  {t("agent.ui.stop", { _: "停止" })}
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "auto",
          height: "100vh",
          display: "flex",
          margin: "0 auto",
          maxWidth: 1024,
          flexDirection: "column",
          rowGap: 16,
          paddingBottom: 160,
        }}
      >
        {tabbarComponent}
        {!agentsLoading && agents.length === 0 && (
          <Card style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
            <Empty description={t("agent.ui.emptyAgents", { _: "暂无助手" })} />
          </Card>
        )}
        <div
          style={{
            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "auto",
            height: "80vh",
          }}
        >
          <div
            ref={listRef}
            className="hide-scrollbar"
            style={{
              flex: 1,
              height: "60vh",
              overflowY: "auto",
              paddingRight: 4,
              display: "flex",
              flexDirection: "column",
              rowGap: 16,
            }}
          >
            {sessionsLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Spin size={16} />
                <span>加载历史会话</span>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    maxWidth: "80%",
                    alignItems: "flex-start",
                    gap: 8,
                    flexDirection: m.role === "user" ? "row-reverse" : "row",
                  }}
                >
                  {m.role === "user" ? (
                    <Avatar size={28} style={{ flexShrink: 0 }}>
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={identity?.fullName || identity?.username || "me"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <IconUser />
                      )}
                    </Avatar>
                  ) : (
                    <Avatar size={28} style={{ flexShrink: 0 }}>
                      <img
                        src="/agentlz-robot.jpg"
                        alt={currentAgent?.name || ""}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Avatar>
                  )}
                  {m.role === "assistant" ? (
                    <div
                      onMouseEnter={() => setHoveredMsgId(m.id)}
                      onMouseLeave={() =>
                        setHoveredMsgId((id) => (id === m.id ? null : id))
                      }
                      style={{
                        position: "relative",
                        borderRadius: 16,
                        border: undefined,
                        padding: 0,
                        paddingRight: 36,
                        fontSize: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      {toolCallsByMsg[m.id]?.length ? (
                        <ToolCallInline calls={toolCallsByMsg[m.id]} isDark={isDark} />
                      ) : null}
                      {artifactsByMsg[m.id]?.length ? (
                        <ArtifactDownloads artifacts={artifactsByMsg[m.id]} isDark={isDark} />
                      ) : null}
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                      {hoveredMsgId === m.id && (
                        <div
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(m.content);
                              Message.success({
                                content: "复制成功",
                                duration: 1500,
                              });
                            } catch {
                              Message.error({
                                content: "复制失败",
                                duration: 1500,
                              });
                            }
                          }}
                          title="复制"
                          style={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color: "#9CA3AF",
                            background: "transparent",
                          }}
                        >
                          <IconCopy />
                          <span style={{ fontSize: 12 }}>复制</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Card size="small" style={{ borderRadius: 16 }}>
                      <div
                        style={{
                          padding: "2px 12px",
                          fontSize: 14,
                          lineHeight: 1.6,
                        }}
                      >
                        {m.content}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            ))}
            {streaming && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#6b7280",
                }}
              >
                <Spin size={16} />
                <span>{t("agent.ui.streaming", { _: "生成中" })}</span>
              </div>
            )}
          </div>
          {pdcEvents.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Button size="small" type="outline" onClick={() => setPdcOpen(true)}>
                PDC 执行链路 ({pdcEvents.length})
              </Button>
            </div>
          )}
          {steps.length > 0 && pdcEvents.length === 0 && (
            <div
              style={{
                marginTop: 16,
                borderRadius: 8,
                backgroundColor: isDark ? "#222" : undefined,
                padding: 12,
              }}
            >
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#475569",
                }}
              >
                {t("agent.ui.intermediate", { _: "中间步骤" })}
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", rowGap: 4 }}
              >
                {steps.map((s, i) => (
                  <div
                    key={`${i}-${s.step}`}
                    style={{ fontSize: 12, color: "#475569" }}
                  >
                    {s.step}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {sendMessageComponent}
      </div>
      <Drawer
        title="PDC 执行链路"
        visible={pdcOpen}
        placement="right"
        width={520}
        footer={null}
        onCancel={() => setPdcOpen(false)}
        onOk={() => setPdcOpen(false)}
      >
        <PdcTracePanel events={pdcEvents} isDark={isDark} />
      </Drawer>
      <HistoryDrawer
        visible={historyVisible}
        currentRecordId={recordId}
        agentId={agentId}
        userId={String(identity?.id ?? "")}
        onClose={() => setHistoryVisible(false)}
        onPick={(record) => {
          const rid = Number(record.record_id ?? record.id);
          if (!Number.isNaN(rid)) {
            selectedHistoryRecordRef.current = record;
            sessionsFetchLockRef.current = false;
            setMessages([]);
            setSteps([]);
            setPdcEvents([]);
            setToolCallsByMsg({});
            setArtifactsByMsg({});
            continueRef.current = true;
            sessionsPagingEnabledRef.current = false;
            setSessionsPage(1);
            setSessionsTotal(0);
            setSessionsLoadedCount(0);
            setRecordId(rid);
            setSessionsReloadKey((v) => v + 1);
          }
          setHistoryVisible(false);
        }}
      />
    </div>
  );
};

export default Chat;

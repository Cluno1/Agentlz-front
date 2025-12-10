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
} from "@arco-design/web-react";
import { IconUser, IconCopy, IconSearch } from "@arco-design/web-react/icon";
import { useTranslate, useGetIdentity } from "react-admin";
import { type AgentInfo, type ChatMessage } from "../../data/agent";
import { chatAgentStream, listAgentChatSessions } from "../../data/api/agent";
import type {
  AgentChatInput,
  AgentChatStreamChunk,
} from "../../data/api/agent/type";
import HistoryDrawer from "./components/HistoryDrawer";
import { listAccessibleAgents } from "../../data/api/agent";
import { useDarkMode } from "../../data/hook/useDark";
type ApiAgentRow = {
  id?: number | string;
  agent_id?: number | string;
  name?: string;
  description?: string;
  avatar?: string;
  tags?: string[];
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
  /** 上一次更新是否是向前追加（用于保持滚动位置） */
  const lastUpdateWasPrependRef = useRef(false);
  /** 是否由历史记录选择触发加载（仅在 onPick 时为真） */
  const continueRef = useRef(false);
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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !agentId || streaming) return;
    // 清空当前的步骤
    setSteps([]);
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
      const payload: AgentChatInput = {
        agent_id: Number.isNaN(Number(agentId)) ? undefined : Number(agentId),
        type: (isContinue ? 1 : 0) as 0 | 1,
        meta: { user_id: String(identity?.id ?? "") },
        message: text,
        ...(isContinue ? { record_id: recordId as number } : {}),
      };
      const gen = chatAgentStream(payload, {
        signal: abortCtrlRef.current.signal,
      });
      for await (const chunk of gen as AsyncGenerator<
        AgentChatStreamChunk & { record_id?: number },
        void,
        unknown
      >) {
        if (streamAbortRef.current.aborted) break;
        if (chunk?.record_id != null && recordId == null) {
          const rid = Number(chunk.record_id);
          if (!Number.isNaN(rid)) setRecordId(rid);
        }
        setMessages((prev) => {
          const next = [...prev];
          const idx = next.findIndex((m) => m.id === assistantIdRef.current);
          if (idx !== -1)
            next[idx] = {
              ...next[idx],
              content: next[idx].content + (chunk.delta || chunk.text || ""),
            };
          return next;
        });
        if (chunk.done) break;
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
      for (const s of rows) {
        const ts = s.created_at
          ? new Date(s.created_at).getTime()
          : s.time
            ? new Date(String(s.time)).getTime()
            : Date.now();
        const input = typeof s.input === "string" ? s.input : undefined;
        const output = typeof s.output === "string" ? s.output : undefined;
        if (input && input.trim()) {
          list.push({
            id: `${String(s.id ?? Math.random())}-u`,
            role: "user",
            content: input,
            createdAt: ts,
          });
        }
        if (output && output.trim()) {
          list.push({
            id: `${String(s.id ?? Math.random())}-a`,
            role: "assistant",
            content: output,
            createdAt: ts + 1,
          });
        }
        if ((!input || !input.trim()) && (!output || !output.trim())) {
          const content = String(s.content ?? s.message ?? "");
          if (content) {
            list.push({
              id: `${String(s.id ?? Math.random())}-m`,
              role: (s.role as "user" | "assistant" | "system") || "assistant",
              content,
              createdAt: ts,
            });
          }
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
  }, [recordId, sessionsPage, fetchSessions]);

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
            streamAbortRef.current.aborted = false;
            abortCtrlRef.current?.abort();
            setStreaming(false);
            assistantIdRef.current = null;
            setRecordId(null);
            continueRef.current = false;
            setSessionsPage(1);
            setSessionsTotal(0);
            setSessionsLoadedCount(0);
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
          {steps.length > 0 && (
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
      <HistoryDrawer
        visible={historyVisible}
        currentRecordId={recordId}
        agentId={agentId}
        userId={String(identity?.id ?? "")}
        onClose={() => setHistoryVisible(false)}
        onPick={(rid) => {
          if (!Number.isNaN(rid) && rid !== recordId) {
            setMessages([]);
            setSteps([]);
            continueRef.current = true;
            setSessionsPage(1);
            setRecordId(rid);
          }
          setHistoryVisible(false);
        }}
      />
    </div>
  );
};

export default Chat;

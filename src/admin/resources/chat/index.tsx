/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "@arco-design/web-react";
import { IconUser } from "@arco-design/web-react/icon";
import { useTranslate, useGetIdentity } from "react-admin";
import { type AgentInfo, type ChatMessage } from "../../data/agent";
import { chatAgentStream } from "../../data/api/agent";
import type {
  AgentChatInput,
  AgentChatStreamChunk,
} from "../../data/api/agent/type";
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
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [agentId, setAgentId] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  // 记录当前的消息
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  // 记录当前是否正在流式传输
  const [streaming, setStreaming] = useState<boolean>(false);
  // 记录当前的步骤
  const [steps, setSteps] = useState<
    Array<{ step: string; detail?: Record<string, unknown> }>
  >([]);
  const streamAbortRef = useRef<{ aborted: boolean }>({ aborted: false });
  const abortCtrlRef = useRef<AbortController | null>(null);
  const assistantIdRef = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const { isDark } = useDarkMode();
  const [recordId, setRecordId] = useState<number | null>(null);

  const fetchAgents = React.useCallback(
    async (q: string) => {
      try {
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
      }
    },
    [t],
  );

  useEffect(() => {
    fetchAgents("");
  }, [fetchAgents]);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchAgents(query.trim());
    }, 300);
    return () => clearTimeout(id);
  }, [query, fetchAgents]);

  useEffect(() => {
    if (!agentId && agents.length > 0) setAgentId(agents[0].id);
  }, [agents, agentId]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
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

  return (
    <div
      style={{
        minHeight: "100%",
        padding: 24,
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          maxWidth: 1024,
          display: "flex",
          flexDirection: "column",
          rowGap: 16,
          paddingBottom: 160,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
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
            }}
          >
            新对话 +
          </Button>
          <Space>
            <Input.Search
              value={query}
              allowClear
              placeholder={t("agent.ui.searchPlaceholder", {
                _: "搜索助手名称",
              })}
              onChange={setQuery}
              onSearch={(v) => setQuery(v)}
              style={{ width: 240 }}
            />
            <Select
              value={agentId}
              placeholder={t("agent.ui.selectAgent", { _: "选择助手" })}
              onChange={setAgentId}
              style={{ width: 192 }}
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
                          src="/agentlz-robot.jpg"
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
          </Space>
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
                    src="/agentlz-robot.jpg"
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

        <Card
          style={{
            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <div
            ref={listRef}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              paddingRight: 4,
              display: "flex",
              flexDirection: "column",
              rowGap: 16,
            }}
          >
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
                    <Avatar
                      size={28}
                      style={{ backgroundColor: "#165DFF", flexShrink: 0 }}
                    >
                      <IconUser />
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
                  <div
                    style={{
                      borderRadius: 16,
                      borderColor: m.role === "user" ? "" : "red",
                      borderWidth: "10px",
                      padding: "8px 12px",
                      fontSize: 14,
                      lineHeight: 1.6,
                      backgroundColor:
                        m.role === "user" ? "rgb(22,93,255)" : "",
                      color: m.role === "user" ? "#fff" : "",
                    }}
                  >
                    {m.content}
                  </div>
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
        </Card>

        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 16,
            paddingLeft: 24,
            paddingRight: 24,
            zIndex: 1000,
            boxSizing: "border-box",
          }}
        >
          <div style={{ margin: "0 auto", maxWidth: 1024 }}>
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
      </div>
    </div>
  );
};

export default Chat;

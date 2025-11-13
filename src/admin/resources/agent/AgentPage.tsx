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
  Typography,
} from "@arco-design/web-react";
import { IconRobot, IconUser } from "@arco-design/web-react/icon";
import { useTranslate } from "react-admin";
import {
  listAgents,
  sendChat,
  streamChat,
  type AgentInfo,
  type ChatMessage,
} from "../../data/agent";

const AgentPage: React.FC = () => {
  const t = useTranslate();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [agentId, setAgentId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [streaming, setStreaming] = useState<boolean>(false);
  const [steps, setSteps] = useState<Array<{ step: string; detail?: any }>>([]);
  const streamAbortRef = useRef<{ aborted: boolean }>({ aborted: false });
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listAgents()
      .then((res) => {
        setAgents(res);
        if (res.length > 0) setAgentId(res[0].id);
      })
      .catch(() =>
        Message.error(t("agent.msg.loadAgentsFail", { _: "加载失败" })),
      );
  }, [t]);

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
    setSteps([]);
    streamAbortRef.current.aborted = false;
    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: `${Date.now()}-a`,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      },
    ]);
    setInput("");
    setStreaming(true);
    try {
      const req = {
        agentId,
        messages: messages.concat({ role: "user", content: text }),
      };
      const gen = streamChat(req);
      for await (const chunk of gen) {
        if (streamAbortRef.current.aborted) break;
        setMessages((prev) => {
          const next = [...prev];
          const idx = next.findIndex(
            (m) => m.role === "assistant" && m.content === "",
          );
          if (idx !== -1)
            next[idx] = {
              ...next[idx],
              content: next[idx].content + (chunk.delta || ""),
            };
          return next;
        });
      }
      if (!streamAbortRef.current.aborted) {
        const resp = await sendChat(req);
        setSteps(resp.intermediate_steps || []);
      }
    } catch (e) {
      Message.error(t("agent.msg.streamFail", { _: "流式失败" }));
    } finally {
      setStreaming(false);
      streamAbortRef.current.aborted = false;
    }
  };

  const handleStop = () => {
    if (!streaming) return;
    streamAbortRef.current.aborted = true;
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
    <div className="h-full p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Typography.Title heading={4}>{t("agent.title")}</Typography.Title>
          <Space>
            <Select
              value={agentId}
              placeholder={t("agent.ui.selectAgent", { _: "选择助手" })}
              onChange={setAgentId}
              className="w-48"
            >
              {agents.map((a) => (
                <Select.Option key={a.id} value={a.id}>
                  <div className="flex items-center gap-2">
                    {a.avatar ? (
                      <Avatar size={20} imageProps={{ src: a.avatar }} />
                    ) : (
                      <IconRobot />
                    )}
                    <span>{a.name}</span>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Space>
        </div>

        {currentAgent && (
          <Card className="shadow-sm">
            <div className="flex items-center gap-2">
              {currentAgent.avatar ? (
                <Avatar size={28}>
                  <img src={currentAgent.avatar} alt={currentAgent.name} />
                </Avatar>
              ) : (
                <IconRobot />
              )}
              <div className="flex-1">
                <div className="font-medium">{currentAgent.name}</div>
                <div className="text-xs text-gray-500">
                  {currentAgent.description}
                </div>
              </div>
              <div className="flex gap-1">
                {(currentAgent.tags || []).map((tag) => (
                  <Tag key={tag} size="small" color="arcoblue">
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          </Card>
        )}

        <Card className="shadow-sm">
          <div
            ref={listRef}
            className="max-h-[54vh] overflow-y-auto pr-1 space-y-4"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-[80%] items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar
                    size={28}
                    style={{
                      backgroundColor:
                        m.role === "user" ? "#165DFF" : "#F2F3F5",
                    }}
                  >
                    {m.role === "user" ? <IconUser /> : <IconRobot />}
                  </Avatar>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-[rgb(22,93,255)] text-white" : "bg-[rgb(247,248,250)]"}`}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {streaming && (
              <div className="flex items-center gap-2 text-gray-500">
                <Spin size={16} />
                <span>{t("agent.ui.streaming", { _: "生成中" })}</span>
              </div>
            )}
          </div>
          {steps.length > 0 && (
            <div className="mt-4 rounded-lg bg-[rgb(247,248,250)] p-3">
              <div className="mb-2 text-xs font-medium text-gray-600">
                {t("agent.ui.intermediate", { _: "中间步骤" })}
              </div>
              <div className="space-y-1">
                {steps.map((s, i) => (
                  <div key={`${i}-${s.step}`} className="text-xs text-gray-600">
                    {s.step}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="shadow-sm">
          <div className="flex items-end gap-2">
            <Input.TextArea
              value={input}
              placeholder={t("agent.ui.placeholder", {
                _: "请输入消息，Shift+Enter 换行",
              })}
              autoSize={{ minRows: 2, maxRows: 6 }}
              onChange={setInput}
              onPressEnter={handleEnter}
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
              <Button
                onClick={() => {
                  setMessages([]);
                  setSteps([]);
                }}
              >
                {t("agent.ui.newChat", { _: "新对话" })}
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AgentPage;

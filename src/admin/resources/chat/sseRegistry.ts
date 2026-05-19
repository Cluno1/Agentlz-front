// SSE 事件 → 处理 注册表（Step2 + 前端展示方案）。
// 细分：call.* → 正文工具 chip(onToolCall) + 右抽屉时间线(appendPdcEvent)；
// final → 正文 md(appendAssistant) + 右抽屉；其余 PDC → 右抽屉；text → 普通文本流。
// 加事件类型只需在 HANDLERS/classify 加一条，不动消费循环；未命中默认 text 不丢帧。
import type { AgentChatStreamChunk, PdcEventEnvelope } from "../../data/api/agent/type";

export type SseChunk = AgentChatStreamChunk & { record_id?: number };

export interface SseCtx {
  appendPdcEvent: (e: PdcEventEnvelope) => void;
  onToolCall: (e: PdcEventEnvelope) => void;
  appendAssistant: (s: string) => void;
  assistantTextFromPdcEvent: (e: PdcEventEnvelope) => string;
  onRecordId: (id: number) => void;
}

type Handler = (chunk: SseChunk, ctx: SseCtx) => boolean | void;

const HANDLERS: Record<string, Handler> = {
  tool: (chunk, ctx) => {
    const ev = chunk.event as PdcEventEnvelope;
    ctx.onToolCall(ev);
    ctx.appendPdcEvent(ev);
  },
  final: (chunk, ctx) => {
    const ev = chunk.event as PdcEventEnvelope;
    ctx.appendPdcEvent(ev);
    ctx.appendAssistant(ctx.assistantTextFromPdcEvent(ev));
  },
  pdc: (chunk, ctx) => {
    ctx.appendPdcEvent(chunk.event as PdcEventEnvelope);
  },
  text: (chunk, ctx) => {
    if (chunk?.record_id != null) ctx.onRecordId(Number(chunk.record_id));
    ctx.appendAssistant(chunk.delta || chunk.text || "");
    if (chunk.done) return true;
  },
};

export function classifySseChunk(
  chunk: SseChunk,
): "tool" | "final" | "pdc" | "text" {
  const ev = chunk && (chunk as { event?: PdcEventEnvelope }).event;
  if (!ev) return "text";
  const name = String(ev.evt || "");
  if (name === "call.start" || name === "call.end") return "tool";
  if (name === "final") return "final";
  return "pdc";
}

export function dispatchSseChunk(chunk: SseChunk, ctx: SseCtx): boolean {
  const handler = HANDLERS[classifySseChunk(chunk)] ?? HANDLERS.text;
  return handler(chunk, ctx) === true;
}

// SSE 事件 → 处理 注册表（通信改造方案 Step2）。
// 行为与原 chat/index.tsx 内联 if/else 构造等价：仅把分发表驱动化，
// 新增 agent 事件类型只需在 HANDLERS 加一条，不动消费循环；未命中走默认(text)，不丢帧。
import type { AgentChatStreamChunk, PdcEventEnvelope } from "../../data/api/agent/type";

export type SseChunk = AgentChatStreamChunk & { record_id?: number };

export interface SseCtx {
  appendPdcEvent: (e: PdcEventEnvelope) => void;
  appendAssistant: (s: string) => void;
  assistantTextFromPdcEvent: (e: PdcEventEnvelope) => string;
  onRecordId: (id: number) => void;
}

// 返回 true 表示应结束 for-await（等价原 `if (chunk.done) break;`）
type Handler = (chunk: SseChunk, ctx: SseCtx) => boolean | void;

const HANDLERS: Record<string, Handler> = {
  // PDC 事件信封：等价原 `if (chunk.event) { appendPdcEvent; appendAssistant; continue; }`
  pdc: (chunk, ctx) => {
    const ev = chunk.event as PdcEventEnvelope;
    ctx.appendPdcEvent(ev);
    ctx.appendAssistant(ctx.assistantTextFromPdcEvent(ev));
  },
  // 普通聊天文本块：等价原 record_id + appendAssistant(delta||text) + done->break
  text: (chunk, ctx) => {
    if (chunk?.record_id != null) ctx.onRecordId(Number(chunk.record_id));
    ctx.appendAssistant(chunk.delta || chunk.text || "");
    if (chunk.done) return true;
  },
};

export function classifySseChunk(chunk: SseChunk): "pdc" | "text" {
  return chunk && (chunk as { event?: unknown }).event ? "pdc" : "text";
}

export function dispatchSseChunk(chunk: SseChunk, ctx: SseCtx): boolean {
  const handler = HANDLERS[classifySseChunk(chunk)] ?? HANDLERS.text;
  return handler(chunk, ctx) === true;
}

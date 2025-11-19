/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * 功能: Agent 数据访问层（接口定义与请求封装）
 * 说明: 当前阶段仅请求前端假数据（src/admin/mock/agent.ts）
 */

import { mockListAgents, mockSendChat, mockStreamChat } from "../mock/agent";

/* ========================== 类型定义 ========================== */
export type AgentInfo = {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  tags?: string[];
};

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type ChatRequest = {
  agentId: string;
  messages: Array<{ role: ChatRole; content: string }>;
};

export type IntermediateStep = { step: string; detail?: any };

export type ChatResponse = {
  message: ChatMessage;
  intermediate_steps?: IntermediateStep[];
};

export type StreamChunk = {
  id: string;
  role: "assistant";
  delta: string;
  done?: boolean;
};

/*
 * 函数: listAgents
 * 参数: 无
 * 返回: Promise<AgentInfo[]> - 返回可用的智能体列表
 * 异常: 无（始终成功返回假数据）
 */
export async function listAgents(): Promise<AgentInfo[]> {
  const list = await mockListAgents();
  return list.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    avatar: a.avatar,
    tags: a.tags,
  }));
}

/*
 * 函数: sendChat
 * 参数: req: ChatRequest - 对话请求，包含 agentId 与历史消息
 * 返回: Promise<ChatResponse> - 返回最终消息（非流式）与中间步骤
 * 异常: 当 req.agentId 为空时抛出错误
 */
export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  if (!req.agentId) throw new Error("缺少 agentId");
  const resp = await mockSendChat(req);
  return {
    message: resp.message,
    intermediate_steps: resp.intermediate_steps,
  };
}

/*
 * 函数: streamChat
 * 参数: req: ChatRequest - 对话请求
 * 返回: AsyncGenerator<StreamChunk> - 异步生成器，按 token 模拟流式输出
 * 异常: 当 req.agentId 为空时抛出错误
 */
export function streamChat(
  req: ChatRequest,
): AsyncGenerator<StreamChunk, void, unknown> {
  if (!req.agentId) throw new Error("缺少 agentId");
  return mockStreamChat(req);
}

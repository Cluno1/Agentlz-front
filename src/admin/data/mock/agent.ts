/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * 功能: 提供 Agent 相关的假数据与流式输出模拟
 * 说明: 当前不对接后台服务，通过前端定时器与生成器模拟 SSE/流式响应
 */

/* ========================== 类型定义 ========================== */
export type MockAgentInfo = {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  tags?: string[];
};

export type MockChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
};

export type MockStreamChunk = {
  id: string;
  role: "assistant";
  delta: string;
  done?: boolean;
};

export type MockChatRequest = {
  agentId: string;
  messages: string;
};

export type MockChatResponse = {
  message: MockChatMessage;
  intermediate_steps?: Array<{ step: string; detail?: any }>;
};

/*
 * 函数: mockListAgents
 * 参数: 无
 * 返回: Promise<MockAgentInfo[]> - 返回可用的智能体列表
 * 异常: 无（始终成功返回假数据）
 */
export async function mockListAgents(): Promise<MockAgentInfo[]> {
  return [
    {
      id: "assistant-kimi",
      name: "Agentlz 工作助手",
      description: "温柔、简洁的 ToC 体验，支持长文本与网页总结。",
      avatar: "/agentlz-logo.png",
      tags: ["chat", "summary", "web"],
    },
  ];
}

/*
 * 函数: mockSendChat
 * 参数: req: MockChatRequest - 对话请求，包含 agentId 与历史消息
 * 返回: Promise<MockChatResponse> - 返回最终消息（非流式）与中间步骤
 * 异常: 当 req.agentId 为空时抛出错误
 */
export async function mockSendChat(
  req: MockChatRequest,
): Promise<MockChatResponse> {
  if (!req.agentId) throw new Error("缺少 agentId");

  const content = "你好，我能帮你做些什么？";

  const reply = `这是针对你的问题的简要回答：\n\n${content}\n\n- 我可以继续为你提供更详细的解释。\n- 如果需要，也能给出示例代码或步骤。`;

  return {
    message: {
      id: `${Date.now()}`,
      role: "assistant",
      content: reply,
      createdAt: Date.now(),
    },
    intermediate_steps: [
      { step: "检索相关知识库", detail: { top_k: 3 } },
      { step: "生成回答草稿", detail: { model: "mock-4-mini" } },
      { step: "润色与格式化", detail: { style: "concise" } },
    ],
  };
}

/*
 * 函数: mockStreamChat
 * 参数: req: MockChatRequest - 对话请求
 * 返回: AsyncGenerator<MockStreamChunk> - 异步生成器，按 token 模拟流式输出
 * 异常: 当 req.agentId 为空时抛出错误
 */
export async function* mockStreamChat(
  req: MockChatRequest,
): AsyncGenerator<MockStreamChunk, void, unknown> {
  if (!req.agentId) throw new Error("缺少 agentId");

  const lastUser = req.messages
    .split("\n")
    .filter((m) => m.role === "user")
    .pop();
  const question = lastUser?.content || "请简要介绍你能做什么";

  const full = `好的，已收到你的请求：\n\n${question}\n\n以下是流式演示：\n1. 分析你的意图与目标\n2. 检索相关内容并总结\n3. 生成清晰的步骤或代码示例\n\n如需更进一步，可继续追问，我会持续协助。`;

  const tokens = full.split(/(\s+)/); // 以空白分词，提升真实感
  for (let i = 0; i < tokens.length; i++) {
    // 模拟不同的 token 延迟

    await new Promise((r) => setTimeout(r, 40 + Math.random() * 120));
    yield {
      id: `${Date.now()}-${i}`,
      role: "assistant",
      delta: tokens[i],
      done: false,
    };
  }

  // 结束标记
  yield {
    id: `${Date.now()}-done`,
    role: "assistant",
    delta: "",
    done: true,
  };
}

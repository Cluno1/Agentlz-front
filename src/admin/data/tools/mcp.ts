/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * 功能: MCP 数据访问层（接口定义与请求封装）
 * 说明: 当前阶段仅请求前端假数据（src/admin/mock/mcp.ts）
 */

import { mockGetMcpStats, mockListMcpTools } from "../../mock/mcp";

/* ========================== 类型定义 ========================== */
export type McpCategory = "llm" | "database" | "tools" | "other" | "all";

export type McpTool = {
  id: string;
  name: string;
  description: string;
  category: "llm" | "database" | "tools" | "other";
  tags: string[];
  stars: number;
  icon?: string;
  installCommand: string;
};

export type McpStats = {
  totalServers: number;
  addedToday: number;
};

/*
 * 函数: getMcpStats
 * 参数: 无
 * 返回: Promise<McpStats> - MCP 统计信息
 * 异常: 无
 */
export async function getMcpStats(): Promise<McpStats> {
  return mockGetMcpStats();
}

/*
 * 函数: listMcpTools
 * 参数: params?: { query?: string; category?: McpCategory; tag?: string }
 * 返回: Promise<McpTool[]> - MCP 工具列表（支持筛选）
 * 异常: 无
 */
export async function listMcpTools(params?: {
  query?: string;
  category?: McpCategory;
  tag?: string;
}): Promise<McpTool[]> {
  const res = await mockListMcpTools(params);
  return res;
}


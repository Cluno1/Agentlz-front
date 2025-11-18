/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * 功能: 提供 MCP 工具的假数据与统计信息
 * 说明: 模拟 MCP 市场页面的数据源，包括列表与统计
 */

/* ========================== 类型定义 ========================== */
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
 * 函数: mockGetMcpStats
 * 参数: 无
 * 返回: Promise<McpStats> - MCP 统计信息（总数、今日新增）
 * 异常: 无
 */
export async function mockGetMcpStats(): Promise<McpStats> {
  return {
    totalServers: 30000, // 参考 MCP 市场页面文案
    addedToday: 0,
  };
}

/* ========================== 静态数据 ========================== */
const MOCK_MCP_TOOLS: McpTool[] = [
  {
    id: "web-scraper",
    name: "Web Scraper",
    description: "轻量网页抓取与解析，适合快速数据提取与检索。",
    category: "tools",
    tags: ["crawler", "http", "parse"],
    stars: 1240,
    icon: "https://avatars.githubusercontent.com/u/9919?s=64&v=4",
    installCommand: "npm i @mcp/web-scraper",
  },
  {
    id: "vector-db",
    name: "Vector DB",
    description: "兼容多模型的向量数据库，提供高效相似度检索。",
    category: "database",
    tags: ["embedding", "search", "index"],
    stars: 2056,
    icon: "https://avatars.githubusercontent.com/u/14957082?s=64&v=4",
    installCommand: "npm i @mcp/vector-db",
  },
  {
    id: "code-assistant",
    name: "Code Assistant",
    description: "增强代码理解与生成，支持多语言与上下文引用。",
    category: "llm",
    tags: ["code", "reasoning", "multi-lang"],
    stars: 3890,
    icon: "https://avatars.githubusercontent.com/u/9919?s=64&v=4",
    installCommand: "npm i @mcp/code-assistant",
  },
  {
    id: "image-tools",
    name: "Image Tools",
    description: "图像基础处理与增强，提供批处理与滤镜。",
    category: "tools",
    tags: ["image", "filter", "batch"],
    stars: 980,
    installCommand: "npm i @mcp/image-tools",
  },
  {
    id: "kv-store",
    name: "KV Store",
    description: "简单可靠的键值存储接口，支持持久化与过期策略。",
    category: "database",
    tags: ["kv", "persist", "ttl"],
    stars: 1412,
    installCommand: "npm i @mcp/kv-store",
  },
];

/*
 * 函数: mockListMcpTools
 * 参数: params?: { query?: string; category?: McpTool["category"]; tag?: string }
 * 返回: Promise<McpTool[]> - MCP 工具列表（支持基本筛选）
 * 异常: 无
 */
export async function mockListMcpTools(params?: {
  query?: string;
  category?: McpTool["category"] | "all";
  tag?: string;
}): Promise<McpTool[]> {
  const q = (params?.query || "").toLowerCase();
  const cat = params?.category || "all";
  const tg = params?.tag || "";
  let list = [...MOCK_MCP_TOOLS];
  if (q) {
    list = list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  if (cat !== "all") {
    list = list.filter((i) => i.category === cat);
  }
  if (tg) {
    list = list.filter((i) => i.tags.includes(tg));
  }
  return list;
}


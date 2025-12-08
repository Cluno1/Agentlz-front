/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "../../httpClient";
import type { AgentChatInput, AgentChatStreamChunk } from "./type";
import type {
  PaginationParams,
  PaginationResult,
  ListAgentsNameSpace,
  GetAgentNameSpace,
  CreateAgentNameSpace,
  UpdateAgentNameSpace,
  UpdateAgentApiNameSpace,
} from "./type";

/** @description Agent 列表查询（分页）
 * 参数：分页/排序/搜索（q）、数据范围 type(self|tenant)
 * 返回值：{ data: 列表[], total: 总数 }
 * 异常：网络或权限错误时抛出 Error，并打印“接口错误”
 */
export async function listAgents(
  params: ListAgentsNameSpace.ListAgentsParams,
): Promise<PaginationResult<ListAgentsNameSpace.ListAgentsResult>> {
  try {
    const {
      page = 1,
      perPage = 10,
      sortField = "id",
      sortOrder = "DESC",
      filter,
      type = "self",
    } = params || ({} as PaginationParams);
    const query: any = {
      page,
      per_page: perPage,
      sort: sortField,
      order: sortOrder,
      q: (filter as any)?.q,
      type,
    };
    const res = await httpClient.get("/agents", { params: query });
    const json = res.data;
    const rows =
      (json?.data?.rows as any[]) ??
      (json?.rows as any[]) ??
      (Array.isArray(json) ? (json as any[]) : []);
    const total = json?.data?.total ?? json?.total ?? rows.length ?? 0;
    return { data: rows as ListAgentsNameSpace.ListAgentsResult[], total };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}
/** @description 获取可访问 Agent 列表（分页）
 * 参数：分页/排序/搜索（q）
 * 返回值：{ data: 列表[], total: 总数 }
 * 异常：网络或权限错误时抛出 Error，并打印“接口错误”
 */
export async function listAccessibleAgents(
  params: PaginationParams,
): Promise<PaginationResult<ListAgentsNameSpace.ListAgentsResult>> {
  try {
    const {
      page = 1,
      perPage = 10,
      sortField = "id",
      sortOrder = "DESC",
      filter,
    } = params || ({} as PaginationParams);
    const query: any = {
      page,
      per_page: perPage,
      sort: sortField,
      order: sortOrder,
      q: (filter as any)?.q,
    };
    const res = await httpClient.get("/agents/accessible", { params: query });
    const json = res.data;
    const rows =
      (json?.data?.rows as any[]) ??
      (json?.rows as any[]) ??
      (Array.isArray(json) ? (json as any[]) : []);
    const total = json?.data?.total ?? json?.total ?? rows.length ?? 0;
    return { data: rows as ListAgentsNameSpace.ListAgentsResult[], total };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 获取 Agent 详情
 * 参数：agentId Agent 主键 ID
 * 返回值：Agent 记录
 * 异常：权限不足/不存在等情况抛出 Error
 */
export async function getAgent(
  agentId: number,
): Promise<GetAgentNameSpace.GetAgentResult> {
  try {
    const res = await httpClient.get(`/agents/${agentId}`);
    return (res.data?.data ?? res.data) as GetAgentNameSpace.GetAgentResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 创建 Agent
 * 参数：payload(name/description/disabled/mcp_agent_ids/document_ids)
 * 返回值：新建记录
 * 异常：校验失败/认证错误抛出 Error
 */
export async function createAgent(
  payload: CreateAgentNameSpace.CreateAgentParams,
  type: "self" | "tenant" = "self",
): Promise<CreateAgentNameSpace.CreateAgentResult> {
  try {
    const res = await httpClient.post("/agents", payload, {
      params: { type },
    });
    return (res.data?.data ??
      res.data) as CreateAgentNameSpace.CreateAgentResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 更新 Agent 基本信息
 * 参数：agentId 主键；updates 允许字段（name/description/disabled/mcp_agent_ids/document_ids）
 * 返回值：更新后的记录
 * 异常：权限不足/校验失败抛出 Error
 */
export async function updateAgent(
  agentId: number,
  updates: UpdateAgentNameSpace.UpdateAgentParams,
): Promise<UpdateAgentNameSpace.UpdateAgentResult> {
  try {
    const res = await httpClient.put(`/agents/${agentId}`, updates);
    return (res.data?.data ??
      res.data) as UpdateAgentNameSpace.UpdateAgentResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 更新 Agent 的外部 API 密钥
 * 参数：agentId 主键；payload(api_name/api_key)
 * 返回值：更新后的记录
 * 异常：权限不足/校验失败抛出 Error
 */
export async function updateAgentApi(
  agentId: number,
  payload: UpdateAgentApiNameSpace.UpdateAgentApiParams,
): Promise<UpdateAgentApiNameSpace.UpdateAgentApiResult> {
  try {
    const res = await httpClient.put(`/agents/${agentId}/api`, payload);
    return (res.data?.data ??
      res.data) as UpdateAgentApiNameSpace.UpdateAgentApiResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 删除 Agent
 * 参数：agentId 主键
 * 返回值：Promise<void>
 * 异常：权限不足/不存在抛出 Error
 */
export async function deleteAgent(agentId: number): Promise<void> {
  try {
    await httpClient.delete(`/agents/${agentId}`);
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function* chatAgentStream(
  payload: AgentChatInput,
  opts?: { signal?: AbortSignal },
): AsyncGenerator<AgentChatStreamChunk, void, unknown> {
  const base =
    (httpClient.defaults as any)?.baseURL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";
  const tokenKey = import.meta.env.VITE_TOKEN_KEY as string;
  const tenantKey = import.meta.env.VITE_TENANT_ID as string;
  const token = tokenKey ? localStorage.getItem(tokenKey) : undefined;
  const tenantId = tenantKey ? localStorage.getItem(tenantKey) : undefined;

  const res = await fetch(`${base}/agent/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
    },
    body: JSON.stringify(payload),
    signal: opts?.signal,
  });
  if (!res.ok || !res.body) {
    throw new Error("聊天接口请求失败");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const evt of events) {
      const line = evt
        .split("\n")
        .find((l) => l.startsWith("data:"))
        ?.replace(/^data:\s*/, "");
      if (!line) continue;
      try {
        const obj = JSON.parse(line) as AgentChatStreamChunk;
        yield obj;
      } catch {
        yield { delta: line };
      }
    }
  }
  yield { done: true };
}

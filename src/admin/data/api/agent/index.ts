/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "../../httpClient";
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
): Promise<CreateAgentNameSpace.CreateAgentResult> {
  try {
    const res = await httpClient.post("/agents", payload);
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

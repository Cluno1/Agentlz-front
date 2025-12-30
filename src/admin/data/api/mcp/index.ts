/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "../../httpClient";
import type {
  PaginationParams,
  PaginationResult,
  ListMcpNameSpace,
  GetMcpNameSpace,
  CreateMcpNameSpace,
  UpdateMcpNameSpace,
  SearchMcpNameSpace,
} from "./type";

/**
 * 列表查询 MCP
 *
 * 接口：GET /v1/mcp
 * - 查询参数：
 *   - `type` 可选，`self` | `tenant` | `system`，默认 `self`
 *   - `page` 分页页码，默认 1
 *   - `per_page` 每页条数，默认 10
 *   - `sort` 排序字段，默认 `id`
 *   - `order` 排序方式，`ASC` | `DESC`，默认 `DESC`
 *   - `q` 关键词过滤（可选）
 * - 请求头：`Authorization`、`X-Tenant-ID`（由 httpClient 统一管理）
 *
 * 返回：
 * - 形如 `{"success":true,"code":0,"message":"ok","data":{"rows":[...],"total":66}}`
 * - 本方法会将 `data.rows` 或顶层数组标准化为 `PaginationResult<ListMcpResult>`
 *
 * 示例：
 * ```ts
 * const { data, total } = await listMcps({ page: 1, perPage: 20, type: "system" });
 * ```
 */
export async function listMcps(
  params: ListMcpNameSpace.ListMcpParams,
): Promise<PaginationResult<ListMcpNameSpace.ListMcpResult>> {
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
    const res = await httpClient.get("/mcp", { params: query });
    const json = res.data;
    const rows =
      (json?.data?.rows as any[]) ??
      (json?.rows as any[]) ??
      (Array.isArray(json) ? (json as any[]) : []);
    const total = json?.data?.total ?? json?.total ?? rows.length ?? 0;
    return { data: rows as ListMcpNameSpace.ListMcpResult[], total };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/**
 * 查询 MCP 详情
 *
 * 接口：GET /v1/mcp/{id}
 * - 路径参数：`id` MCP 标识
 * - 请求头：`Authorization`、`X-Tenant-ID`
 *
 * 返回：
 * - 形如 `{"success":true,"code":0,"message":"ok","data":{...}}`
 * - 返回对象包含：`id`、`name`、`transport`、`command`、`args`、`category`、`trust_score`、`description` 等
 *
 * 示例：
 * ```ts
 * const detail = await getMcp(167);
 * ```
 */
export async function getMcp(
  agentId: number,
): Promise<GetMcpNameSpace.GetMcpResult> {
  try {
    const res = await httpClient.get(`/mcp/${agentId}`);
    return (res.data?.data ?? res.data) as GetMcpNameSpace.GetMcpResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/**
 * 新建 MCP
 *
 * 接口：POST /v1/mcp
 * - 查询参数：`type` 可选，`self` | `tenant` | `system`，默认 `self`
 * - 请求体：
 *   - `name` 名称（必填）
 *   - `transport` 传输方式，例如 `stdio` | `http`（必填）
 *   - `command` 启动命令，例如 `python` | `docker`（必填）
 *   - `args` 启动参数，数组或对象（必填）
 *   - `description` 描述（必填）
 *   - `category` 分类（如 `开发`、`官方`、`document` 等）（必填）
 *   - `trust_score` 可信度分数（number，必填）
 * - 请求头：`Authorization`、`Content-Type: application/json`
 *
 * 返回：
 * - 形如 `{"success":true,"code":0,"message":"ok","data":{...}}`
 *
 * 示例：
 * ```ts
 * await createMcp({
 *   name: "PDF_Parser(system)",
 *   transport: "stdio",
 *   command: "python",
 *   args: ["-m", "pdf_tool"],
 *   description: "解析并抽取 PDF 文本内容",
 *   category: "document",
 *   trust_score: 60.5,
 * }, "system");
 * ```
 */
export async function createMcp(
  payload: CreateMcpNameSpace.CreateMcpParams,
  type: "self" | "tenant" | "system" = "self",
): Promise<CreateMcpNameSpace.CreateMcpResult> {
  try {
    const res = await httpClient.post("/mcp", payload, { params: { type } });
    return (res.data?.data ?? res.data) as CreateMcpNameSpace.CreateMcpResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/**
 * 更新 MCP
 *
 * 接口：PUT /v1/mcp/{id}
 * - 路径参数：`id` MCP 标识
 * - 请求体：与创建类似的字段，用于更新已有 MCP
 * - 请求头：`Authorization`、`Content-Type: application/json`
 *
 * 返回：
 * - 形如 `{"success":true,"code":0,"message":"ok","data":{...}}`
 */
export async function updateMcp(
  agentId: number,
  updates: UpdateMcpNameSpace.UpdateMcpParams,
): Promise<UpdateMcpNameSpace.UpdateMcpResult> {
  try {
    const res = await httpClient.put(`/mcp/${agentId}`, updates);
    return (res.data?.data ?? res.data) as UpdateMcpNameSpace.UpdateMcpResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/**
 * 删除 MCP
 *
 * 接口：DELETE /v1/mcp/{id}
 * - 路径参数：`id` MCP 标识
 * - 请求头：`Authorization`
 *
 * 返回：
 * - 服务端通常返回删除结果；若无内容，本方法不返回数据（`void`）
 *
 * 示例：
 * ```ts
 * await deleteMcp(167);
 * ```
 */
export async function deleteMcp(agentId: number): Promise<void> {
  try {
    await httpClient.delete(`/mcp/${agentId}`);
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/**
 * 根据关键词搜索 MCP
 *
 * 接口：GET /v1/mcp/search
 * - 查询参数：
 *   - `q` 搜索关键词（必填）
 *   - `k` 可选，返回数量或近邻数量
 *   - 其他向量搜索相关参数：`alpha`、`theta`、`N`、`agent_id`（可选）
 * - 请求头：`Authorization`、`X-Tenant-ID`
 *
 * 返回：
 * - 形如 `{"success":true,"code":0,"message":"ok","data":[...]}` 的数组结果
 * - 后端可能返回 `sem_score`、`total_score` 等评分字段
 *
 * 示例：
 * ```ts
 * const items = await searchMcpAgents({ q: "pdf", k: 5 });
 * ```
 */
export async function searchMcpAgents(
  params: SearchMcpNameSpace.SearchMcpParams,
): Promise<SearchMcpNameSpace.SearchMcpResult[]> {
  try {
    const query: any = {
      q: params.q,
      k: params.k,
      agent_id: params.agent_id,
      alpha: params.alpha,
      theta: params.theta,
      N: params.N,
    };
    const res = await httpClient.get("/mcp/search", { params: query });
    return (res.data?.data ?? res.data) as SearchMcpNameSpace.SearchMcpResult[];
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

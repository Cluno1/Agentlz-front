/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 通用分页查询参数
 * - `page` 页码（默认 1）
 * - `perPage` 每页条数（默认 10）
 * - `sortField` 排序字段（如 `id`）
 * - `sortOrder` 排序方式（`ASC` | `DESC`）
 * - `filter` 过滤对象（例如包含 `q` 关键词）
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
  filter?: any;
  [k: string]: any;
}

/**
 * 通用分页返回结构
 * - `data` 数据列表
 * - `total` 总条数
 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  [k: string]: any;
}

export namespace ListMcpNameSpace {
  /**
   * MCP 列表查询参数
   * - `type` 可选，`self` | `tenant` | `system`，默认 `self`
   * - 其余分页与排序字段参考 `PaginationParams`
   */
  export interface ListMcpParams extends PaginationParams {
    type?: "self" | "tenant" | "system";
    [k: string]: any;
  }

  /**
   * MCP 列表项数据
   * 典型字段（参考 /v1/mcp 返回示例）：
   * - `id` MCP 标识
   * - `name` 名称
   * - `description` 描述
   * - `disabled` 是否禁用
   * - `tenant_id` 所属租户
   * - `created_by_id` 创建者标识
   * - `created_at` 创建时间
   * - `updated_at` 更新时间
   *
   * 后端常见扩展字段（未在此类型强约束，存在于返回数据中）：
   * - `transport` 传输方式（如 `stdio`、`http`）
   * - `command` 启动命令（如 `python`、`docker`）
   * - `args` 启动参数（数组或对象）
   * - `category` 分类（如 `开发`、`官方`、`document`）
   * - `trust_score` 可信度分数（number）
   */
  export interface ListMcpResult {
    id?: number;
    name?: string;
    description?: string | null;
    disabled?: boolean;
    tenant_id?: string;
    created_by_id?: string | number;
    created_at?: string;
    updated_at?: string;
    [k: string]: any;
  }
}

export namespace GetMcpNameSpace {
  /**
   * MCP 详情返回
   * - 继承列表项结构，包含更多具体运行配置字段（如 `transport`、`command`、`args` 等）
   */
  export interface GetMcpResult extends ListMcpNameSpace.ListMcpResult {
    [k: string]: any;
  }
}

export namespace CreateMcpNameSpace {
  /**
   * 新建 MCP 请求体
   * 典型字段（参考 /v1/mcp 请求示例）：
   * - `name` 名称（必填）
   * - `transport` 传输方式（如 `stdio`、`http`）
   * - `command` 启动命令（如 `python`、`docker`、`http`）
   * - `args` 启动参数（数组或对象）
   * - `description` 描述
   * - `category` 分类（如 `开发`、`官方`、`document`）
   * - `trust_score` 可信度分数（number）
   * - `disabled` 是否禁用
   *
   * 后端常见扩展字段（实际可随后端透传）：
   * - 其他与具体 MCP 配置相关的属性
   */
  export interface CreateMcpParams {
    name: string;
    transport: string;
    command: string;
    args?: string[] | { [k: string]: any };
    description?: string;
    category?: string;
    trust_score?: number;
    disabled?: boolean;
    [k: string]: any;
  }
  /**
   * 新建 MCP 返回
   */
  export interface CreateMcpResult extends ListMcpNameSpace.ListMcpResult {
    [k: string]: any;
  }
}

export namespace UpdateMcpNameSpace {
  /**
   * 更新 MCP 请求体
   * - 字段与创建类似，用于更新已有 MCP 的基础信息或配置
   */
  export interface UpdateMcpParams {
    name?: string;
    transport?: string;
    command?: string;
    args?: string[] | { [k: string]: any };
    description?: string;
    category?: string;
    trust_score?: number;
    disabled?: boolean;
    [k: string]: any;
  }
  /**
   * 更新 MCP 返回
   */
  export interface UpdateMcpResult extends ListMcpNameSpace.ListMcpResult {
    [k: string]: any;
  }
}

export namespace SearchMcpNameSpace {
  /**
   * MCP 搜索参数
   * - `q` 关键词（必填）
   * - `k` 返回数量或近邻数量（可选）
   * - `agent_id` 代理标识（可选）
   * - `alpha`、`theta`、`N` 搜索相关参数（可选）
   */
  export interface SearchMcpParams {
    q: string;
    k?: number;
    agent_id?: number;
    alpha?: number;
    theta?: number;
    N?: number;
    [k: string]: any;
  }
  /**
   * MCP 搜索结果
   * - 典型字段：`id`、`name`、`score`
   * - 后端可能返回扩展评分字段：`sem_score`（语义分数）、`total_score`（综合分数）
   */
  export interface SearchMcpResult {
    id?: number;
    name?: string;
    score?: number | null;
    [k: string]: any;
  }
}

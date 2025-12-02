/* eslint-disable @typescript-eslint/no-explicit-any */

/** @description 分页参数 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
  filter?: any;
  [k: string]: any;
}

/** @description 分页返回 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  [k: string]: any;
}

/** @description Agent 列表 */
export namespace ListAgentsNameSpace {
  /** @description Agent 列表 参数 */
  export interface ListAgentsParams extends PaginationParams {
    type?: "self" | "tenant";
    [k: string]: any;
  }

  /** @description Agent 列表 返回结果项 */
  export interface ListAgentsResult {
    id?: number;
    name?: string;
    description?: string | null;
    disabled?: boolean;
    mcp_agent_ids?: number[];
    document_ids?: string[];
    tenant_id?: string;
    created_at?: string;
    created_by_id?: string | number;
    updated_at?: string;
    [k: string]: any;
  }
}

/** @description 获取 Agent 详情 */
export namespace GetAgentNameSpace {
  /** @description 获取 Agent 详情 返回结果 */
  export interface GetAgentResult extends ListAgentsNameSpace.ListAgentsResult {
    [k: string]: any;
  }
}

/** @description 创建 Agent */
export namespace CreateAgentNameSpace {
  /** @description 创建 Agent 参数 */
  export interface CreateAgentParams {
    name: string;
    description?: string;
    disabled?: boolean;
    mcp_agent_ids?: number[];
    document_ids?: string[];
    [k: string]: any;
  }
  /** @description 创建 Agent 返回结果 */
  export interface CreateAgentResult
    extends ListAgentsNameSpace.ListAgentsResult {
    [k: string]: any;
  }
}

/** @description 更新 Agent */
export namespace UpdateAgentNameSpace {
  /** @description 更新 Agent 参数 */
  export interface UpdateAgentParams {
    name?: string;
    description?: string;
    disabled?: boolean;
    mcp_agent_ids?: number[];
    document_ids?: string[];
    [k: string]: any;
  }
  /** @description 更新 Agent 返回结果 */
  export interface UpdateAgentResult
    extends ListAgentsNameSpace.ListAgentsResult {
    [k: string]: any;
  }
}

/** @description 更新 Agent API 密钥 */
export namespace UpdateAgentApiNameSpace {
  /** @description 更新 Agent API 密钥 参数 */
  export interface UpdateAgentApiParams {
    api_name?: string;
    api_key?: string;
    [k: string]: any;
  }
  /** @description 更新 Agent API 密钥 返回结果 */
  export interface UpdateAgentApiResult
    extends ListAgentsNameSpace.ListAgentsResult {
    [k: string]: any;
  }
}

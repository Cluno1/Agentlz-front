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
/** @description 聊天 Agent
 *
 * @param agent_id Agent ID 如果没有提供api_name和api_key, 则必须提供agent_id,并且会验证用户token
 * @param api_name Agent API 名称
 * @param api_key Agent API 密钥
 * @param type 聊天类型（0：创建新纪录，1：继续已有纪录,可以获取历史纪录）必须, 默认创建新纪录
 * @param record_id record的ID（仅在 `type=1` 时有效）如果type是1, 则必须提供record_id, 否则会报错
 * @param meta 元数据，该信息用于确认该record归宿问题, 必须, 如果type是1, 则通过该meta确认该record是否属于该用户; 如果type是0, 则meta信息用于后续记录的查询与关联历史纪录
 * @param message 聊天消息
 */
export interface AgentChatInput {
  agent_id?: number;
  api_name?: string;
  api_key?: string;
  type: 0 | 1;
  record_id?: number;
  meta?: Record<string, any>;
  message: string;
  [k: string]: any;
}

export interface AgentChatStreamChunk {
  delta?: string;
  text?: string;
  done?: boolean;
  [k: string]: any;
}

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

/** @description 文档列表 */
export namespace ListRagDocsNameSpace {
  /** @description 文档列表 参数 */
  export interface ListRagDocsParams extends PaginationParams {
    type?: "system" | "self" | "tenant";
    [k: string]: any;
  }

  /** @description 文档列表 返回结果项 */
  export interface ListRagDocsResult {
    id?: string;
    tenant_id?: string;
    uploaded_by_user_id?: number;
    status?: string;
    upload_time?: string;
    title?: string;
    content?: string;
    type?: string;
    tags?: string | string[];
    description?: string | null;
    meta_https?: any;
    save_https?: any;
    tenant_name?: string;
    uploaded_by_user_name?: string;
    uploaded_by_user_username?: string;
    uploaded_by_user_avatar?: string;
    uploaded_by_user_email?: string;
    [k: string]: any;
  }
}

/** @description 获取单文档 */
export namespace GetRagDocNameSpace {
  /** @description 获取单文档 返回结果 */
  export interface GetRagDocResult
    extends ListRagDocsNameSpace.ListRagDocsResult {
    [k: string]: any;
  }
}

/** @description 更新文档 */
export namespace UpdateRagDocNameSpace {
  /** @description 更新文档 参数 */
  export interface UpdateRagDocParams {
    uploaded_by_user_id?: string;
    status?: string;
    title?: string;
    content?: string;
    type?: string;
    tags?: string | string[];
    description?: string;
    meta_https?: any;
    [k: string]: any;
  }
  /** @description 更新文档 返回结果 */
  export interface UpdateRagDocResult
    extends ListRagDocsNameSpace.ListRagDocsResult {
    [k: string]: any;
  }
}

/** @description 创建文档 */
export namespace CreateRagDocNameSpace {
  /** @description 创建文档 参数 */
  export interface CreateRagDocParams {
    document: string;
    document_type: string;
    title: string;
    uploaded_by_user_id?: string;
    tags?: string | string[];
    description?: string;
    meta_https?: any;
    /** @description 文档归属类型（system/self/tenant） */
    type?: "system" | "self" | "tenant";
    /**
     * @description 切片策略数组（字符串或数字形式）
     * 可接受：
     * - 字符串：'["0","1"]'、'0,1'、'0 1'
     * - 数组：['0','1']、[0,1]
     */
    strategy?: string | number | Array<string | number>;
    [k: string]: any;
  }
  /** @description 创建文档 返回结果 */
  export interface CreateRagDocResult
    extends ListRagDocsNameSpace.ListRagDocsResult {
    [k: string]: any;
  }
}

/** @description 下载文档 */
export namespace DownloadRagDocNameSpace {
  /** @description 下载文档 返回结果 */
  export type DownloadRagDocResult = string;
}

/** @description 发布分块解析任务（PUT /rag/{doc_id}/chunk） */
export namespace PublishChunkNameSpace {
  /** @description 请求载荷：策略列表（如 [1,2,3]） */
  export interface ChunkStrategyPayload {
    strategy: number[];
    [k: string]: any;
  }
  /** @description 返回结果（后端统一 Result 包装，data 字段为发布信息） */
  export interface PublishChunkResult {
    [k: string]: any;
  }
}

/** @description 列出指定文档的所有切割策略的分块列表（GET /rag/{doc_id}/strategy） */
export namespace ListDocStrategiesNameSpace {
  /** @description 单个分块元素 */
  export interface ChunkItem {
    index: number;
    chunk_id?: string;
    content?: string;
    created_at?: string;
    embedding?: number[] | null;
    [k: string]: any;
  }
  /** @description 聚合结构，按策略编号分组（键为策略编号字符串，如 "0","1",...） */
  export interface StrategyGroup {
    doc_id: string;
    tenant_id: string;
    [strategyKey: string]: any;
  }
  /** @description 返回结果：聚合数组 */
  export type ListDocStrategiesResult = StrategyGroup[];
}

/** @description 列出指定文档在特定策略下的分块列表（GET /rag/{doc_id}/strategy/{strategy}） */
export namespace ListStrategyChunksNameSpace {
  /** @description 返回结构与上方聚合结构一致，通常仅包含单一策略键 */
  export type ListStrategyChunksResult =
    ListDocStrategiesNameSpace.StrategyGroup[];
}

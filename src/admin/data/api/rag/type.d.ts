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
    uploaded_by_user_id?: string;
    status?: string;
    upload_time?: string;
    title?: string;
    content?: string;
    type?: string;
    tags?: string | string[];
    description?: string;
    meta_https?: any;
    save_https?: any;
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

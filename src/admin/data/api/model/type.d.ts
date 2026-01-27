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

/** @description Model 列表 */
export namespace ListModelsNameSpace {
  /** @description Model 列表 参数 */
  export interface ListModelsParams extends PaginationParams {
    [k: string]: any;
  }

  /** @description Model 列表 返回结果项 */
  export interface ListModelsResult {
    id?: number;
    name?: string;
    price?: string | null;
    description?: string | null;
    manufacturer?: string | null;
    tags?: string[] | null;
    created_at?: string;
    updated_at?: string;
    [k: string]: any;
  }
}

/** @description 获取 Model 详情 */
export namespace GetModelNameSpace {
  /** @description 获取 Model 详情 返回结果 */
  export interface GetModelResult extends ListModelsNameSpace.ListModelsResult {
    [k: string]: any;
  }
}

/** @description 创建 Model */
export namespace CreateModelNameSpace {
  /** @description 创建 Model 参数 */
  export interface CreateModelParams {
    name: string;
    price?: number;
    description?: string;
    [k: string]: any;
  }
  /** @description 创建 Model 返回结果 */
  export interface CreateModelResult
    extends ListModelsNameSpace.ListModelsResult {
    [k: string]: any;
  }
}

/** @description 更新 Model */
export namespace UpdateModelNameSpace {
  /** @description 更新 Model 参数 */
  export interface UpdateModelParams {
    name?: string;
    price?: number;
    description?: string;
    [k: string]: any;
  }
  /** @description 更新 Model 返回结果 */
  export interface UpdateModelResult
    extends ListModelsNameSpace.ListModelsResult {
    [k: string]: any;
  }
}

/** @description 删除 Model 返回 */
export namespace DeleteModelNameSpace {
  export interface DeleteModelResult {
    deleted: boolean;
    [k: string]: any;
  }
}

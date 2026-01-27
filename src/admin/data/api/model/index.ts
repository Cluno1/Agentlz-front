/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "../../httpClient";
import type {
  PaginationParams,
  PaginationResult,
  ListModelsNameSpace,
  GetModelNameSpace,
  CreateModelNameSpace,
  UpdateModelNameSpace,
  DeleteModelNameSpace,
} from "./type";

/**
 * 列表查询 Model
 *
 * 接口：GET /v1/models
 * - 查询参数：
 *   - `page` 分页页码，默认 1
 *   - `per_page` 每页条数，默认 10
 *   - `sort` 排序字段，默认 `id`
 *   - `order` 排序方式，`ASC` | `DESC`，默认 `DESC`
 *   - `q` 关键词过滤（可选）
 * - 请求头：`Authorization`、`X-Tenant-ID`（由 httpClient 统一管理）
 *
 * 返回：
 * - 统一 Result 风格；本方法将 `data.rows` 或顶层数组标准化为 `PaginationResult<ListModelsResult>`
 *
 * 示例：
 * ```ts
 * const { data, total } = await listModels({ page: 1, perPage: 20, sortField: "name", sortOrder: "ASC", filter: { q: "pro" } });
 * ```
 */
export async function listModels(
  params: ListModelsNameSpace.ListModelsParams,
): Promise<PaginationResult<ListModelsNameSpace.ListModelsResult>> {
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
    const res = await httpClient.get("/models", { params: query });
    const json = res.data;
    const rows =
      (json?.data?.rows as any[]) ??
      (json?.rows as any[]) ??
      (Array.isArray(json) ? (json as any[]) : []);
    const total = json?.data?.total ?? json?.total ?? rows.length ?? 0;
    return { data: rows as ListModelsNameSpace.ListModelsResult[], total };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/**
 * 查询 Model 详情
 *
 * 接口：GET /v1/models/{model_id}
 * - 路径参数：`model_id` Model 标识
 * - 请求头：`Authorization`、`X-Tenant-ID`
 *
 * 返回：
 * - 统一 Result 风格：`Result(row)`，不存在时服务端返回 404
 *
 * 示例：
 * ```ts
 * const detail = await getModel(12);
 * ```
 */
export async function getModel(
  modelId: number,
): Promise<GetModelNameSpace.GetModelResult> {
  try {
    const res = await httpClient.get(`/models/${modelId}`);
    return (res.data?.data ?? res.data) as GetModelNameSpace.GetModelResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/**
 * 新增 Model
 *
 * 接口：POST /v1/models
 * - 权限：管理员（require_admin）
 * - 请求体：JSON `{ name, price, description }`
 *   - 校验：`name` 必填（服务端校验）
 * - 请求头：`Authorization`、`Content-Type: application/json`
 *
 * 返回：
 * - 统一 Result 风格：`Result(row)`（新建记录）
 *
 * 示例：
 * ```ts
 * const created = await createModel({ name: "Pro", price: 99.9, description: "高级版" });
 * ```
 */
export async function createModel(
  payload: CreateModelNameSpace.CreateModelParams,
): Promise<CreateModelNameSpace.CreateModelResult> {
  try {
    const res = await httpClient.post("/models", payload);
    return (res.data?.data ??
      res.data) as CreateModelNameSpace.CreateModelResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/**
 * 更新 Model
 *
 * 接口：PUT /v1/models/{model_id}
 * - 权限：管理员（require_admin）
 * - 路径参数：`model_id` Model 标识
 * - 请求体：JSON 部分字段 `{ name?, price?, description? }`
 * - 请求头：`Authorization`、`Content-Type: application/json`
 *
 * 返回：
 * - 统一 Result 风格：`Result(row)`（更新后的记录），不存在或未变更时返回 404/业务错误
 *
 * 示例：
 * ```ts
 * const updated = await updateModel(12, { price: 129.0 });
 * ```
 */
export async function updateModel(
  modelId: number,
  updates: UpdateModelNameSpace.UpdateModelParams,
): Promise<UpdateModelNameSpace.UpdateModelResult> {
  try {
    const res = await httpClient.put(`/models/${modelId}`, updates);
    return (res.data?.data ??
      res.data) as UpdateModelNameSpace.UpdateModelResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/**
 * 删除 Model
 *
 * 接口：DELETE /v1/models/{model_id}
 * - 权限：管理员（require_admin）
 * - 路径参数：`model_id` Model 标识
 * - 请求头：`Authorization`
 *
 * 返回：
 * - 统一 Result 风格：`Result({ deleted: true })`，不存在时返回 404
 *
 * 示例：
 * ```ts
 * const res = await deleteModel(12);
 * // res.deleted === true
 * ```
 */
export async function deleteModel(
  modelId: number,
): Promise<DeleteModelNameSpace.DeleteModelResult> {
  try {
    const res = await httpClient.delete(`/models/${modelId}`);
    return (res.data?.data ??
      res.data) as DeleteModelNameSpace.DeleteModelResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

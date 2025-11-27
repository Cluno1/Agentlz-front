/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "../../httpClient";
import type {
  PaginationParams,
  PaginationResult,
  ListRagDocsNameSpace,
  GetRagDocNameSpace,
  UpdateRagDocNameSpace,
  CreateRagDocNameSpace,
  DownloadRagDocNameSpace,
} from "./type";

/** @description 文档列表查询（分页）
 * 参数：分页/排序/搜索（q）、数据范围 type(system|self|tenant)
 * 返回值：{ data: 列表[], total: 总数 }
 * 异常：网络或权限错误时抛出 Error，并打印“接口错误”
 */
export async function listDocuments(
  params: ListRagDocsNameSpace.ListRagDocsParams,
): Promise<PaginationResult<ListRagDocsNameSpace.ListRagDocsResult>> {
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
    const res = await httpClient.get("/rag", { params: query });
    const json = res.data;
    const rows =
      (json?.data?.rows as any[]) ??
      (json?.rows as any[]) ??
      (Array.isArray(json) ? (json as any[]) : []);
    const total = json?.data?.total ?? json?.total ?? rows.length ?? 0;
    return { data: rows as ListRagDocsNameSpace.ListRagDocsResult[], total };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 获取单文档
 * 参数：docId 文档ID
 * 返回值：文档记录
 * 异常：权限不足/不存在等情况抛出 Error
 */
export async function getDocument(
  docId: string,
): Promise<GetRagDocNameSpace.GetRagDocResult> {
  try {
    const res = await httpClient.get(`/rag/${docId}`);
    return (res.data?.data ?? res.data) as GetRagDocNameSpace.GetRagDocResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 更新文档
 * 参数：docId 文档ID；updates 允许字段见文档（uploaded_by_user_id/status/title/content/type/tags/description/meta_https）
 * 返回值：更新后的记录
 * 异常：权限不足/校验失败抛出 Error
 */
export async function updateDocument(
  docId: string,
  updates: UpdateRagDocNameSpace.UpdateRagDocParams,
): Promise<UpdateRagDocNameSpace.UpdateRagDocResult> {
  try {
    const res = await httpClient.put(`/rag/${docId}`, updates);
    return (res.data?.data ??
      res.data) as UpdateRagDocNameSpace.UpdateRagDocResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 删除文档
 * 参数：docId 文档ID
 * 返回值：Promise<void>
 * 异常：权限不足/不存在抛出 Error
 */
export async function deleteDocument(docId: string): Promise<void> {
  try {
    await httpClient.delete(`/rag/${docId}`);
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 下载文档（text/plain）
 * 参数：docId 文档ID
 * 返回值：纯文本字符串内容
 * 异常：权限不足/不存在抛出 Error
 */
export async function downloadDocument(
  docId: string,
): Promise<DownloadRagDocNameSpace.DownloadRagDocResult> {
  try {
    const res = await httpClient.get(`/rag/${docId}/download`, {
      responseType: "text",
    } as any);
    return res.data as string;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 创建文档
 * 参数：payload(document/document_type/title 等)；可选 type(system|self|tenant) 作为 Query
 * 返回值：新建记录
 * 异常：类型不支持/认证错误抛出 Error
 */
export async function createDocument(
  payload: CreateRagDocNameSpace.CreateRagDocParams | FormData,
): Promise<CreateRagDocNameSpace.CreateRagDocResult> {
  try {
    // 如果是 FormData，需要设置正确的 Content-Type
    const config =
      payload instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined;

    const res = await httpClient.post("/rag", payload, config);
    return (res.data?.data ??
      res.data) as CreateRagDocNameSpace.CreateRagDocResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

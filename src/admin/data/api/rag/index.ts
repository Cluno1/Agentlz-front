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
  PublishChunkNameSpace,
  ListDocStrategiesNameSpace,
  ListStrategyChunksNameSpace,
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
      type,
    };
    const f: any = filter || {};
    if (f.title) query.title = f.title;
    if (f.tags) query.tags = f.tags;
    if (f.description) query.description = f.description;
    if (f.status) query.status = f.status;
    if (f.upload_time_start) query.upload_time_start = f.upload_time_start;
    if (f.upload_time_end) query.upload_time_end = f.upload_time_end;
    if (typeof f.disabled !== "undefined") query.disabled = f.disabled;
    if (f.uploaded_by_user_id)
      query.uploaded_by_user_id = f.uploaded_by_user_id;
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
 *
 * 额外说明（2026-01-22 更新）：
 * - 支持在 FormData 中追加字段 strategy（number），用于指定默认切片策略
 * - strategy 对应关系：
 *   0: basic_chinese_text_split（基础中文切割）
 *   1: split_markdown_into_chunks（递归字符切割，结构感知）
 *   2: chunk_fixed_length_boundary（固定长度 + 边界感知）
 *   3: chunk_semantic_similarity（语义相似度驱动切分）
 *   4: chunk_llm_semantic（LLM 语义分段，占位实现）
 *   5: chunk_hierarchical（章节→段落→句子层次切片）
 *   6: chunk_sliding_window（滑动窗口，高重叠上下文）
 *   7: chunk_structure_aware（结构感知：代码块/列表/表格）
 *   8: chunk_dynamic_adaptive（动态自适应：密度驱动）
 *   9: chunk_with_relations（跨块关系与联结）
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

    // 后端更新：strategy 为可选字符串（数组形式，如 ["0","1"] 或 "0,1"）
    // 这里进行规范化，统一将 strategy 规范为 JSON 字符串数组：["0","1",...]
    if (payload instanceof FormData) {
      const raw = payload.get("strategy");
      if (raw !== null && typeof raw !== "undefined") {
        let normalized = "";
        if (typeof raw === "string") {
          const s = raw.trim();
          if (s.length > 0) {
            if (s.startsWith("[") && s.endsWith("]")) {
              try {
                const arr = JSON.parse(s);
                const arrNorm = Array.isArray(arr)
                  ? arr.map((v: any) => String(v))
                  : [String(arr)];
                normalized = JSON.stringify(arrNorm);
              } catch {
                const arr = s
                  .split(/[,\s]+/)
                  .filter(Boolean)
                  .map(String);
                normalized = JSON.stringify(arr);
              }
            } else {
              const arr = s
                .split(/[,\s]+/)
                .filter(Boolean)
                .map(String);
              normalized = JSON.stringify(arr);
            }
          }
        }
        if (normalized) {
          payload.set("strategy", normalized);
        }
      }
    }

    const res = await httpClient.post("/rag", payload, config);
    return (res.data?.data ??
      res.data) as CreateRagDocNameSpace.CreateRagDocResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 为指定文档发布分块解析任务（RabbitMQ）
 * 路由：PUT /rag/{doc_id}/chunk
 * 输入：{ strategy: number[] } 策略编号列表
 * 说明：每个策略将发布一条解析任务到队列 doc_parse_tasks
 */
export async function publishDocumentChunk(
  docId: string,
  payload: PublishChunkNameSpace.ChunkStrategyPayload,
): Promise<PublishChunkNameSpace.PublishChunkResult> {
  try {
    const res = await httpClient.put(`/rag/${docId}/chunk`, payload);
    return (res.data?.data ??
      res.data) as PublishChunkNameSpace.PublishChunkResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 列出指定文档的所有切割策略的分块列表（分页）
 * 路由：GET /rag/{doc_id}/strategy
 * Query：limit（默认20，1-200）、offset（默认0）、include_vector（是否返回向量）
 * 返回：聚合后的分块列表，按策略编号分组
 */
export async function listDocumentStrategies(
  docId: string,
  params?: { limit?: number; offset?: number; include_vector?: boolean },
): Promise<ListDocStrategiesNameSpace.ListDocStrategiesResult> {
  try {
    const res = await httpClient.get(`/rag/${docId}/strategy`, {
      params: {
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
        include_vector: params?.include_vector ?? false,
      },
    });
    return (res.data?.data ??
      res.data) as ListDocStrategiesNameSpace.ListDocStrategiesResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 列出指定文档在特定策略下的分块列表（分页）
 * 路由：GET /rag/{doc_id}/strategy/{strategy}
 * Query：limit（默认20，1-200）、offset（默认0）、include_vector（是否返回向量）
 * 返回：仅包含指定策略分组的分块列表
 */
export async function listDocumentStrategyChunks(
  docId: string,
  strategy: string | number,
  params?: { limit?: number; offset?: number; include_vector?: boolean },
): Promise<ListStrategyChunksNameSpace.ListStrategyChunksResult> {
  try {
    const res = await httpClient.get(
      `/rag/${docId}/strategy/${String(strategy)}`,
      {
        params: {
          limit: params?.limit ?? 20,
          offset: params?.offset ?? 0,
          include_vector: params?.include_vector ?? false,
        },
      },
    );
    return (res.data?.data ??
      res.data) as ListStrategyChunksNameSpace.ListStrategyChunksResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

import { createDocument } from "../../data/api/rag";
import {
  initUpload,
  getUploadTask,
  completeUpload,
  abortUpload,
} from "../../data/api/uploads";
import type {
  UploadCallbacks,
  UploadResult,
  UploadTaskState,
  PartRecord,
} from "./types";
import { getUploadState, putUploadState, removeUploadState } from "./idb";

const MB = 1024 * 1024;

function inferDocumentType(file: File) {
  /**
   * 推断后端的 document_type 字段。
   *
   * 参数：
   * - file: 浏览器 File 对象
   * 返回值：
   * - 优先返回文件扩展名（例如 pdf/docx/mp4）
   * - 兜底返回 file.type 或 "txt"
   * 异常：无
   */
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return ext || file.type || "txt";
}

function normalizeTags(tags?: string[]) {
  /**
   * 规范化标签数组（去空值）。
   *
   * 参数：tags 可选
   * 返回值：过滤后的字符串数组
   * 异常：无
   */
  return tags?.filter(Boolean) || [];
}

function normalizeStrategy(strategy?: string[]) {
  /**
   * 规范化策略数组（去空值）。
   *
   * 参数：strategy 可选
   * 返回值：过滤后的字符串数组
   * 异常：无
   */
  return strategy?.filter(Boolean) || [];
}

function resolveFileType(fileType?: string) {
  /**
   * 将内部 fileType 标准化为后端可识别值。
   *
   * 参数：fileType（"video" | 其他）
   * 返回值："video" | "doc"
   * 异常：无
   */
  if (fileType === "video") return "video";
  return "doc";
}

function inferFileType(file: File) {
  /**
   * 依据 mime/扩展名推断当前文件属于“视频”还是“文档”。
   *
   * 参数：file
   * 返回值："video" | "doc"
   * 异常：无
   */
  if (file.type?.startsWith("video/")) return "video";
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "video";
  return "doc";
}

function initialSizeLevel(fileType: string) {
  /**
   * 初始化分片大小档位（worker 会根据速度动态调整）。
   *
   * 参数：fileType（"video" | "doc"）
   * 返回值：初始档位（整数）
   * 异常：无
   */
  return fileType === "video" ? 1 : 1;
}

function createWorker() {
  /**
   * 创建上传 worker（用于：分片上传、分片 hash、整文件 hash）。
   *
   * 参数：无
   * 返回值：Worker
   * 异常：
   * - 浏览器不支持 Worker/模块 Worker 时可能抛错
   */
  return new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });
}

function getCurrentTenantId(): string {
  /**
   * 读取当前租户ID（前端 localStorage）。
   */
  return localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default";
}

function getCurrentSub(): string {
  /**
   * 解析 JWT 的 payload.sub 作为用户唯一ID（字符串）。
   * 注意：未校验签名，仅用于前端状态隔离。
   */
  const token = localStorage.getItem(import.meta.env.VITE_TOKEN_KEY) || "";
  const parts = token.split(".");
  if (parts.length >= 2) {
    try {
      const payload = JSON.parse(atob(parts[1]));
      const sub = String(payload?.sub || "");
      return sub || "";
    } catch {
      return "";
    }
  }
  return "";
}

async function computeFileHash(
  file: File,
  onProgress?: (loaded: number, total: number) => void,
): Promise<string> {
  /**
   * 计算整文件 MD5（file_hash），用于：
   * - 秒传：命中 file_fingerprint(tenant_id + file_hash + size) 直接复用
   * - 完整性校验：后端扫描时会对比前端上报的 file_hash
   *
   * 说明：
   * - 实际计算发生在 worker 中，避免阻塞主线程 UI
   * - worker 会持续回传 hashProgress（用于 UI 进度条）
   *
   * 参数：
   * - file: File
   * - onProgress: 可选进度回调
   * 返回值：Promise<string>（md5 hex）
   * 异常：
   * - Worker 初始化失败/执行失败会 reject
   */
  const worker = createWorker();
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      if (event.data?.type === "hashProgress") {
        onProgress?.(event.data.loaded || 0, event.data.total || file.size);
        return;
      }
      if (event.data?.type === "fileHash") {
        resolve(event.data.hash);
        worker.terminate();
      }
    };
    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };
    worker.postMessage({ type: "hashFile", file });
  });
}

async function ensureTaskState(
  file: File,
  fileHash: string,
  params: {
    type: string;
    title?: string;
    description?: string;
    tags?: string[];
    strategy?: string[];
    is_evaluation?: boolean;
  },
  fileType: string,
): Promise<{
  state: UploadTaskState;
  resumed: boolean;
  instant: UploadResult | null;
}> {
  /**
   * 保证存在一个可用的“上传任务状态”：
   * - 若本地 IndexedDB 存在旧状态，则尝试拉取后端任务进度并合并，继续续传
   * - 若后端判定秒传命中，则直接返回 instant=completed
   * - 否则调用 /v1/uploads/init 创建新的 multipart 任务并落库到 IndexedDB
   *
   * 参数：
   * - file: File
   * - fileHash: 整文件 md5
   * - params: 业务字段（type/title/description/tags/strategy）
   * - fileType: "video" | "doc"
   *
   * 返回值：
   * - { state, resumed, instant }
   *   - resumed=true 表示从本地状态续传
   *   - instant!=null 表示秒传命中/已完成
   *
   * 异常：
   * - 后端接口失败会抛出
   */
  const existing = await getUploadState(fileHash);
  if (existing) {
    // 跨账号/跨租户防复用：若本地状态的 ownerSub/tenantId 与当前不一致，则清理旧状态
    const currSub = getCurrentSub();
    const currTenant = getCurrentTenantId();
    if (existing.ownerSub !== currSub || existing.tenantId !== currTenant) {
      await removeUploadState(fileHash);
    } else {
      try {
        const tenantIdHeader =
          params.type === "self" ? "default" : getCurrentTenantId();
        const perReqConfig = { headers: { "X-Tenant-ID": tenantIdHeader } };
        const latest = await getUploadTask(existing.taskId, perReqConfig);
        if (latest.status === "completed" && latest.scan_status === "passed") {
          await removeUploadState(fileHash);
          return {
            state: existing,
            resumed: false,
            instant: {
              status: "completed",
              documentId: latest.document_id,
              finalUrl: latest.final_url,
              taskId: existing.taskId,
            },
          };
        }
        if (latest.status === "aborted" || latest.status === "failed") {
          await removeUploadState(fileHash);
        } else {
          const merged: UploadTaskState = {
            ...existing,
            uploadedParts: latest.uploaded_parts || existing.uploadedParts,
          };
          await putUploadState(merged);
          return { state: merged, resumed: true, instant: null };
        }
      } catch {
        // 若后端因权限拒绝（403），清理旧状态并走新任务
        await removeUploadState(fileHash);
      }
    }
  }
  const tenantIdHeader =
    params.type === "self" ? "default" : getCurrentTenantId();
  const perReqConfig = { headers: { "X-Tenant-ID": tenantIdHeader } };
  const initResp = await initUpload(
    {
      filename: file.name,
      size: file.size,
      content_type: file.type,
      file_type: resolveFileType(fileType),
      file_hash: fileHash,
      type: params.type,
      title: params.title,
      description: params.description,
      tags: normalizeTags(params.tags),
      strategy: normalizeStrategy(params.strategy),
      document_type: inferDocumentType(file),
      is_evaluation: params.is_evaluation,
    },
    perReqConfig,
  );
  if (initResp.status === "completed") {
    return {
      state: {} as UploadTaskState,
      resumed: false,
      instant: {
        status: "completed",
        documentId: initResp.document_id,
        finalUrl: initResp.final_url,
      },
    };
  }
  const state: UploadTaskState = {
    taskId: initResp.task_id as number,
    uploadId: initResp.upload_id as string,
    cosKey: initResp.cos_key as string,
    chunkSize: initResp.chunk_size as number,
    chunkCount: initResp.chunk_count as number,
    fileHash,
    fileSize: file.size,
    fileName: file.name,
    fileType: resolveFileType(fileType),
    documentType: inferDocumentType(file),
    type: params.type,
    tenantId: getCurrentTenantId(),
    ownerSub: getCurrentSub(),
    title: params.title,
    description: params.description,
    tags: normalizeTags(params.tags),
    strategy: normalizeStrategy(params.strategy),
    isEvaluation: !!params.is_evaluation,
    uploadedParts: [],
    partRecords: [],
    nextOffset: 0,
    nextPartNumber: 1,
    sizeLevel: initialSizeLevel(fileType),
    speedSamples: [],
    updatedAt: Date.now(),
  };
  await putUploadState(state);
  return { state, resumed: false, instant: null };
}

export async function uploadFileForRag(
  file: File,
  params: {
    type: string;
    title?: string;
    description?: string;
    tags?: string[];
    strategy?: string[];
    fileType?: string;
    is_evaluation?: boolean;
  },
  callbacks?: UploadCallbacks,
): Promise<UploadResult> {
  /**
   * RAG 上传入口（小文件走后端直传，大文件走 multipart + 直传 COS）。
   *
   * 阶段说明：
   * 1) <10MB：直接调用 /v1/rag（multipart/form-data），后端走 quarantine + 扫描 + 解析
   * 2) >=10MB：
   *   - hashing：worker 分块计算整文件 MD5（file_hash）
   *   - init：/v1/uploads/init 获取 task_id/upload_id/cos_key
   *   - uploading：worker 并发直传分片到 COS（先拿 part-url，再 PUT）
   *   - complete：/v1/uploads/{taskId}/complete 合并并投递扫描任务
   *   - waiting_scan：等待后端扫描通过后转正并触发解析
   *
   * 参数：
   * - file: File
   * - params: 文档字段（type/title/description/tags/strategy）
   * - callbacks: UI 回调（状态/进度/task 就绪）
   *
   * 返回值：
   * - UploadResult（对 UI 友好，不保证包含最终 URL）
   *
   * 异常：
   * - 网络失败/后端失败会抛出，页面层负责 toast
   */
  if (file.size < 10 * MB) {
    const formData = new FormData();
    formData.append("document", file, file.name);
    formData.append("document_type", inferDocumentType(file));
    formData.append("title", params.title || file.name);
    formData.append("type", params.type);
    if (params.is_evaluation) {
      formData.append("is_evaluation", "true");
    }
    if (params.strategy && params.strategy.length) {
      formData.append("strategy", JSON.stringify(params.strategy));
    }
    if (params.description) formData.append("description", params.description);
    if (params.tags && params.tags.length) {
      formData.append("tags", JSON.stringify(params.tags));
    }
    callbacks?.onStatus?.("uploading");
    await createDocument(formData);
    callbacks?.onStatus?.("completed");
    return { status: "completed" };
  }
  callbacks?.onStatus?.("hashing");
  const fileHash = await computeFileHash(file, (loaded, total) => {
    const percent = total > 0 ? (loaded / total) * 100 : 0;
    callbacks?.onProgress?.({
      total,
      uploaded: loaded,
      percent: Math.min(100, percent),
    });
  });
  const fileType = inferFileType(file);
  const {
    state: initState,
    resumed,
    instant,
  } = await ensureTaskState(
    file,
    fileHash,
    {
      type: params.type,
      title: params.title,
      description: params.description,
      tags: params.tags,
      strategy: params.strategy,
      is_evaluation: params.is_evaluation,
    },
    fileType,
  );
  if (instant) {
    callbacks?.onStatus?.("completed");
    return instant;
  }
  let state = initState;
  if (resumed) {
    const latest = await getUploadTask(state.taskId, {
      headers: {
        "X-Tenant-ID": state.type === "self" ? "default" : getCurrentTenantId(),
      },
    });
    state = {
      ...state,
      uploadedParts: latest.uploaded_parts || state.uploadedParts,
    };
    await putUploadState(state);
  }
  callbacks?.onTaskReady?.(state);
  callbacks?.onStatus?.("uploading");
  const worker = createWorker();
  let uploadedBytes = state.partRecords
    .filter((p) => p.status === "uploaded")
    .reduce((sum, p) => sum + p.size, 0);
  const updateProgress = () => {
    const percent = Math.min(100, (uploadedBytes / file.size) * 100);
    callbacks?.onProgress?.({
      total: file.size,
      uploaded: uploadedBytes,
      percent,
    });
  };
  updateProgress();
  const token = localStorage.getItem(import.meta.env.VITE_TOKEN_KEY) || "";
  const tenantId = state.type === "self" ? "default" : getCurrentTenantId();
  const partMap = new Map<number, PartRecord>();
  state.partRecords.forEach((p) => partMap.set(p.partNumber, p));
  const pendingParts = state.partRecords.filter((p) => p.status !== "uploaded");
  return await new Promise<UploadResult>((resolve, reject) => {
    const cleanup = () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.terminate();
    };
    const fail = (message: string) => {
      callbacks?.onStatus?.("failed");
      cleanup();
      reject(new Error(message));
    };
    const onError = (err: ErrorEvent) => {
      fail(err.message || "worker error");
    };

    const onMessage = async (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === "uploadFailed") {
        const msg = String(data.message || "upload failed");
        fail(msg);
        return;
      }
      if (data?.type === "partUploaded") {
        const existing = partMap.get(data.partNumber);
        const record: PartRecord = {
          partNumber: data.partNumber,
          offset: data.offset,
          size: data.size,
          etag: data.etag,
          partHash: data.partHash,
          status: "uploaded",
        };
        partMap.set(data.partNumber, record);
        if (!existing || existing.status !== "uploaded") {
          uploadedBytes += data.size;
        }
        state = {
          ...state,
          partRecords: Array.from(partMap.values()),
          uploadedParts: Array.from(partMap.values())
            .filter((p) => p.status === "uploaded")
            .map((p) => p.partNumber),
          nextOffset: data.nextOffset,
          nextPartNumber: data.nextPartNumber,
          sizeLevel: data.sizeLevel,
          speedSamples: data.speedSamples,
        };
        await putUploadState(state);
        updateProgress();
        return;
      }
      if (data?.type === "partFailed") {
        const existing = partMap.get(data.partNumber);
        if (existing) {
          partMap.set(data.partNumber, { ...existing, status: "failed" });
          state = {
            ...state,
            partRecords: Array.from(partMap.values()),
          };
          await putUploadState(state);
        }
        fail(String(data.message || "upload failed"));
        return;
      }
      if (data?.type === "allUploaded") {
        const parts = Array.from(partMap.values())
          .filter((p) => p.status === "uploaded")
          .map((p) => ({
            part_number: p.partNumber,
            etag: p.etag || "",
            part_hash: p.partHash,
          }));
        if (parts.length === 0) {
          fail("没有可提交的已上传分片");
          return;
        }
        try {
          await completeUpload(
            state.taskId,
            {
              parts,
              file_hash: fileHash,
            },
            {
              headers: {
                "X-Tenant-ID":
                  state.type === "self" ? "default" : getCurrentTenantId(),
              },
            },
          );
          callbacks?.onStatus?.("waiting_scan");
          await removeUploadState(fileHash);
          cleanup();
          resolve({ status: "waiting_scan", taskId: state.taskId });
        } catch (e: unknown) {
          const err = e instanceof Error ? e : new Error(String(e));
          fail(err.message || "complete failed");
        }
      }
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage({
      type: "startUpload",
      file,
      taskId: state.taskId,
      baseUrl: import.meta.env.VITE_API_BASE_URL,
      token,
      tenantId,
      fileType: state.fileType,
      contentType: file.type,
      concurrency: 6,
      partRecords: pendingParts,
      nextOffset: state.nextOffset,
      nextPartNumber: state.nextPartNumber,
      sizeLevel: state.sizeLevel,
      speedSamples: state.speedSamples,
    });
  });
}

export async function cancelUpload(state: UploadTaskState): Promise<void> {
  /**
   * 取消上传：
   * - 通知后端 abort multipart（释放 UploadId 会话）
   * - 清理本地 IndexedDB 状态
   *
   * 参数：UploadTaskState
   * 返回值：Promise<void>
   * 异常：后端失败会抛出
   */
  await abortUpload(state.taskId);
  await removeUploadState(state.fileHash);
}

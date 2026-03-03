export type UploadStatus =
  | "idle"
  | "hashing"
  | "uploading"
  | "paused"
  | "waiting_scan"
  | "processing"
  | "completed"
  | "failed";

/**
 * 上传进度信息
 * - total: 文件总大小（字节）
 * - uploaded: 已处理/已上传大小（字节）
 * - percent: 进度百分比（0-100）
 * - speed: 可选，速度（MB/s），通常由 worker 估算
 */
export type UploadProgress = {
  total: number;
  uploaded: number;
  percent: number;
  speed?: number;
};

/**
 * 单个分片记录（用于断点续传/对账）
 * - partNumber: 分片编号（从 1 开始）
 * - offset: 分片在文件中的偏移量（字节）
 * - size: 分片大小（字节）
 * - etag: COS 直传返回的 ETag（complete 时必需）
 * - partHash: 分片 MD5（用于调试/对账，可选）
 * - status: 分片状态
 */
export type PartRecord = {
  partNumber: number;
  offset: number;
  size: number;
  etag?: string;
  partHash?: string;
  status?: "pending" | "uploading" | "uploaded" | "failed";
};

/**
 * 上传任务在前端的持久化状态（IndexedDB）
 *
 * 说明：
 * - fileHash 是主键（keyPath），同一文件（MD5+size）会复用同一条记录
 * - nextOffset/nextPartNumber/sizeLevel/speedSamples 用于续传与动态分片档位调节
 */
export type UploadTaskState = {
  taskId: number;
  uploadId: string;
  cosKey: string;
  chunkSize: number;
  chunkCount: number;
  fileHash: string;
  fileSize: number;
  fileName: string;
  fileType: string;
  documentType: string;
  type: string;
  tenantId: string;
  ownerSub: string;
  title?: string;
  description?: string;
  tags?: string[];
  strategy?: string[];
  uploadedParts: number[];
  partRecords: PartRecord[];
  nextOffset: number;
  nextPartNumber: number;
  sizeLevel: number;
  speedSamples: number[];
  updatedAt: number;
};

/**
 * 上传结果（与 UI 状态解耦）
 * - status: 当前流程阶段的结果
 * - documentId/finalUrl: 秒传命中或扫描通过后可能返回
 * - taskId: 大文件上传会返回任务ID，供轮询/调试
 */
export type UploadResult = {
  status: UploadStatus;
  documentId?: string;
  finalUrl?: string;
  taskId?: number;
};

/**
 * 上传过程回调（用于 UI）
 * - onProgress: 进度变化（含“hashing”阶段）
 * - onStatus: 状态变化（idle/hashing/uploading/...）
 * - onTaskReady: 当 taskId 等关键字段就绪时触发（便于“取消”等操作）
 */
export type UploadCallbacks = {
  onProgress?: (progress: UploadProgress) => void;
  onStatus?: (status: UploadStatus) => void;
  onTaskReady?: (state: UploadTaskState) => void;
};

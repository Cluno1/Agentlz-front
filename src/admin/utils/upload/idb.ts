import type { UploadTaskState } from "./types";

const DB_NAME = "agentlz_uploads";
const STORE_NAME = "upload_tasks";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  /**
   * 打开（或创建）用于断点续传的 IndexedDB 数据库。
   *
   * 参数：无
   * 返回值：Promise<IDBDatabase>
   * 异常：
   * - indexedDB.open 失败会 reject（浏览器禁用/隐私模式/配额问题等）
   *
   * 存储结构：
   * - store: upload_tasks
   * - keyPath: fileHash（整文件 MD5）
   */
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "fileHash" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

export async function getUploadState(
  fileHash: string,
): Promise<UploadTaskState | null> {
  /**
   * 读取某个文件（fileHash）的上传任务状态，用于断点续传。
   *
   * 参数：
   * - fileHash: 整文件 MD5（worker 计算）
   * 返回值：
   * - UploadTaskState | null（不存在时返回 null）
   * 异常：
   * - 事务/读取失败会 reject
   */
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(fileHash);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve((req.result as UploadTaskState) || null);
  });
}

export async function putUploadState(state: UploadTaskState): Promise<void> {
  /**
   * 写入/更新某个文件（fileHash）的上传任务状态。
   *
   * 参数：
   * - state: UploadTaskState（会自动刷新 updatedAt）
   * 返回值：Promise<void>
   * 异常：
   * - 事务提交失败会 reject
   */
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ ...state, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeUploadState(fileHash: string): Promise<void> {
  /**
   * 删除某个文件（fileHash）的上传状态（例如：上传完成/取消后清理）。
   *
   * 参数：
   * - fileHash: 整文件 MD5
   * 返回值：Promise<void>
   * 异常：
   * - 事务提交失败会 reject
   */
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(fileHash);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

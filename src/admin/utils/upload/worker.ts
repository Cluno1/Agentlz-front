type WorkerMessage =
  | { type: "hashFile"; file: File }
  | {
      type: "startUpload";
      file: File;
      taskId: number;
      baseUrl: string;
      token: string;
      tenantId: string;
      fileType: string;
      contentType: string;
      concurrency: number;
      partRecords: Array<{
        partNumber: number;
        offset: number;
        size: number;
        status?: string;
      }>;
      nextOffset: number;
      nextPartNumber: number;
      sizeLevel: number;
      speedSamples: number[];
    }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "cancel" };

type PartTask = {
  partNumber: number;
  offset: number;
  size: number;
};

type WorkerToMainMessage =
  | { type: "hashProgress"; loaded: number; total: number }
  | { type: "fileHash"; hash: string; size: number }
  | {
      type: "partUploaded";
      partNumber: number;
      etag: string;
      partHash: string;
      size: number;
      offset: number;
      speed: number;
      nextOffset: number;
      nextPartNumber: number;
      sizeLevel: number;
      speedSamples: number[];
    }
  | { type: "partFailed"; partNumber: number; message: string }
  | { type: "uploadFailed"; partNumber: number; message: string }
  | { type: "allUploaded" };

const MB = 1024 * 1024;
const DOC_LEVELS = [1 * MB, 2 * MB, 3 * MB, 4 * MB];
const VIDEO_LEVELS = [2 * MB, 5 * MB, 8 * MB, 10 * MB];

let currentFile: File | null = null;
let taskId = 0;
let baseUrl = "";
let token = "";
let tenantId = "";
let fileType = "doc";
let contentType = "application/octet-stream";
let concurrency = 6;
let paused = false;
let cancelled = false;
let active = 0;
let nextOffset = 0;
let nextPartNumber = 1;
let sizeLevel = 0;
let speedSamples: number[] = [];
let pendingParts: PartTask[] = [];
const controllers = new Map<number, AbortController>();
const ctx = self as DedicatedWorkerGlobalScope;

function post(message: WorkerToMainMessage) {
  ctx.postMessage(message);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function levels() {
  /**
   * 获取当前文件类型对应的分片大小档位表。
   *
   * 参数：无（使用全局 fileType）
   * 返回值：number[]（每个元素为字节数）
   * 异常：无
   */
  return fileType === "video" ? VIDEO_LEVELS : DOC_LEVELS;
}

function clampLevel(value: number) {
  /**
   * 将档位限制在可用范围内。
   *
   * 参数：
   * - value: 期望档位
   * 返回值：合法档位（0..levels.length-1）
   * 异常：无
   */
  const max = levels().length - 1;
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

function nextChunkSize() {
  /**
   * 获取下一次分片上传要使用的分片大小（字节）。
   *
   * 参数：无
   * 返回值：分片大小（字节）
   * 异常：无
   */
  return levels()[clampLevel(sizeLevel)];
}

function updateSpeed(size: number, durationMs: number) {
  /**
   * 估算上传速度，并动态调整分片档位（越快分片越大，越慢分片越小）。
   *
   * 参数：
   * - size: 本次分片大小（字节）
   * - durationMs: 本次上传耗时（毫秒）
   * 返回值：速度（MB/s）
   * 异常：无
   */
  const speed = durationMs > 0 ? size / (durationMs / 1000) / MB : 0;
  speedSamples.push(speed);
  if (speedSamples.length > 5) {
    speedSamples.shift();
  }
  const avg =
    speedSamples.reduce((sum, s) => sum + s, 0) / (speedSamples.length || 1);
  if (avg > 8) {
    sizeLevel = clampLevel(sizeLevel + 1);
  } else if (avg < 2) {
    sizeLevel = clampLevel(sizeLevel - 1);
  }
  return speed;
}

function enqueueMissing(parts: PartTask[]) {
  /**
   * 注入“待补传”的分片队列（用于断点续传，确保按 partNumber 升序处理）。
   *
   * 参数：parts（缺失分片列表）
   * 返回值：无（更新 pendingParts）
   * 异常：无
   */
  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  pendingParts = sorted;
}

class Md5 {
  /**
   * 增量 MD5 计算器（用于整文件 MD5 分块计算）。
   *
   * 说明：
   * - 不能直接使用 `file.arrayBuffer()` 一次性读全文件（大文件会卡顿/内存峰值高）
   * - 该实现允许分块 update(bytes)，最终 digestHex() 输出 md5 hex
   */
  private state: number[] = [1732584193, -271733879, -1732584194, 271733878];
  private tail = new Uint8Array(0);
  private length = 0;

  update(bytes: Uint8Array) {
    /**
     * 增量更新哈希状态。
     *
     * 参数：
     * - bytes: 本次分块数据
     * 返回值：void
     * 异常：无
     */
    if (bytes.length === 0) return;
    this.length += bytes.length;

    let offset = 0;
    if (this.tail.length > 0) {
      const need = 64 - this.tail.length;
      if (bytes.length < need) {
        const merged = new Uint8Array(this.tail.length + bytes.length);
        merged.set(this.tail, 0);
        merged.set(bytes, this.tail.length);
        this.tail = merged;
        return;
      }
      const block = new Uint8Array(64);
      block.set(this.tail, 0);
      block.set(bytes.subarray(0, need), this.tail.length);
      this.state = Md5.cycle(this.state, Md5.blk(block));
      this.tail = new Uint8Array(0);
      offset = need;
    }

    while (offset + 64 <= bytes.length) {
      const block = bytes.subarray(offset, offset + 64);
      this.state = Md5.cycle(this.state, Md5.blk(block));
      offset += 64;
    }

    if (offset < bytes.length) {
      this.tail = bytes.subarray(offset).slice();
    }
  }

  digestHex() {
    /**
     * 结束计算并输出 md5 hex 字符串。
     *
     * 参数：无
     * 返回值：string（32位 hex）
     * 异常：无
     */
    const totalLen = this.length;
    const tailLen = this.tail.length;
    const padLen = tailLen < 56 ? 56 - tailLen : 120 - tailLen;
    const padding = new Uint8Array(padLen + 8);
    padding[0] = 0x80;
    const bits = totalLen * 8;
    const low = bits >>> 0;
    const high = Math.floor(bits / 0x100000000) >>> 0;
    padding[padLen + 0] = low & 0xff;
    padding[padLen + 1] = (low >>> 8) & 0xff;
    padding[padLen + 2] = (low >>> 16) & 0xff;
    padding[padLen + 3] = (low >>> 24) & 0xff;
    padding[padLen + 4] = high & 0xff;
    padding[padLen + 5] = (high >>> 8) & 0xff;
    padding[padLen + 6] = (high >>> 16) & 0xff;
    padding[padLen + 7] = (high >>> 24) & 0xff;

    const tmp = new Uint8Array(tailLen + padding.length);
    tmp.set(this.tail, 0);
    tmp.set(padding, tailLen);

    let st = [...this.state];
    for (let i = 0; i < tmp.length; i += 64) {
      st = Md5.cycle(st, Md5.blk(tmp.subarray(i, i + 64)));
    }
    return Md5.hex(st);
  }

  private static blk(block: Uint8Array) {
    const out = new Array<number>(16);
    for (let i = 0; i < 64; i += 4) {
      out[i >> 2] =
        block[i] |
        (block[i + 1] << 8) |
        (block[i + 2] << 16) |
        (block[i + 3] << 24);
    }
    return out;
  }

  private static add32(a: number, b: number) {
    return (a + b) | 0;
  }
  private static cmn(
    q: number,
    a: number,
    b: number,
    x: number,
    s: number,
    t: number,
  ) {
    a = Md5.add32(Md5.add32(a, q), Md5.add32(x, t));
    return Md5.add32((a << s) | (a >>> (32 - s)), b);
  }
  private static ff(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ) {
    return Md5.cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  private static gg(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ) {
    return Md5.cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  private static hh(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ) {
    return Md5.cmn(b ^ c ^ d, a, b, x, s, t);
  }
  private static ii(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ) {
    return Md5.cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  private static cycle(x: number[], k: number[]) {
    let a = x[0];
    let b = x[1];
    let c = x[2];
    let d = x[3];

    a = Md5.ff(a, b, c, d, k[0], 7, -680876936);
    d = Md5.ff(d, a, b, c, k[1], 12, -389564586);
    c = Md5.ff(c, d, a, b, k[2], 17, 606105819);
    b = Md5.ff(b, c, d, a, k[3], 22, -1044525330);
    a = Md5.ff(a, b, c, d, k[4], 7, -176418897);
    d = Md5.ff(d, a, b, c, k[5], 12, 1200080426);
    c = Md5.ff(c, d, a, b, k[6], 17, -1473231341);
    b = Md5.ff(b, c, d, a, k[7], 22, -45705983);
    a = Md5.ff(a, b, c, d, k[8], 7, 1770035416);
    d = Md5.ff(d, a, b, c, k[9], 12, -1958414417);
    c = Md5.ff(c, d, a, b, k[10], 17, -42063);
    b = Md5.ff(b, c, d, a, k[11], 22, -1990404162);
    a = Md5.ff(a, b, c, d, k[12], 7, 1804603682);
    d = Md5.ff(d, a, b, c, k[13], 12, -40341101);
    c = Md5.ff(c, d, a, b, k[14], 17, -1502002290);
    b = Md5.ff(b, c, d, a, k[15], 22, 1236535329);

    a = Md5.gg(a, b, c, d, k[1], 5, -165796510);
    d = Md5.gg(d, a, b, c, k[6], 9, -1069501632);
    c = Md5.gg(c, d, a, b, k[11], 14, 643717713);
    b = Md5.gg(b, c, d, a, k[0], 20, -373897302);
    a = Md5.gg(a, b, c, d, k[5], 5, -701558691);
    d = Md5.gg(d, a, b, c, k[10], 9, 38016083);
    c = Md5.gg(c, d, a, b, k[15], 14, -660478335);
    b = Md5.gg(b, c, d, a, k[4], 20, -405537848);
    a = Md5.gg(a, b, c, d, k[9], 5, 568446438);
    d = Md5.gg(d, a, b, c, k[14], 9, -1019803690);
    c = Md5.gg(c, d, a, b, k[3], 14, -187363961);
    b = Md5.gg(b, c, d, a, k[8], 20, 1163531501);
    a = Md5.gg(a, b, c, d, k[13], 5, -1444681467);
    d = Md5.gg(d, a, b, c, k[2], 9, -51403784);
    c = Md5.gg(c, d, a, b, k[7], 14, 1735328473);
    b = Md5.gg(b, c, d, a, k[12], 20, -1926607734);

    a = Md5.hh(a, b, c, d, k[5], 4, -378558);
    d = Md5.hh(d, a, b, c, k[8], 11, -2022574463);
    c = Md5.hh(c, d, a, b, k[11], 16, 1839030562);
    b = Md5.hh(b, c, d, a, k[14], 23, -35309556);
    a = Md5.hh(a, b, c, d, k[1], 4, -1530992060);
    d = Md5.hh(d, a, b, c, k[4], 11, 1272893353);
    c = Md5.hh(c, d, a, b, k[7], 16, -155497632);
    b = Md5.hh(b, c, d, a, k[10], 23, -1094730640);
    a = Md5.hh(a, b, c, d, k[13], 4, 681279174);
    d = Md5.hh(d, a, b, c, k[0], 11, -358537222);
    c = Md5.hh(c, d, a, b, k[3], 16, -722521979);
    b = Md5.hh(b, c, d, a, k[6], 23, 76029189);
    a = Md5.hh(a, b, c, d, k[9], 4, -640364487);
    d = Md5.hh(d, a, b, c, k[12], 11, -421815835);
    c = Md5.hh(c, d, a, b, k[15], 16, 530742520);
    b = Md5.hh(b, c, d, a, k[2], 23, -995338651);

    a = Md5.ii(a, b, c, d, k[0], 6, -198630844);
    d = Md5.ii(d, a, b, c, k[7], 10, 1126891415);
    c = Md5.ii(c, d, a, b, k[14], 15, -1416354905);
    b = Md5.ii(b, c, d, a, k[5], 21, -57434055);
    a = Md5.ii(a, b, c, d, k[12], 6, 1700485571);
    d = Md5.ii(d, a, b, c, k[3], 10, -1894986606);
    c = Md5.ii(c, d, a, b, k[10], 15, -1051523);
    b = Md5.ii(b, c, d, a, k[1], 21, -2054922799);
    a = Md5.ii(a, b, c, d, k[8], 6, 1873313359);
    d = Md5.ii(d, a, b, c, k[15], 10, -30611744);
    c = Md5.ii(c, d, a, b, k[6], 15, -1560198380);
    b = Md5.ii(b, c, d, a, k[13], 21, 1309151649);
    a = Md5.ii(a, b, c, d, k[4], 6, -145523070);
    d = Md5.ii(d, a, b, c, k[11], 10, -1120210379);
    c = Md5.ii(c, d, a, b, k[2], 15, 718787259);
    b = Md5.ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = Md5.add32(a, x[0]);
    x[1] = Md5.add32(b, x[1]);
    x[2] = Md5.add32(c, x[2]);
    x[3] = Md5.add32(d, x[3]);
    return x;
  }

  private static hex(x: number[]) {
    const hexChr = "0123456789abcdef".split("");
    let out = "";
    for (let i = 0; i < x.length; i += 1) {
      const n = x[i];
      out +=
        hexChr[(n >> 4) & 0x0f] +
        hexChr[n & 0x0f] +
        hexChr[(n >> 12) & 0x0f] +
        hexChr[(n >> 8) & 0x0f] +
        hexChr[(n >> 20) & 0x0f] +
        hexChr[(n >> 16) & 0x0f] +
        hexChr[(n >> 28) & 0x0f] +
        hexChr[(n >> 24) & 0x0f];
    }
    return out;
  }
}

function schedule() {
  /**
   * 调度分片上传任务：
   * - active < concurrency 时不断取 pendingParts 或生成新分片（按 nextOffset）
   * - 当所有分片上传完毕，发送 allUploaded 消息给主线程
   *
   * 参数：无
   * 返回值：void
   * 异常：无（单片异常在 uploadPart 内处理并回传 partFailed）
   */
  if (paused || cancelled || !currentFile) return;
  while (
    active < concurrency &&
    (pendingParts.length > 0 || nextOffset < currentFile.size)
  ) {
    const part =
      pendingParts.length > 0
        ? pendingParts.shift()!
        : (() => {
            const size = Math.min(
              nextChunkSize(),
              currentFile!.size - nextOffset,
            );
            const partNumber = nextPartNumber;
            const offset = nextOffset;
            nextOffset += size;
            nextPartNumber += 1;
            return { partNumber, offset, size };
          })();
    uploadPart(part);
  }
  if (
    active === 0 &&
    pendingParts.length === 0 &&
    currentFile &&
    nextOffset >= currentFile.size
  ) {
    post({ type: "allUploaded" });
  }
}

async function getPartUrl(part: PartTask, partHash: string) {
  /**
   * 向后端请求指定分片的预签名 URL。
   *
   * 参数：
   * - part: 分片信息（partNumber/offset/size）
   * - partHash: 分片 MD5（用于对账/可选校验）
   * 返回值：
   * - { url, method, required_headers }
   * 异常：
   * - 非 2xx 会抛出 Error
   */
  const resp = await fetch(`${baseUrl}/uploads/${taskId}/part-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Tenant-ID": tenantId,
    },
    body: JSON.stringify({
      part_number: part.partNumber,
      part_size: part.size,
      part_hash: partHash,
    }),
  });
  if (!resp.ok) {
    throw new Error(`part-url error: ${resp.status}`);
  }
  const json = await resp.json();
  return json.data || json;
}

async function uploadPart(part: PartTask) {
  /**
   * 上传单个分片到 COS：
   * 1) 读取该分片 blob
   * 2) 计算分片 MD5（partHash）
   * 3) 向后端拿到预签名 URL（part-url）
   * 4) PUT 直传 COS（失败自动指数退避重试）
   * 5) 成功后回传 partUploaded（含 etag/partHash/速度/下一偏移等）
   *
   * 参数：part
   * 返回值：void（通过 postMessage 通知主线程）
   * 异常：内部捕获并回传 partFailed，不向上抛出
   */
  if (!currentFile || cancelled) return;
  active += 1;
  const controller = new AbortController();
  controllers.set(part.partNumber, controller);
  try {
    const blob = currentFile.slice(part.offset, part.offset + part.size);
    const buf = await blob.arrayBuffer();
    const partHash = SparkMD5.ArrayBuffer.hash(buf);
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const urlResp = await getPartUrl(part, partHash);
        const url = urlResp.url as string;
        const headers = new Headers(urlResp.required_headers || {});
        if (!headers.has("Content-Type")) {
          headers.set(
            "Content-Type",
            contentType || "application/octet-stream",
          );
        }
        const start = performance.now();
        const putResp = await fetch(url, {
          method: "PUT",
          body: blob,
          headers,
          signal: controller.signal,
        });
        if (!putResp.ok) {
          throw new Error(`upload error: ${putResp.status}`);
        }
        const etagRaw =
          putResp.headers.get("ETag") || putResp.headers.get("etag") || "";
        const etag = etagRaw.replaceAll('"', "");
        const duration = performance.now() - start;
        const speed = updateSpeed(part.size, duration);
        post({
          type: "partUploaded",
          partNumber: part.partNumber,
          etag,
          partHash,
          size: part.size,
          offset: part.offset,
          speed,
          nextOffset,
          nextPartNumber,
          sizeLevel,
          speedSamples,
        });
        lastError = null;
        break;
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        lastError = error;
        const delay = Math.min(2000 * 2 ** attempt, 12000);
        await sleep(delay);
      }
    }
    if (lastError) {
      throw lastError;
    }
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error(String(e));
    if (!cancelled) {
      cancelled = true;
      paused = true;
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      pendingParts = [];
      post({
        type: "uploadFailed",
        partNumber: part.partNumber,
        message: error.message || "upload failed",
      });
    }
  } finally {
    controllers.delete(part.partNumber);
    active -= 1;
    schedule();
  }
}

self.onmessage = async (evt: MessageEvent<WorkerMessage>) => {
  /**
   * Worker 消息入口：
   * - hashFile：分块计算整文件 MD5，并持续回传 hashProgress
   * - startUpload：初始化上下文并开始分片上传调度
   * - pause/resume/cancel：控制上传行为
   */
  const msg = evt.data;
  if (msg.type === "hashFile") {
    const total = msg.file.size;
    const chunkSize = 4 * MB;
    const md5 = new Md5();
    let loaded = 0;
    while (loaded < total) {
      const end = Math.min(total, loaded + chunkSize);
      const buf = await msg.file.slice(loaded, end).arrayBuffer();
      md5.update(new Uint8Array(buf));
      loaded = end;
      post({ type: "hashProgress", loaded, total });
    }
    const hash = md5.digestHex();
    post({ type: "fileHash", hash, size: total });
    return;
  }
  if (msg.type === "startUpload") {
    currentFile = msg.file;
    taskId = msg.taskId;
    baseUrl = msg.baseUrl;
    token = msg.token;
    tenantId = msg.tenantId;
    fileType = msg.fileType;
    contentType = msg.contentType;
    concurrency = msg.concurrency;
    nextOffset = msg.nextOffset;
    nextPartNumber = msg.nextPartNumber;
    sizeLevel = msg.sizeLevel;
    speedSamples = msg.speedSamples || [];
    cancelled = false;
    paused = false;
    enqueueMissing(
      (msg.partRecords || [])
        .filter((p) => p.status !== "uploaded")
        .map((p) => ({
          partNumber: p.partNumber,
          offset: p.offset,
          size: p.size,
        })),
    );
    schedule();
    return;
  }
  if (msg.type === "pause") {
    paused = true;
    return;
  }
  if (msg.type === "resume") {
    paused = false;
    schedule();
    return;
  }
  if (msg.type === "cancel") {
    cancelled = true;
    paused = true;
    controllers.forEach((controller) => controller.abort());
    controllers.clear();
  }
};

class SparkMD5 {
  private static hexChr = "0123456789abcdef".split("");
  private _buff: ArrayBuffer | null = null;
  private _length = 0;
  private _hash: number[] = [1732584193, -271733879, -1732584194, 271733878];
  append(arr: ArrayBuffer) {
    const buff = this._buff;
    const length = arr.byteLength;
    const buffLength = buff ? buff.byteLength : 0;
    const newBuff = new ArrayBuffer(buffLength + length);
    const tmp = new Uint8Array(newBuff);
    if (buff) {
      tmp.set(new Uint8Array(buff), 0);
    }
    tmp.set(new Uint8Array(arr), buffLength);
    this._buff = newBuff;
    this._length += length;
    const blockLength = 64;
    let i;
    for (i = 64; i <= this._buff.byteLength; i += blockLength) {
      const block = this._buff.slice(i - 64, i);
      this._hash = SparkMD5._md5cycle(
        this._hash,
        SparkMD5._md5blk_array(block),
      );
    }
    this._buff = this._buff.slice(i - 64);
    return this;
  }
  end() {
    const buff = this._buff;
    const length = buff ? buff.byteLength : 0;
    const tail = new Uint8Array(64);
    let i;
    for (i = 0; i < length; i += 1) {
      tail[i] = new Uint8Array(buff as ArrayBuffer)[i];
    }
    tail[i] = 0x80;
    if (i >= 56) {
      this._hash = SparkMD5._md5cycle(
        this._hash,
        SparkMD5._md5blk_array(tail.buffer),
      );
      for (i = 0; i < 56; i += 1) {
        tail[i] = 0;
      }
    }
    const tmp = this._length * 8;
    tail[56] = tmp & 0xff;
    tail[57] = (tmp >>> 8) & 0xff;
    tail[58] = (tmp >>> 16) & 0xff;
    tail[59] = (tmp >>> 24) & 0xff;
    this._hash = SparkMD5._md5cycle(
      this._hash,
      SparkMD5._md5blk_array(tail.buffer),
    );
    return SparkMD5._hex(this._hash);
  }
  static ArrayBuffer = {
    hash(arr: ArrayBuffer) {
      return new SparkMD5().append(arr).end();
    },
  };
  private static _hex(x: number[]) {
    let out = "";
    for (let i = 0; i < x.length; i += 1) {
      const n = x[i];
      out +=
        SparkMD5.hexChr[(n >> 4) & 0x0f] +
        SparkMD5.hexChr[n & 0x0f] +
        SparkMD5.hexChr[(n >> 12) & 0x0f] +
        SparkMD5.hexChr[(n >> 8) & 0x0f] +
        SparkMD5.hexChr[(n >> 20) & 0x0f] +
        SparkMD5.hexChr[(n >> 16) & 0x0f] +
        SparkMD5.hexChr[(n >> 28) & 0x0f] +
        SparkMD5.hexChr[(n >> 24) & 0x0f];
    }
    return out;
  }
  private static _md5cycle(x: number[], k: number[]) {
    let a = x[0];
    let b = x[1];
    let c = x[2];
    let d = x[3];
    a = SparkMD5._ff(a, b, c, d, k[0], 7, -680876936);
    d = SparkMD5._ff(d, a, b, c, k[1], 12, -389564586);
    c = SparkMD5._ff(c, d, a, b, k[2], 17, 606105819);
    b = SparkMD5._ff(b, c, d, a, k[3], 22, -1044525330);
    a = SparkMD5._ff(a, b, c, d, k[4], 7, -176418897);
    d = SparkMD5._ff(d, a, b, c, k[5], 12, 1200080426);
    c = SparkMD5._ff(c, d, a, b, k[6], 17, -1473231341);
    b = SparkMD5._ff(b, c, d, a, k[7], 22, -45705983);
    a = SparkMD5._ff(a, b, c, d, k[8], 7, 1770035416);
    d = SparkMD5._ff(d, a, b, c, k[9], 12, -1958414417);
    c = SparkMD5._ff(c, d, a, b, k[10], 17, -42063);
    b = SparkMD5._ff(b, c, d, a, k[11], 22, -1990404162);
    a = SparkMD5._ff(a, b, c, d, k[12], 7, 1804603682);
    d = SparkMD5._ff(d, a, b, c, k[13], 12, -40341101);
    c = SparkMD5._ff(c, d, a, b, k[14], 17, -1502002290);
    b = SparkMD5._ff(b, c, d, a, k[15], 22, 1236535329);
    a = SparkMD5._gg(a, b, c, d, k[1], 5, -165796510);
    d = SparkMD5._gg(d, a, b, c, k[6], 9, -1069501632);
    c = SparkMD5._gg(c, d, a, b, k[11], 14, 643717713);
    b = SparkMD5._gg(b, c, d, a, k[0], 20, -373897302);
    a = SparkMD5._gg(a, b, c, d, k[5], 5, -701558691);
    d = SparkMD5._gg(d, a, b, c, k[10], 9, 38016083);
    c = SparkMD5._gg(c, d, a, b, k[15], 14, -660478335);
    b = SparkMD5._gg(b, c, d, a, k[4], 20, -405537848);
    a = SparkMD5._gg(a, b, c, d, k[9], 5, 568446438);
    d = SparkMD5._gg(d, a, b, c, k[14], 9, -1019803690);
    c = SparkMD5._gg(c, d, a, b, k[3], 14, -187363961);
    b = SparkMD5._gg(b, c, d, a, k[8], 20, 1163531501);
    a = SparkMD5._gg(a, b, c, d, k[13], 5, -1444681467);
    d = SparkMD5._gg(d, a, b, c, k[2], 9, -51403784);
    c = SparkMD5._gg(c, d, a, b, k[7], 14, 1735328473);
    b = SparkMD5._gg(b, c, d, a, k[12], 20, -1926607734);
    a = SparkMD5._hh(a, b, c, d, k[5], 4, -378558);
    d = SparkMD5._hh(d, a, b, c, k[8], 11, -2022574463);
    c = SparkMD5._hh(c, d, a, b, k[11], 16, 1839030562);
    b = SparkMD5._hh(b, c, d, a, k[14], 23, -35309556);
    a = SparkMD5._hh(a, b, c, d, k[1], 4, -1530992060);
    d = SparkMD5._hh(d, a, b, c, k[4], 11, 1272893353);
    c = SparkMD5._hh(c, d, a, b, k[7], 16, -155497632);
    b = SparkMD5._hh(b, c, d, a, k[10], 23, -1094730640);
    a = SparkMD5._hh(a, b, c, d, k[13], 4, 681279174);
    d = SparkMD5._hh(d, a, b, c, k[0], 11, -358537222);
    c = SparkMD5._hh(c, d, a, b, k[3], 16, -722521979);
    b = SparkMD5._hh(b, c, d, a, k[6], 23, 76029189);
    a = SparkMD5._hh(a, b, c, d, k[9], 4, -640364487);
    d = SparkMD5._hh(d, a, b, c, k[12], 11, -421815835);
    c = SparkMD5._hh(c, d, a, b, k[15], 16, 530742520);
    b = SparkMD5._hh(b, c, d, a, k[2], 23, -995338651);
    a = SparkMD5._ii(a, b, c, d, k[0], 6, -198630844);
    d = SparkMD5._ii(d, a, b, c, k[7], 10, 1126891415);
    c = SparkMD5._ii(c, d, a, b, k[14], 15, -1416354905);
    b = SparkMD5._ii(b, c, d, a, k[5], 21, -57434055);
    a = SparkMD5._ii(a, b, c, d, k[12], 6, 1700485571);
    d = SparkMD5._ii(d, a, b, c, k[3], 10, -1894986606);
    c = SparkMD5._ii(c, d, a, b, k[10], 15, -1051523);
    b = SparkMD5._ii(b, c, d, a, k[1], 21, -2054922799);
    a = SparkMD5._ii(a, b, c, d, k[8], 6, 1873313359);
    d = SparkMD5._ii(d, a, b, c, k[15], 10, -30611744);
    c = SparkMD5._ii(c, d, a, b, k[6], 15, -1560198380);
    b = SparkMD5._ii(b, c, d, a, k[13], 21, 1309151649);
    a = SparkMD5._ii(a, b, c, d, k[4], 6, -145523070);
    d = SparkMD5._ii(d, a, b, c, k[11], 10, -1120210379);
    c = SparkMD5._ii(c, d, a, b, k[2], 15, 718787259);
    b = SparkMD5._ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = SparkMD5._add32(a, x[0]);
    x[1] = SparkMD5._add32(b, x[1]);
    x[2] = SparkMD5._add32(c, x[2]);
    x[3] = SparkMD5._add32(d, x[3]);
    return x;
  }
  private static _cmn(
    q: number,
    a: number,
    b: number,
    x: number,
    s: number,
    t: number,
  ) {
    a = SparkMD5._add32(SparkMD5._add32(a, q), SparkMD5._add32(x, t));
    return SparkMD5._add32((a << s) | (a >>> (32 - s)), b);
  }
  private static _ff(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ) {
    return SparkMD5._cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  private static _gg(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ) {
    return SparkMD5._cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  private static _hh(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ) {
    return SparkMD5._cmn(b ^ c ^ d, a, b, x, s, t);
  }
  private static _ii(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ) {
    return SparkMD5._cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  private static _md5blk_array(buf: ArrayBuffer) {
    const md5blks = [];
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] =
        bytes[i] +
        (bytes[i + 1] << 8) +
        (bytes[i + 2] << 16) +
        (bytes[i + 3] << 24);
    }
    return md5blks;
  }
  private static _add32(a: number, b: number) {
    return (a + b) & 0xffffffff;
  }
}

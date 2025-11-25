// src/admin/data/mock/rag.ts
export type RagDocStatus = "processing" | "ready";

export type RagDoc = {
  id: string;
  name: string;
  size: number;
  type: string;
  status: RagDocStatus;
  uploadedAt: number;
};

const STORAGE_KEY = "mock_rag_docs";

const readAll = (): RagDoc[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeAll = (list: RagDoc[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

const genId = (): string => {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

export const seedRagDocs = () => {
  const existing = readAll();
  if (existing.length) return;
  const now = Date.now();
  const initial: RagDoc[] = [
    {
      id: genId(),
      name: "产品手册.pdf",
      size: 256000,
      type: "application/pdf",
      status: "ready",
      uploadedAt: now - 86400000,
    },
    {
      id: genId(),
      name: "项目说明.md",
      size: 18000,
      type: "text/markdown",
      status: "ready",
      uploadedAt: now - 7200000,
    },
    {
      id: genId(),
      name: "会议纪要.docx",
      size: 82000,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      status: "processing",
      uploadedAt: now - 3600000,
    },
  ];
  writeAll(initial);
};

const extType = (name: string): string => {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = m ? m[1] : "";
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "md":
      return "text/markdown";
    case "txt":
      return "text/plain";
    case "doc":
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "ppt":
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "xls":
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "csv":
      return "text/csv";
    default:
      return "application/octet-stream";
  }
};

export async function mockListRagDocs(params?: {
  query?: string;
  status?: RagDocStatus | "all";
}): Promise<RagDoc[]> {
  seedRagDocs();
  const q = (params?.query || "").toLowerCase();
  const st = params?.status || "all";
  let list = readAll();
  if (q) list = list.filter((d) => d.name.toLowerCase().includes(q));
  if (st !== "all") list = list.filter((d) => d.status === st);
  return list.sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export async function mockUploadRagFiles(files: File[]): Promise<RagDoc[]> {
  seedRagDocs();
  const items: RagDoc[] = files.map((f) => ({
    id: genId(),
    name: f.name,
    size: f.size || 0,
    type: f.type || extType(f.name),
    status: "processing",
    uploadedAt: Date.now(),
  }));
  const next = readAll().concat(items);
  writeAll(next);
  items.forEach((item) => {
    setTimeout(
      () => {
        const cur = readAll();
        const idx = cur.findIndex((d) => d.id === item.id);
        if (idx !== -1) {
          cur[idx] = { ...cur[idx], status: "ready" };
          writeAll(cur);
        }
      },
      1200 + Math.floor(Math.random() * 1800),
    );
  });
  return items;
}

export async function mockDeleteRagDoc(id: string): Promise<void> {
  const list = readAll();
  const next = list.filter((d) => d.id !== id);
  writeAll(next);
}

export async function mockUpdateRagDoc(
  id: string,
  updates: Partial<Pick<RagDoc, "name" | "status">>,
): Promise<RagDoc | null> {
  const list = readAll();
  const idx = list.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  const updated = { ...list[idx], ...updates } as RagDoc;
  list[idx] = updated;
  writeAll(list);
  return updated;
}

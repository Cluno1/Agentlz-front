/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MockUser } from "../data/types/user";

type ListParams = {
  page?: number;
  perPage?: number;
  sortField?: keyof MockUser;
  sortOrder?: "ASC" | "DESC";
  filter?: { q?: string };
};

const STORAGE_KEY = "mock_users";

const readAll = (): MockUser[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MockUser[];
  } catch {
    return [];
  }
};

const writeAll = (list: MockUser[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

const genId = (): string => {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

export const listUsers = (params: ListParams = {}) => {
  const {
    page = 1,
    perPage = 10,
    sortField = "id",
    sortOrder = "ASC",
    filter,
  } = params;
  let data = readAll();
  if (filter?.q) {
    const q = filter.q.toLowerCase();
    data = data.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.fullName || "").toLowerCase().includes(q),
    );
  }
  data = data.sort((a, b) => {
    const va = (a[sortField] ?? "") as any;
    const vb = (b[sortField] ?? "") as any;
    if (va < vb) return sortOrder === "ASC" ? -1 : 1;
    if (va > vb) return sortOrder === "ASC" ? 1 : -1;
    return 0;
  });
  const total = data.length;
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return { data: data.slice(start, end), total };
};

export const getUser = (id: string) => {
  const all = readAll();
  return all.find((u) => u.id === id) || null;
};

export const createUser = (payload: Omit<MockUser, "id">) => {
  const all = readAll();
  const user: MockUser = {
    id: genId(),
    disabled: false,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  all.push(user);
  writeAll(all);
  return user;
};

export const updateUser = (id: string, updates: Partial<MockUser>) => {
  const all = readAll();
  const idx = all.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...updates, id } as MockUser;
  all[idx] = updated;
  writeAll(all);
  return updated;
};

export const deleteUser = (id: string) => {
  const all = readAll();
  const next = all.filter((u) => u.id !== id);
  writeAll(next);
  return true;
};

export const seedUsers = (seed?: MockUser[]) => {
  if (seed && seed.length) {
    writeAll(seed);
    return;
  }
  if (!readAll().length) {
    const list: MockUser[] = [];
    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      const id = genId();
      const username = `user_${Math.random().toString(36).slice(2, 8)}`;
      const email = `${username}@example.com`;
      const role = Math.random() < 0.15 ? "admin" : "user";
      const disabled = Math.random() < 0.25;
      const createdAt = new Date(
        now - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000,
      ).toISOString();
      const avatar = `https://avatars.githubusercontent.com/u/${Math.floor(1000 + Math.random() * 500000)}?v=4`;
      list.push({
        id,
        username,
        email,
        password: "pass123",
        fullName: username,
        role,
        disabled,
        createdAt,
        avatar,
      });
    }
    writeAll(list);
  }
};

export default {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  seedUsers,
};

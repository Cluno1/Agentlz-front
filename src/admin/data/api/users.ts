/* eslint-disable no-constant-binary-expression */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "../httpClient.ts";
import type { MockUser } from "../types/user";

const useMock = import.meta.env.MODE === "development";

type ListParams = {
  page?: number;
  perPage?: number;
  sortField?: keyof MockUser;
  sortOrder?: "ASC" | "DESC";
  filter?: { q?: string };
};

const getTenantHeaders = () => {
  const tenantId = localStorage.getItem("tenant_id");
  return tenantId ? { "X-Tenant-ID": tenantId } : {};
};

export const listUsers = async (params: ListParams = {}) => {
  if (useMock) {
    const mock = await import("../mock/users.ts");
    mock.seedUsers();
    return mock.listUsers(params);
  }
  const {
    page = 1,
    perPage = 10,
    sortField = "id",
    sortOrder = "ASC",
    filter,
  } = params;
  const query = {
    _page: page,
    _perPage: perPage,
    _sort: sortField,
    _order: sortOrder,
    q: filter?.q,
  } as any;
  const res = await httpClient.get("/v1/users", {
    params: query,
    headers: getTenantHeaders(),
  });
  const json = res.data;
  const total =
    json?.total ??
    Number(res.headers["x-total-count"]) ??
    (Array.isArray(json?.data) ? json.data.length : 0);
  const data = Array.isArray(json?.data)
    ? (json.data as MockUser[])
    : (json as MockUser[]);
  return { data, total };
};

export const getUser = async (id: string) => {
  if (useMock) {
    const mock = await import("../mock/users.ts");
    return mock.getUser(id);
  }
  const res = await httpClient.get(`/v1/users/${id}`, {
    headers: getTenantHeaders(),
  });
  return res.data?.data ?? res.data;
};

export const createUser = async (payload: Omit<MockUser, "id">) => {
  if (useMock) {
    const mock = await import("../mock/users.ts");
    return mock.createUser(payload);
  }
  const res = await httpClient.post("/v1/users", payload, {
    headers: getTenantHeaders(),
  });
  return res.data?.data ?? res.data;
};

export const updateUser = async (id: string, updates: Partial<MockUser>) => {
  if (useMock) {
    const mock = await import("../mock/users.ts");
    return mock.updateUser(id, updates);
  }
  const res = await httpClient.put(`/v1/users/${id}`, updates, {
    headers: getTenantHeaders(),
  });
  return res.data?.data ?? res.data;
};

export const deleteUser = async (id: string) => {
  if (useMock) {
    const mock = await import("../mock/users.ts");
    return mock.deleteUser(id);
  }
  await httpClient.delete(`/v1/users/${id}`, { headers: getTenantHeaders() });
  return true;
};

export default { listUsers, getUser, createUser, updateUser, deleteUser };

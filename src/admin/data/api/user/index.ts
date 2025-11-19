/* eslint-disable no-constant-binary-expression */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "../../httpClient";
import type {
  PaginationParams,
  PaginationResult,
  ListUsersNameSpace,
  GetUserNameSpace,
  CreateUserNameSpace,
  UpdateUserNameSpace,
} from "./type";

/** @description 用户列表查询 */
export async function listUsers(
  params: ListUsersNameSpace.ListUsersParams,
): Promise<PaginationResult<ListUsersNameSpace.ListUsersResult>> {
  try {
    const {
      page = 1,
      perPage = 10,
      sortField = "id",
      sortOrder = "ASC",
      filter,
    } = params || ({} as PaginationParams);
    const query = {
      page: page,
      perPage: perPage,
      sort: sortField,
      order: sortOrder,
      q: (filter as any)?.q,
    } as any;
    const res = await httpClient.get("/v1/users", {
      params: query,
    });
    const json = res.data;
    const total =
      json?.total ??
      Number(res.headers?.["x-total-count"]) ??
      (Array.isArray(json?.data)
        ? json.data.length
        : Array.isArray(json)
          ? json.length
          : 0);
    const data = Array.isArray(json?.data)
      ? (json.data as any[])
      : Array.isArray(json)
        ? (json as any[])
        : [];
    return { data: data as ListUsersNameSpace.ListUsersResult[], total };
  } catch (error) {
    console.error("接口错误");
    throw error as any;
  }
}

/** @description 获取用户详情 */
export async function getUser(
  id: string,
): Promise<GetUserNameSpace.GetUserResult> {
  console.log(id, "获取用户详情");
  try {
    const res = await httpClient.get(`/v1/users/${id}`);
    console.log(res.data, "获取用户详情2");
    return (res.data?.data ?? res.data) as GetUserNameSpace.GetUserResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 创建用户 */
export async function createUser(
  payload: CreateUserNameSpace.CreateUserParams,
): Promise<void> {
  try {
    await httpClient.post("/v1/users", payload);
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 更新用户 */
export async function updateUser(
  id: string,
  updates: UpdateUserNameSpace.UpdateUserParams,
): Promise<void> {
  try {
    await httpClient.put(`/v1/users/${id}`, updates);
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

/** @description 删除用户 */
export async function deleteUser(id: string): Promise<void> {
  try {
    await httpClient.delete(`/v1/users/${id}`);
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

import { DataProvider, fetchUtils } from "react-admin";
import httpClient from "../httpClient";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

/* 统一封装 ra 所需的 6 个核心方法 */
const formProvider: DataProvider = {
  /* -------------------- 列表 + 分页 + 排序 + 过滤 -------------------- */
  getList: async (resource, params) => {
    const { page = 1, perPage = 10 } = params.pagination || {};
    const { field = "id", order = "ASC" } = params.sort || {};
    const query = {
      q: params.filter?.q,
      sort: field,
      order: order,
      page: page,
      perPage: perPage,
    };
    const url = `${apiUrl}/${resource}?${fetchUtils.queryParameters(query)}`;
    const { data: json, headers } = await httpClient.get(url);

    // 后端返回格式：{ data: T[], total: number } 或 headers['x-total-count']
    return {
      data: json.data || json,
      total: json.total ?? parseInt(headers["x-total-count"] || "0", 10),
    };
  },

  /* -------------------- 单条详情 -------------------- */
  getOne: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}`;
    const { data } = await httpClient.get(url);
    return { data: data.data || data };
  },

  /* -------------------- 多条详情 -------------------- */
  getMany: async (resource, params) => {
    const query = { id: params.ids };
    const url = `${apiUrl}/${resource}?${fetchUtils.queryParameters(query)}`;
    const { data } = await httpClient.get(url);
    return { data: data.data || data };
  },

  /* -------------------- 关联查询 -------------------- */
  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const query = {
      ...params.filter,
      [params.target]: params.id,
      _page: page,
      _perPage: perPage,
    };
    const url = `${apiUrl}/${resource}?${fetchUtils.queryParameters(query)}`;
    const { data, headers } = await httpClient.get(url);
    return {
      data: data.data || data,
      total: parseInt(headers["x-total-count"] || "0", 10),
    };
  },

  /* -------------------- 新建 -------------------- */
  create: async (resource, params) => {
    const url = `${apiUrl}/${resource}`;
    const { data } = await httpClient.post(url, params.data);
    return { data: data.data || data };
  },

  /* -------------------- 更新 -------------------- */
  update: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}`;
    const { data } = await httpClient.put(url, params.data);
    return { data: data.data || data };
  },

  /* -------------------- 局部更新 -------------------- */
  updateMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map((id) =>
        httpClient.put(`${apiUrl}/${resource}/${id}`, params.data),
      ),
    );
    return { data: responses.map((res) => res.data.id || res.data.data?.id) };
  },

  /* -------------------- 删除 -------------------- */
  delete: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}`;
    const { data } = await httpClient.delete(url);
    return { data: data.data || data };
  },

  /* -------------------- 批量删除 -------------------- */
  deleteMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map((id) => httpClient.delete(`${apiUrl}/${resource}/${id}`)),
    );
    return { data: responses.map((res) => res.data.id || res.data.data?.id) };
  },
};

export default formProvider;

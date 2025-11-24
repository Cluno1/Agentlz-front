/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

export type ApiResponse<T> = {
  code: number;
  message: string;
  success: boolean;
  data: T;
};

/* ========================== 1. 实例 ========================== */
const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 环境变量
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/* ========================== 2. 请求拦截 ========================== */
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(import.meta.env.VITE_TOKEN_KEY);
  const tenantId =
    localStorage.getItem(import.meta.env.VITE_TENANT_ID) || "default";
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId && config.headers) {
    config.headers["X-Tenant-ID"] = tenantId;
  }

  return config;
});

/* ========================== 3. 响应拦截 ========================== */
httpClient.interceptors.response.use(
  (response: any) => response,
  (error: AxiosError<any>) => {
    const { response } = error;

    if (!response) {
      // 网络超时或断网
      return Promise.reject(new Error("Network error"));
    }

    // 统一错误提示（可换成 message.error/toast）
    switch (response.status) {
      case 401: {
        localStorage.removeItem("access_token");
        window.location.replace("/login"); // 强制跳转登录
        return;
      }
      case 403: {
        const err = new Error("Forbidden: 没有权限");
        (err as any).status = 403;
        throw err;
      }
      case 422:
        // 表单校验错误，react-admin 会自动解析 response.body.errors
        throw {
          status: 422,
          errors: response.data?.errors || response.data,
        } as any;
      case 500: {
        const err = new Error("Server error");
        (err as any).status = 500;
        throw err;
      }
      default: {
        const err = new Error(response.data?.message || "Unknown error");
        (err as any).status = response.status;
        throw err;
      }
    }
  },
);

export default httpClient;

export async function apiPost<T>(
  url: string,
  data?: any,
  config?: any,
): Promise<ApiResponse<T>> {
  const res = await httpClient.post<ApiResponse<T>>(url, data, config);
  return res.data;
}

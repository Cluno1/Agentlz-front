/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

/* ========================== 1. 实例 ========================== */
const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 环境变量
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/* ========================== 2. 请求拦截 ========================== */
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
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
      case 401:
        localStorage.removeItem("access_token");
        window.location.replace("/login"); // 强制跳转登录
        break;
      case 403:
        throw new Error("Forbidden: 没有权限");
      case 422:
        // 表单校验错误，react-admin 会自动解析 response.body.errors
        throw { errors: response.data?.errors || response.data };
      case 500:
        throw new Error("Server error");
      default:
        throw new Error(response.data?.message || "Unknown error");
    }
  },
);

export default httpClient;

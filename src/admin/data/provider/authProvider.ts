/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AuthProvider } from "react-admin";
import { MockUser } from "../types/user";
import { register as registerApi, login as loginApi } from "../api/auth";
import type { RegisterNameSpace, LoginNameSpace } from "../api/auth/type";

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY;
const IDENTITY_KEY = import.meta.env.VITE_IDENTITY_KEY;
const TENANT_ID = import.meta.env.VITE_TENANT_ID;

/**
 * 函数: registerUser
 * 说明: 对接后端 /v1/register 接口，返回创建的用户信息
 */
export function registerUser(
  payload: RegisterNameSpace.RegisterParams,
): Promise<RegisterNameSpace.RegisterResult> {
  return registerApi(payload);
}

export const authProvider: AuthProvider = {
  login: async (params: any) => {
    const { username, password } = params ?? {};
    const res: LoginNameSpace.LoginResult = await loginApi({
      username,
      password,
    });
    const token = res.token || "";
    const tenantId = res.user?.tenant_id || "default";
    if (!token) return Promise.reject("登录失败");
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TENANT_ID, tenantId);
    localStorage.setItem(
      IDENTITY_KEY,
      JSON.stringify({
        id: res.user?.id || "",
        fullName: res.user?.full_name || res.user?.username || "",
        disabled: !!res.user?.disabled,
        email: res.user?.email || "",
        username: res.user?.username || "",
        avatar: res.user?.avatar || "",
        role: res.user?.role || "user",
        createdAt: res.user?.created_at || "",
        createdById: res.user?.created_by_id || "",
      }),
    );
    return Promise.resolve();
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(IDENTITY_KEY);
    localStorage.removeItem(TENANT_ID);
    return Promise.resolve();
  },
  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) return Promise.resolve();
    return Promise.reject();
  },
  checkError: async () => Promise.resolve(),
  getPermissions: async () => {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) {
      const identity = JSON.parse(raw);
      return Promise.resolve(identity.role);
    }
    return Promise.resolve("user");
  },
  getIdentity: async (): Promise<MockUser> => {
    try {
      const raw = localStorage.getItem(IDENTITY_KEY);
      return raw
        ? Promise.resolve(JSON.parse(raw))
        : Promise.resolve({
            id: "",
            username: "",
          });
    } catch {
      return Promise.resolve({
        id: "-10084",
        username: "",
        fullName: "",
        disabled: false,
        email: "",
        role: "user",
        createdAt: "",
        createdById: "",
      });
    }
  },
};

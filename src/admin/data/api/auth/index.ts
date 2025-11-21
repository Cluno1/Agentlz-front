import { apiPost } from "../../httpClient";
import type { RegisterNameSpace, LoginNameSpace } from "./type";

/** @description 注册 */
export async function register(
  params: RegisterNameSpace.RegisterParams,
): Promise<RegisterNameSpace.RegisterResult> {
  const res = await apiPost<RegisterNameSpace.RegisterResult>(
    "/register",
    params,
  );
  return res.data;
}

/** @description 登录 */
export async function login(
  params: LoginNameSpace.LoginParams,
): Promise<LoginNameSpace.LoginResult> {
  const res = await apiPost<LoginNameSpace.LoginResult>("/login", params);
  return res.data;
}

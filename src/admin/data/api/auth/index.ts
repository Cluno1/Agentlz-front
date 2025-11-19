import { apiPost } from "../../httpClient";
import type { RegisterNameSpace, LoginNameSpace } from "./type";

/** @description 注册 */
export async function register(
  params: RegisterNameSpace.RegisterParams,
): Promise<RegisterNameSpace.RegisterResult> {
  try {
    const res = await apiPost<RegisterNameSpace.RegisterResult>(
      "/v1/register",
      params,
    );
    return res.data;
  } catch (error) {
    console.error("接口错误");
    throw error;
  }
}

/** @description 登录 */
export async function login(
  params: LoginNameSpace.LoginParams,
): Promise<LoginNameSpace.LoginResult> {
  try {
    const res = await apiPost<LoginNameSpace.LoginResult>("/v1/login", params);
    return res.data;
  } catch (error) {
    console.error("接口错误");
    throw error;
  }
}

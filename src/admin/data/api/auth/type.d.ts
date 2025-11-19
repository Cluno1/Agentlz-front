/* eslint-disable @typescript-eslint/no-explicit-any */
/** @description 注册 */
export namespace RegisterNameSpace {
  /** @description 注册参数 */
  export interface RegisterParams {
    username: string;
    email: string;
    password: string;
    [k: string]: any;
  }

  /** @description 注册 返回结果 */
  export interface RegisterResult {
    id?: string;
    username?: string;
    email?: string;
    fullName?: string;
    avatar?: string;
    role?: string;
    disabled?: boolean;
    createdAt?: string;
    createdById?: string;
    [k: string]: any;
  }
}

/** @description 登录 */
export namespace LoginNameSpace {
  /** @description 登录参数 */
  export interface LoginParams {
    username: string;
    password: string;
    [k: string]: any;
  }

  /** @description 登录 返回结果 */
  export interface LoginResult {
    token: string;
    user: {
      id?: string;
      username?: string;
      email?: string;
      full_name?: string;
      avatar?: string;
      role?: string;
      disabled?: boolean;
      created_at?: string;
      created_by_id?: string;
      tenant_id?: string; // 租户id
    };
    [k: string]: any;
  }
}

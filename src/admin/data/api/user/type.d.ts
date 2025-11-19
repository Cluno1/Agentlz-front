/* eslint-disable @typescript-eslint/no-explicit-any */

/** @description 分页参数 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
  filter?: any;
  [k: string]: any;
}

/** @description 分页返回 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  [k: string]: any;
}

/** @description 用户列表 */
export namespace ListUsersNameSpace {
  /** @description 用户列表 参数 */
  export interface ListUsersParams extends PaginationParams {
    [k: string]: any;
  }

  /** @description 用户列表 返回结果项 */
  export interface ListUsersResult {
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

/** @description 获取用户详情 */
export namespace GetUserNameSpace {
  /** @description 获取用户详情 返回结果 */
  export interface GetUserResult {
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

/** @description 创建用户 */
export namespace CreateUserNameSpace {
  /** @description 创建用户 参数 */
  export interface CreateUserParams {
    username: string;
    email?: string;
    password?: string;
    fullName?: string;
    avatar?: string;
    role?: string;
    disabled?: boolean;
    [k: string]: any;
  }
}

/** @description 更新用户 */
export namespace UpdateUserNameSpace {
  /** @description 更新用户 参数 */
  export interface UpdateUserParams {
    username?: string;
    email?: string;
    password?: string;
    fullName?: string;
    avatar?: string;
    role?: string;
    disabled?: boolean;
    [k: string]: any;
  }
}

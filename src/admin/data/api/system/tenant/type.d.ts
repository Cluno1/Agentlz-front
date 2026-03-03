/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
  filter?: any;
  [k: string]: any;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  [k: string]: any;
}

export namespace ListTenantsNameSpace {
  export interface ListTenantsParams extends PaginationParams {
    [k: string]: any;
  }

  export interface ListTenantsResult {
    id?: string;
    name?: string;
    disabled?: boolean;
    created_at?: string;
    updated_at?: string;
    [k: string]: any;
  }
}

export namespace CreateTenantNameSpace {
  export interface CreateTenantParams {
    id?: string;
    name: string;
    disabled?: boolean;
    [k: string]: any;
  }
  export interface CreateTenantResult
    extends ListTenantsNameSpace.ListTenantsResult {
    [k: string]: any;
  }
}

export namespace UpdateTenantNameSpace {
  export interface UpdateTenantParams {
    name?: string;
    disabled?: boolean;
    [k: string]: any;
  }
  export interface UpdateTenantResult
    extends ListTenantsNameSpace.ListTenantsResult {
    [k: string]: any;
  }
}

export namespace DeleteTenantNameSpace {
  export interface DeleteTenantResult {
    deleted?: boolean;
    [k: string]: any;
  }
}

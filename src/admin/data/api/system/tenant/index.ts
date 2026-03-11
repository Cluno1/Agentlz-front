/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "../../../httpClient";
import type {
  PaginationParams,
  PaginationResult,
  ListTenantsNameSpace,
  CreateTenantNameSpace,
  UpdateTenantNameSpace,
  DeleteTenantNameSpace,
} from "./type";

export async function listTenants(
  params: ListTenantsNameSpace.ListTenantsParams,
): Promise<PaginationResult<ListTenantsNameSpace.ListTenantsResult>> {
  try {
    const {
      page = 1,
      perPage = 10,
      sortField = "id",
      sortOrder = "DESC",
      filter,
    } = params || ({} as PaginationParams);
    const query: any = {
      page,
      per_page: perPage,
      sort: sortField,
      order: sortOrder,
      q: (filter as any)?.q,
    };
    const res = await httpClient.get("/system/tenants", { params: query });
    const json = res.data;
    const rows =
      (json?.data?.rows as any[]) ??
      (json?.rows as any[]) ??
      (Array.isArray(json) ? (json as any[]) : []);
    const total = json?.data?.total ?? json?.total ?? rows.length ?? 0;
    return { data: rows as ListTenantsNameSpace.ListTenantsResult[], total };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function createTenant(
  payload: CreateTenantNameSpace.CreateTenantParams,
): Promise<CreateTenantNameSpace.CreateTenantResult> {
  try {
    const res = await httpClient.post("/system/tenants", payload);
    return (res.data?.data ??
      res.data) as CreateTenantNameSpace.CreateTenantResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function updateTenant(
  tenantId: string,
  payload: UpdateTenantNameSpace.UpdateTenantParams,
): Promise<UpdateTenantNameSpace.UpdateTenantResult> {
  try {
    const res = await httpClient.put(`/system/tenants/${tenantId}`, payload);
    return (res.data?.data ??
      res.data) as UpdateTenantNameSpace.UpdateTenantResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function deleteTenant(
  tenantId: string,
): Promise<DeleteTenantNameSpace.DeleteTenantResult> {
  try {
    const res = await httpClient.delete(`/system/tenants/${tenantId}`);
    return (res.data?.data ??
      res.data) as DeleteTenantNameSpace.DeleteTenantResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

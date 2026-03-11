/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "../../httpClient";
import type {
  PaginationParams,
  PaginationResult,
  EvaluationNameSpace,
} from "./type";

function resolveTenantId(type?: "self" | "tenant" | "system") {
  const tenantKey = import.meta.env.VITE_TENANT_ID as string;
  const current = localStorage.getItem(tenantKey) || "default";
  if (type === "system") return "system";
  if (type === "self") return "default";
  return current;
}

export async function listEvaluationDatasets(
  params: EvaluationNameSpace.ListEvaluationDatasetsParams,
): Promise<PaginationResult<EvaluationNameSpace.ListEvaluationDatasetsResult>> {
  try {
    const {
      page = 1,
      perPage = 10,
      sortField = "id",
      sortOrder = "DESC",
      filter,
      type = "tenant",
    } = params || ({} as PaginationParams);
    const query: any = {
      page,
      per_page: perPage,
      sort: sortField,
      order: sortOrder,
      q: filter?.q,
      type,
    };
    const res = await httpClient.get("/evaluation/datasets", {
      params: query,
      headers: { "X-Tenant-ID": resolveTenantId(type) },
    });
    const json = res.data;
    const rows =
      (json?.data?.rows as any[]) ??
      (json?.rows as any[]) ??
      (Array.isArray(json) ? (json as any[]) : []);
    const total = json?.data?.total ?? json?.total ?? rows.length ?? 0;
    return {
      data: rows as EvaluationNameSpace.ListEvaluationDatasetsResult[],
      total,
    };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function createEvaluationDataset(
  payload: EvaluationNameSpace.CreateEvaluationDatasetParams,
): Promise<EvaluationNameSpace.EvaluationDataset> {
  try {
    const type = payload?.type || "tenant";
    const res = await httpClient.post("/evaluation/datasets", payload, {
      headers: { "X-Tenant-ID": resolveTenantId(type) },
    });
    return (res.data?.data ??
      res.data) as EvaluationNameSpace.EvaluationDataset;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function parseDatasetToAlpaca(
  payload: EvaluationNameSpace.ParseAlpacaParams,
): Promise<{
  is_alpaca?: boolean;
  items?: EvaluationNameSpace.EvaluationResultItem[];
}> {
  try {
    const res = await httpClient.post(
      "/evaluation/datasets/parse-alpaca",
      payload,
    );
    return (res.data?.data ?? res.data) as {
      is_alpaca?: boolean;
      items?: EvaluationNameSpace.EvaluationResultItem[];
    };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function getEvaluationDataset(
  datasetId: string,
  type: "self" | "tenant" | "system" = "tenant",
): Promise<EvaluationNameSpace.EvaluationDataset> {
  try {
    const res = await httpClient.get(`/evaluation/datasets/${datasetId}`, {
      params: { type },
      headers: { "X-Tenant-ID": resolveTenantId(type) },
    });
    return (res.data?.data ??
      res.data) as EvaluationNameSpace.EvaluationDataset;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function deleteEvaluationDataset(
  datasetId: string,
  type: "self" | "tenant" | "system" = "tenant",
): Promise<void> {
  try {
    await httpClient.delete(`/evaluation/datasets/${datasetId}`, {
      params: { type },
      headers: { "X-Tenant-ID": resolveTenantId(type) },
    });
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function startEvaluation(
  params: EvaluationNameSpace.StartEvaluationParams,
): Promise<{ status?: string }> {
  try {
    const type = params?.type || "tenant";
    const res = await httpClient.post("/evaluation/start", params, {
      headers: { "X-Tenant-ID": resolveTenantId(type) },
    });
    return (res.data?.data ?? res.data) as { status?: string };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function listAgentVersions(
  params: EvaluationNameSpace.ListAgentVersionsParams,
): Promise<PaginationResult<EvaluationNameSpace.EvaluationVersion>> {
  try {
    const {
      agent_id,
      page = 1,
      perPage = 10,
      sortField = "id",
      sortOrder = "DESC",
    } = params;
    const res = await httpClient.get(
      `/evaluation/agents/${agent_id}/versions`,
      {
        params: {
          page,
          per_page: perPage,
          sort: sortField,
          order: sortOrder,
        },
      },
    );
    const json = res.data;
    const rows =
      (json?.data?.rows as any[]) ??
      (json?.rows as any[]) ??
      (Array.isArray(json) ? (json as any[]) : []);
    const total = json?.data?.total ?? json?.total ?? rows.length ?? 0;
    return { data: rows as EvaluationNameSpace.EvaluationVersion[], total };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function listAgentContents(
  params: EvaluationNameSpace.ListAgentContentsParams,
): Promise<PaginationResult<EvaluationNameSpace.EvaluationContent>> {
  try {
    const {
      agent_id,
      eva_version_id,
      page = 1,
      perPage = 10,
      sortField = "id",
      sortOrder = "DESC",
    } = params;
    const res = await httpClient.get(
      `/evaluation/agents/${agent_id}/contents`,
      {
        params: {
          eva_version_id,
          page,
          per_page: perPage,
          sort: sortField,
          order: sortOrder,
        },
      },
    );
    const json = res.data;
    const rows =
      (json?.data?.rows as any[]) ??
      (json?.rows as any[]) ??
      (Array.isArray(json) ? (json as any[]) : []);
    const total = json?.data?.total ?? json?.total ?? rows.length ?? 0;
    return { data: rows as EvaluationNameSpace.EvaluationContent[], total };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function getEvaluationContent(
  contentId: number,
): Promise<EvaluationNameSpace.EvaluationContent> {
  try {
    const res = await httpClient.get(`/evaluation/contents/${contentId}`);
    return (res.data?.data ??
      res.data) as EvaluationNameSpace.EvaluationContent;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function listEvaluationDocs(
  params: EvaluationNameSpace.ListEvaluationDatasetsParams,
): Promise<PaginationResult<EvaluationNameSpace.ListEvaluationDatasetsResult>> {
  return listEvaluationDatasets(params);
}

export async function getEvaluationDoc(
  datasetId: string,
  type: "self" | "tenant" | "system" = "tenant",
): Promise<EvaluationNameSpace.EvaluationDataset> {
  return getEvaluationDataset(datasetId, type);
}

export async function listEvaluationData(params: {
  docId: string;
  page?: number;
  perPage?: number;
  type?: "self" | "tenant" | "system";
}): Promise<PaginationResult<EvaluationNameSpace.EvaluationResultItem>> {
  const { docId, page = 1, perPage = 50, type = "tenant" } = params;
  const dataset = await getEvaluationDataset(docId, type);
  let rows: EvaluationNameSpace.EvaluationResultItem[] = [];
  try {
    const parsed = JSON.parse(String(dataset.data_json || "[]"));
    rows = Array.isArray(parsed) ? parsed : [];
  } catch {
    rows = [];
  }
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return { data: rows.slice(start, end), total: rows.length };
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
  filter?: Record<string, unknown>;
  [k: string]: unknown;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  [k: string]: unknown;
}

export namespace EvaluationNameSpace {
  export type EvaluationDataset = {
    id: string;
    tenant_id?: string;
    scope?: "self" | "tenant" | "system" | string;
    uploaded_by_user_id?: number;
    status?: string;
    name?: string;
    data_json?: string;
    total_count?: number;
    created_at?: string;
    updated_at?: string;
    [k: string]: unknown;
  };

  export type EvaluationResultItem = {
    instruction?: string;
    input?: string;
    output?: string;
    fact_output?: string;
    score?: number;
    opinion?: string;
    [k: string]: unknown;
  };

  export type EvaluationDoc = EvaluationDataset;
  export type EvaluationDataRow = EvaluationResultItem;

  export type EvaluationContent = {
    id: number;
    tenant_id?: string;
    eva_json_id?: string;
    eva_version_id?: number;
    status?: string;
    total_count?: number;
    completed_count?: number;
    content_json?: string;
    started_at?: string;
    finished_at?: string;
    created_at?: string;
    updated_at?: string;
    [k: string]: unknown;
  };

  export type EvaluationVersion = {
    id: number;
    tenant_id?: string;
    agent_id?: number;
    created_by_user_id?: number;
    prompt?: string;
    document_ids_json?: string;
    strategy_json?: string;
    mcp_json?: string;
    created_at?: string;
    updated_at?: string;
    [k: string]: unknown;
  };

  export type ListEvaluationDatasetsParams = {
    page?: number;
    perPage?: number;
    sortField?: string;
    sortOrder?: "ASC" | "DESC";
    filter?: { q?: string };
    type?: "self" | "tenant" | "system";
  };

  export type ListEvaluationDatasetsResult = EvaluationDataset;

  export type CreateEvaluationDatasetParams = {
    name: string;
    type?: "self" | "tenant" | "system";
    status?: string;
    data_json: unknown;
  };

  export type ParseAlpacaParams = {
    raw_json: unknown;
    hint?: string;
  };

  export type StartEvaluationParams = {
    eva_json_id: string;
    agent_id: number;
    type?: "self" | "tenant" | "system";
  };

  export type ListAgentVersionsParams = {
    agent_id: number;
    page?: number;
    perPage?: number;
    sortField?: string;
    sortOrder?: "ASC" | "DESC";
  };

  export type ListAgentContentsParams = {
    agent_id: number;
    eva_version_id?: number;
    page?: number;
    perPage?: number;
    sortField?: string;
    sortOrder?: "ASC" | "DESC";
  };
}

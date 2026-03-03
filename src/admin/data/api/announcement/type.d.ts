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

export namespace ListAnnouncementsNameSpace {
  export interface ListAnnouncementsParams extends PaginationParams {
    type?: "system" | "tenant";
    [k: string]: any;
  }

  export interface ListAnnouncementsResult {
    id?: number;
    tenant_id?: string;
    title?: string;
    content?: string | null;
    disabled?: boolean;
    created_at?: string;
    created_by_id?: number;
    updated_at?: string;
    updated_by_id?: number;
    [k: string]: any;
  }
}

export namespace CreateAnnouncementNameSpace {
  export interface CreateAnnouncementParams {
    tenant_id: string;
    title: string;
    content?: string;
    disabled?: boolean;
    [k: string]: any;
  }
  export interface CreateAnnouncementResult
    extends ListAnnouncementsNameSpace.ListAnnouncementsResult {
    [k: string]: any;
  }
}

export namespace UpdateAnnouncementNameSpace {
  export interface UpdateAnnouncementParams {
    title?: string;
    content?: string;
    disabled?: boolean;
    [k: string]: any;
  }
  export interface UpdateAnnouncementResult
    extends ListAnnouncementsNameSpace.ListAnnouncementsResult {
    [k: string]: any;
  }
}

export namespace DeleteAnnouncementNameSpace {
  export interface DeleteAnnouncementResult {
    deleted: boolean;
    [k: string]: any;
  }
}

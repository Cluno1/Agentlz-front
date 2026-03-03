export namespace UploadsNameSpace {
  export type InitUploadParams = {
    filename: string;
    size: number;
    content_type?: string;
    file_type: string;
    file_hash?: string;
    type: string;
    title?: string;
    description?: string;
    tags?: string[];
    strategy?: string[];
    document_type?: string;
    [k: string]: unknown;
  };

  export type InitUploadResult = {
    task_id?: number;
    cos_key?: string;
    upload_id?: string;
    chunk_size?: number;
    chunk_count?: number;
    status: string;
    document_id?: string;
    final_url?: string;
    [k: string]: unknown;
  };

  export type UploadTaskResult = {
    status: string;
    scan_status?: string;
    chunk_size?: number;
    chunk_count?: number;
    uploaded_parts?: number[];
    final_url?: string;
    document_id?: string;
    [k: string]: unknown;
  };

  export type PartUrlParams = {
    part_number: number;
    part_size: number;
    part_hash?: string;
    [k: string]: unknown;
  };

  export type PartUrlResult = {
    url: string;
    method: string;
    required_headers: Record<string, string>;
    [k: string]: unknown;
  };

  export type CompleteUploadParams = {
    parts: Array<{ part_number: number; etag: string; part_hash?: string }>;
    file_hash?: string;
    [k: string]: unknown;
  };

  export type CompleteUploadResult = {
    status: string;
    document_id?: string;
    final_url?: string;
    [k: string]: unknown;
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "../../httpClient";
import type {
  PaginationParams,
  PaginationResult,
  ListAnnouncementsNameSpace,
  CreateAnnouncementNameSpace,
  UpdateAnnouncementNameSpace,
  DeleteAnnouncementNameSpace,
} from "./type";

export async function listAnnouncements(
  params: ListAnnouncementsNameSpace.ListAnnouncementsParams,
): Promise<
  PaginationResult<ListAnnouncementsNameSpace.ListAnnouncementsResult>
> {
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
      q: (filter as any)?.q,
      type,
    };
    const res = await httpClient.get("/announcements", { params: query });
    const json = res.data;
    const rows =
      (json?.data?.rows as any[]) ??
      (json?.rows as any[]) ??
      (Array.isArray(json) ? (json as any[]) : []);
    const total = json?.data?.total ?? json?.total ?? rows.length ?? 0;
    return {
      data: rows as ListAnnouncementsNameSpace.ListAnnouncementsResult[],
      total,
    };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function listVisibleAnnouncements(limit = 20) {
  try {
    const res = await httpClient.get("/announcements/visible", {
      params: { limit },
    });
    const json = res.data;
    const rows =
      (json?.data?.rows as any[]) ??
      (json?.rows as any[]) ??
      (Array.isArray(json) ? (json as any[]) : []);
    const total = json?.data?.total ?? json?.total ?? rows.length ?? 0;
    return {
      data: rows as ListAnnouncementsNameSpace.ListAnnouncementsResult[],
      total,
    };
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function createAnnouncement(
  payload: CreateAnnouncementNameSpace.CreateAnnouncementParams,
): Promise<CreateAnnouncementNameSpace.CreateAnnouncementResult> {
  try {
    const res = await httpClient.post("/announcements", payload);
    return (res.data?.data ??
      res.data) as CreateAnnouncementNameSpace.CreateAnnouncementResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function updateAnnouncement(
  announcementId: number,
  payload: UpdateAnnouncementNameSpace.UpdateAnnouncementParams,
): Promise<UpdateAnnouncementNameSpace.UpdateAnnouncementResult> {
  try {
    const res = await httpClient.put(
      `/announcements/${announcementId}`,
      payload,
    );
    return (res.data?.data ??
      res.data) as UpdateAnnouncementNameSpace.UpdateAnnouncementResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function deleteAnnouncement(
  announcementId: number,
): Promise<DeleteAnnouncementNameSpace.DeleteAnnouncementResult> {
  try {
    const res = await httpClient.delete(`/announcements/${announcementId}`);
    return (res.data?.data ??
      res.data) as DeleteAnnouncementNameSpace.DeleteAnnouncementResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

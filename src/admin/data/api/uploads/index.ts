/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "../../httpClient";
import type { UploadsNameSpace } from "./type";

export async function initUpload(
  params: UploadsNameSpace.InitUploadParams,
  config?: any,
): Promise<UploadsNameSpace.InitUploadResult> {
  try {
    const res = await httpClient.post("/uploads/init", params, config);
    return (res.data?.data ?? res.data) as UploadsNameSpace.InitUploadResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function getUploadTask(
  taskId: number,
  config?: any,
): Promise<UploadsNameSpace.UploadTaskResult> {
  try {
    const res = await httpClient.get(`/uploads/${taskId}`, config);
    return (res.data?.data ?? res.data) as UploadsNameSpace.UploadTaskResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function getPartUrl(
  taskId: number,
  params: UploadsNameSpace.PartUrlParams,
  config?: any,
): Promise<UploadsNameSpace.PartUrlResult> {
  try {
    const res = await httpClient.post(
      `/uploads/${taskId}/part-url`,
      params,
      config,
    );
    return (res.data?.data ?? res.data) as UploadsNameSpace.PartUrlResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function completeUpload(
  taskId: number,
  params: UploadsNameSpace.CompleteUploadParams,
  config?: any,
): Promise<UploadsNameSpace.CompleteUploadResult> {
  try {
    const res = await httpClient.post(
      `/uploads/${taskId}/complete`,
      params,
      config,
    );
    return (res.data?.data ??
      res.data) as UploadsNameSpace.CompleteUploadResult;
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

export async function abortUpload(taskId: number): Promise<void> {
  try {
    await httpClient.post(`/uploads/${taskId}/abort`);
  } catch (error) {
    console.error("接口错误", error);
    throw error as any;
  }
}

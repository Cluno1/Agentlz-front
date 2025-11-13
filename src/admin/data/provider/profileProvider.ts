/* eslint-disable @typescript-eslint/no-explicit-any */

import httpClient from "../httpClient";

const useMock = import.meta.env.MODE === "development";
// const apiUrl = import.meta.env.VITE_API_BASE_URL;

const getTenantHeaders = () => {
  const tenantId = localStorage.getItem("tenant_id");
  return tenantId ? { "X-Tenant-ID": tenantId } : {};
};

export const profileProvider = {
  getProfile: async () => {
    if (useMock) {
      const mock = await import("../../mock/profile");
      return await mock.getProfile();
    }
    const url = `/v1/profile`;
    const { data } = await httpClient.get(url, { headers: getTenantHeaders() });
    return data.data || data;
  },
  updateProfile: async (params: any) => {
    if (useMock) {
      const mock = await import("../../mock/profile");
      return await mock.updateProfile(params);
    }
    const url = `/v1/profile`;
    const { data } = await httpClient.patch(url, params.data, {
      headers: getTenantHeaders(),
    });
    return data.data || data;
  },
  changePassword: async (params: any) => {
    if (useMock) {
      const mock = await import("../../mock/profile");
      return await mock.changePassword(params);
    }
    const url = `/v1/password`;
    const { data } = await httpClient.post(url, params.data, {
      headers: getTenantHeaders(),
    });
    return data.data || data;
  },
};

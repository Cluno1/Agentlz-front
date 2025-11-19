/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MockUser } from "../data/types/user";

const PROFILE_KEY = "mock_profile";

const read = (): (MockUser & { password?: string }) | null => {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const write = (profile: any) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const seedProfile = () => {
  if (read()) return;
  const identityRaw = localStorage.getItem("mock_identity");
  const identity = identityRaw ? JSON.parse(identityRaw) : null;
  const base: any = {
    id: identity?.id || "1",
    username: identity?.fullName?.toLowerCase() || "admin",
    email: "admin@example.com",
    fullName: identity?.fullName || "Administrator",
    role: identity?.role || "admin",
    avatar:
      identity?.avatar ||
      `https://avatars.githubusercontent.com/u/${Math.floor(1000 + Math.random() * 500000)}?v=4`,
    disabled: false,
    createdAt: new Date().toISOString(),
    password: "123456",
  };
  write(base);
};

export const getProfile = async () => {
  seedProfile();
  const p = read();
  if (!p) return {};
  const { password, ...rest } = p as any;
  return rest;
};

export const updateProfile = async (params: { data: Partial<MockUser> }) => {
  seedProfile();
  const current = read();
  const next = { ...(current || {}), ...(params?.data || {}) };
  write(next);
  const { password, ...rest } = next as any;
  return rest;
};

export const changePassword = async (params: {
  data: { currentPassword: string; newPassword: string };
}) => {
  seedProfile();
  const current = read();
  if (!current) throw new Error("Profile not found");
  if ((current as any).password !== params.data.currentPassword) {
    throw new Error("当前密码不正确");
  }
  (current as any).password = params.data.newPassword;
  write(current);
  const { password, ...rest } = current as any;
  return rest;
};

export default { getProfile, updateProfile, changePassword, seedProfile };

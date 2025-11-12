/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AuthProvider } from "react-admin";
import { MockUser } from "../data/types/user";

const TOKEN_KEY = "mock_token";
const IDENTITY_KEY = "mock_identity";

const users: MockUser[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    password: "123456",
    fullName: "Administrator",
    role: "admin",
  },
  {
    id: "2",
    username: "user",
    email: "user@example.com",
    password: "123456",
    fullName: "Regular User",
    role: "user",
  },
];

export function registerUser({
  username,
  email,
  password,
}: {
  username: string;
  email?: string;
  password: string;
}): Promise<MockUser> {
  const exists = users.find(
    (u) => u.username === username || (email && u.email === email),
  );
  if (exists) {
    return Promise.reject(new Error("用户已存在"));
  }

  return Promise.resolve({
    id: String(Date.now()),
    username,
    email,
    password,
    fullName: username,
  });
}

export const authProvider: AuthProvider = {
  login: async (params: any) => {
    const { username, password } = params ?? {};

    const user = users.find(
      (u) => username && (u.username === username || u.email === username),
    );
    if (!user || user.password !== password) {
      throw new Error("用户名或密码错误");
    }

    const token = `mock.${user.id}.${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(
      IDENTITY_KEY,
      JSON.stringify({
        id: user.id,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
      }),
    );
    return Promise.resolve();
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(IDENTITY_KEY);
    return Promise.resolve();
  },
  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) return Promise.resolve();
    return Promise.reject();
  },
  checkError: async () => Promise.resolve(),
  getPermissions: async () => {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) {
      const identity = JSON.parse(raw);
      return Promise.resolve(identity.role);
    }
    return Promise.resolve("user");
  },
  getIdentity: async () => {
    try {
      const raw = localStorage.getItem(IDENTITY_KEY);
      return raw
        ? Promise.resolve(JSON.parse(raw))
        : Promise.resolve({ id: "", fullName: "" });
    } catch {
      return Promise.resolve({ id: "", fullName: "" });
    }
  },
};

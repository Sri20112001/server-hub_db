import { req } from "./http";

export const authApi = {
  // auth
  login: (username: string, password: string) =>
    req<{ username: string; role: string; token: string }>("/server-hub/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => req<{ ok: boolean }>("/server-hub/api/auth/logout", { method: "POST" }),
  me: () => req<{ username: string; role: string }>("/server-hub/api/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    req<{ ok: boolean }>("/server-hub/api/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // user + role management (admin only)
  users: () =>
    req<{ username: string; role: string; createdAt: string }[]>("/server-hub/api/users"),
  createUser: (username: string, password: string, role: string) =>
    req<{ username: string; role: string }>("/server-hub/api/users", {
      method: "POST",
      body: JSON.stringify({ username, password, role }),
    }),
  setUserRole: (username: string, role: string) =>
    req<{ username: string; role: string }>(`/server-hub/api/users/${encodeURIComponent(username)}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),
  deleteUser: (username: string) =>
    req<{ ok: boolean }>(`/server-hub/api/users/${encodeURIComponent(username)}`, {
      method: "DELETE",
    }),
  logoutAll: () =>
    req<{ ok: boolean }>("/server-hub/api/auth/logout-all", { method: "POST" }),
};

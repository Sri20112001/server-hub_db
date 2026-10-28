import { req } from "./http";
import type { InAppNotification, NotifySettings } from "../types/notify";

export const notifyApi = {
  // Notification channels (Telegram / email / push) for failure + pressure
  // signals.
  notifySettings: () =>
    req<NotifySettings>("/server-hub/api/settings/notifications"),
  saveNotifySettings: (body: object) =>
    req<{ ok: boolean }>("/server-hub/api/settings/notifications", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  testNotify: () =>
    req<{ telegram: string; email: string; push: string }>("/server-hub/api/settings/notifications/test", {
      method: "POST",
    }),

  // in-app notifications
  notifications: () => req<InAppNotification[]>("/server-hub/api/notifications"),
  markNotificationRead: (id: number) =>
    req<{ ok: boolean }>(`/server-hub/api/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () =>
    req<{ ok: boolean }>("/server-hub/api/notifications/read-all", { method: "POST" }),
};

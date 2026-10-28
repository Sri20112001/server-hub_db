export interface NotifySettings {
  enabled: boolean;
  events: { deployFailed: boolean; threshold: boolean; backupFailed: boolean; projectFailed: boolean };
  telegram: { enabled: boolean; chatId: string; hasToken: boolean };
  email: {
    enabled: boolean;
    host: string;
    port: string;
    username: string;
    from: string;
    to: string;
    tls: boolean;
    hasPassword: boolean;
  };
  push: { enabled: boolean; devices: number };
}

export interface InAppNotification {
  id: number;
  username: string;
  title: string;
  body: string;
  category: string;
  read: boolean;
  serverId: number | null;
  alertId: number | null;
  createdAt: string;
}

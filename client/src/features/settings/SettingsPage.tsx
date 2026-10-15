import { useEffect, useState } from "react";
import {
  BellRing,
  Check,
  Eye,
  EyeOff,
  LogOut,
  Send,
  Server,
  Shield,
  Trash2,
  TriangleAlert,
  User,
  Users,
} from "lucide-react";
import { api } from "../../lib/api";
import type { NotifySettings, ServerInfo } from "../../lib/types";
import { fmtUptime } from "../../lib/format";
import { useAuth, useUi } from "../../stores/store";
import { ConfirmModal, Field, Kicker, Toggle, SettingsSkeleton } from "../../components/ui";

const LS_KEY = "serverhub.alerts";

interface Alerts {
  deployFinished: boolean;
  healthChanged: boolean;
  highUsage: boolean;
}

function loadAlerts(): Alerts {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { deployFinished: true, healthChanged: true, highUsage: false, ...JSON.parse(raw) };
  } catch {
    /* fall through */
  }
  return { deployFinished: true, healthChanged: true, highUsage: false };
}

type SettingsTab = "profile" | "notifications" | "system" | "users" | "danger";

interface UserRecord {
  username: string;
  role: string;
  createdAt: string;
}

export function SettingsPage({ setOnline }: { setOnline: (v: boolean) => void }) {
  const { user } = useAuth();
  const pushToast = useUi((s) => s.pushToast);

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alerts>(loadAlerts);

  // Password rotation state
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Modals state
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  // Notification state
  const [notify, setNotify] = useState<NotifySettings | null>(null);
  const [ntBusy, setNtBusy] = useState(false);
  const [ntTest, setNtTest] = useState<{ telegram: string; email: string } | null>(null);
  const [tgToken, setTgToken] = useState("");
  const [smtpPass, setSmtpPass] = useState("");

  // Users administration state
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("operator");
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    api
      .server()
      .then((s) => {
        setInfo(s);
        setOnline(true);
      })
      .catch(() => setOnline(false))
      .finally(() => setLoading(false));
    api.notifySettings().then(setNotify).catch(() => setNotify(null));
  }, [setOnline]);

  const loadUsers = async () => {
    if (user?.role !== "admin") return;
    setLoadingUsers(true);
    try {
      const res = await api.users();
      setUsersList(res);
    } catch {
      /* ignore */
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      void loadUsers();
    }
  }, [activeTab, user?.role]);

  const flip = (key: keyof Alerts) => {
    setAlerts((a) => {
      const nextAlerts = { ...a, [key]: !a[key] };
      localStorage.setItem(LS_KEY, JSON.stringify(nextAlerts));
      return nextAlerts;
    });
    pushToast("Signal routing saved.");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== again) {
      pushToast("New passwords do not match", true);
      return;
    }
    setPwBusy(true);
    try {
      await api.changePassword(current, next);
      pushToast("Master password rotated.");
      setCurrent("");
      setNext("");
      setAgain("");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Rotation failed", true);
    } finally {
      setPwBusy(false);
    }
  };

  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

  const patchNotify = (patch: Partial<NotifySettings>) =>
    setNotify((n) => (n ? { ...n, ...patch } : n));

  const saveNotify = async () => {
    if (!notify) return;
    setNtBusy(true);
    try {
      await api.saveNotifySettings({
        enabled: notify.enabled,
        events: notify.events,
        telegram: { enabled: notify.telegram.enabled, chatId: notify.telegram.chatId, token: tgToken || undefined },
        email: {
          enabled: notify.email.enabled,
          host: notify.email.host,
          port: notify.email.port,
          username: notify.email.username,
          from: notify.email.from,
          to: notify.email.to,
          tls: notify.email.tls,
          password: smtpPass || undefined,
        },
      });
      setTgToken("");
      setSmtpPass("");
      setNtTest(null);
      pushToast("Notification routing saved.");
      const fresh = await api.notifySettings();
      setNotify(fresh);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Save failed", true);
    } finally {
      setNtBusy(false);
    }
  };

  const probeNotify = async () => {
    try {
      const r = await api.testNotify();
      setNtTest(r);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Probe failed", true);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserPassword) return;
    setCreatingUser(true);
    try {
      await api.createUser(newUsername.trim(), newUserPassword, newUserRole);
      pushToast(`User "${newUsername}" created.`);
      setNewUsername("");
      setNewUserPassword("");
      void loadUsers();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Failed to create user", true);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    try {
      await api.deleteUser(username);
      pushToast(`User "${username}" deleted.`);
      void loadUsers();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Failed to delete user", true);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await api.logoutAll();
      pushToast("All sessions invalidated. Please sign in again.");
      window.location.href = "/login";
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Failed to logout sessions", true);
      setConfirmLogoutAll(false);
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile & Security", icon: <User size={15} /> },
    { id: "notifications", label: "Notifications & Alerts", icon: <BellRing size={15} /> },
    { id: "system", label: "Host System", icon: <Server size={15} /> },
    ...(user?.role === "admin" ? [{ id: "users" as SettingsTab, label: "Users", icon: <Users size={15} /> }] : []),
    { id: "danger", label: "Danger Zone", icon: <TriangleAlert size={15} /> },
  ];

  return (
    <main className="w-full max-w-[860px] mx-auto px-6 max-md:px-4 pt-24 pb-36">
      <div className="mb-6">
        <Kicker>Server preferences & access</Kicker>
        <h1 className="font-head text-[32px] font-bold tracking-[-0.03em] leading-[1.2] max-md:text-[26px] mt-1.5 text-ink dark:text-bone">
          Settings
        </h1>
        <p className="text-muted dark:text-fog mt-1.5 text-sm">
          Configure host environment, notification channels, security policies, and administrative operations.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto p-1.5 bg-paper dark:bg-panel border border-line dark:border-edge rounded-card">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-input text-xs font-mono font-medium transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? "bg-accent dark:bg-ember text-white dark:text-black font-semibold shadow-sm"
                : "text-muted dark:text-fog hover:text-ink dark:hover:text-bone hover:bg-white/60 dark:hover:bg-emboss/50"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab 1: Profile & Security ── */}
      {activeTab === "profile" && (
        <div className="space-y-5">
          <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-ink dark:text-bone">Operator Identity</h2>
                <p className="text-muted dark:text-fog text-[13px]">Manage current operator session and access level.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
                NODE-01
              </span>
            </div>

            <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="w-11 h-11 rounded-full bg-tint dark:bg-emboss border border-line dark:border-edge flex items-center justify-center font-head font-bold text-lg text-accent dark:text-ember">
                  {(user?.username ?? "C").slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-ink dark:text-bone">{user?.username ?? "—"}</strong>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
                      {user?.role ?? "admin"}
                    </span>
                  </div>
                  <div className="font-mono text-muted dark:text-fog text-[11px] mt-0.5">single-operator station · cookie session</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full font-mono text-[11px] bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-moss" /> Auth: Local
              </span>
            </div>

            <div className="mt-5 pt-4 border-t border-line dark:border-edge flex justify-between items-center flex-wrap gap-2">
              <div>
                <div className="text-ink dark:text-bone text-sm font-medium">Session Management</div>
                <div className="text-muted dark:text-fog text-xs">Terminate all active operator sessions on other devices.</div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmLogoutAll(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-line dark:border-edge text-muted dark:text-fog hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/40 transition-colors"
              >
                <LogOut size={13} /> Invalidate all sessions
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-ink dark:text-bone">Password Rotation</h2>
                <p className="text-muted dark:text-fog text-[13px]">Rotate the account master authentication credential.</p>
              </div>
              <Shield size={18} className="text-muted dark:text-fog" />
            </div>

            <form onSubmit={(e) => void changePassword(e)} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Current master password">
                  <div className="relative">
                    <input
                      className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog pr-10 font-mono"
                      type={showPw ? "text" : "password"}
                      value={current}
                      onChange={(e) => setCurrent(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted dark:text-fog bg-transparent border-0 cursor-pointer flex p-1"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label="Toggle visibility"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>
                <Field label="New master password">
                  <input
                    className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                    type={showPw ? "text" : "password"}
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
              </div>
              <Field label="Confirm new password">
                <input
                  className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                  type={showPw ? "text" : "password"}
                  value={again}
                  onChange={(e) => setAgain(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              <div className="flex items-center justify-end gap-2 flex-wrap">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover"
                  disabled={pwBusy || !current || next.length < 8 || next !== again}
                >
                  <Check size={14} /> {pwBusy ? "Rotating…" : "Save password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ── Tab 2: Notifications & Alerts ── */}
      {activeTab === "notifications" && (
        <div className="space-y-5">
          <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-ink dark:text-bone">Client Alerts & Signals</h2>
                <p className="text-muted dark:text-fog text-[13px]">In-browser toast notifications for events while you are at the helm.</p>
              </div>
              <BellRing size={18} className="text-muted dark:text-fog" />
            </div>
            <AlertRow
              title="Deployment finished"
              hint="Toast upon successful container ship launch"
              on={alerts.deployFinished}
              onFlip={() => flip("deployFinished")}
            />
            <AlertRow
              title="Health state changed"
              hint="Toast if a ship or node turns Choppy or Lost signal"
              on={alerts.healthChanged}
              onFlip={() => flip("healthChanged")}
            />
            <AlertRow
              title="High resource usage"
              hint="Toast if CPU/RAM exceeds 85% for > 5 mins"
              on={alerts.highUsage}
              onFlip={() => flip("highUsage")}
              last
            />
          </section>

          <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-ink dark:text-bone">Server-Side Notification Dispatch</h2>
                <p className="text-muted dark:text-fog text-[13px]">Automated dispatches to Telegram and Email (SMTP) on failure events — no browser required.</p>
              </div>
              {notify && (
                <Toggle checked={notify.enabled} onChange={() => patchNotify({ enabled: !notify.enabled })} label="Notifications master switch" />
              )}
            </div>
            {!notify ? (
              <p className="text-muted dark:text-fog text-[13px]">Loading notification settings…</p>
            ) : (
              <>
                <div className="mb-4">
                  <div className="text-xs uppercase font-mono text-muted dark:text-fog mb-1 tracking-wider">Trigger Events</div>
                  <AlertRow
                    title="Deploy failed"
                    hint="Ping on failed container dispatches"
                    on={notify.events.deployFailed}
                    onFlip={() => patchNotify({ events: { ...notify.events, deployFailed: !notify.events.deployFailed } })}
                  />
                  <AlertRow
                    title="Resource pressure"
                    hint="Ping on CPU/RAM/disk threshold crossings"
                    on={notify.events.threshold}
                    onFlip={() => patchNotify({ events: { ...notify.events, threshold: !notify.events.threshold } })}
                  />
                  <AlertRow
                    title="Backup failed"
                    hint="Ping on failed snapshots and restores"
                    on={notify.events.backupFailed}
                    onFlip={() => patchNotify({ events: { ...notify.events, backupFailed: !notify.events.backupFailed } })}
                  />
                  <AlertRow
                    title="Project action failed"
                    hint="Ping on failed wake/nap/restart"
                    on={notify.events.projectFailed}
                    onFlip={() => patchNotify({ events: { ...notify.events, projectFailed: !notify.events.projectFailed } })}
                    last
                  />
                </div>

                <div className="pt-4 border-t border-line dark:border-edge">
                  <h3 className="font-semibold text-sm mb-2 text-ink dark:text-bone">Telegram Channel</h3>
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="text-[13px] text-muted dark:text-fog">Enabled (requires bot token + chat id)</span>
                    <Toggle
                      checked={notify.telegram.enabled}
                      onChange={() => patchNotify({ telegram: { ...notify.telegram, enabled: !notify.telegram.enabled } })}
                      label="Telegram channel"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                    <Field label="Bot token">
                      <input
                        className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                        type="password"
                        value={tgToken}
                        onChange={(e) => setTgToken(e.target.value)}
                        placeholder={notify.telegram.hasToken ? "Stored — leave blank to keep" : "123456:ABC-DEF…"}
                        autoComplete="new-password"
                      />
                    </Field>
                    <Field label="Chat id">
                      <input
                        className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                        value={notify.telegram.chatId}
                        onChange={(e) => patchNotify({ telegram: { ...notify.telegram, chatId: e.target.value } })}
                        placeholder="123456789"
                        autoComplete="off"
                      />
                    </Field>
                  </div>
                </div>

                <div className="pt-5 border-t border-line dark:border-edge mt-5">
                  <h3 className="font-semibold text-sm mb-2 text-ink dark:text-bone">Email Channel (SMTP)</h3>
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="text-[13px] text-muted dark:text-fog">Enabled</span>
                    <Toggle
                      checked={notify.email.enabled}
                      onChange={() => patchNotify({ email: { ...notify.email, enabled: !notify.email.enabled } })}
                      label="Email channel"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                    <Field label="SMTP host">
                      <input
                        className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                        value={notify.email.host}
                        onChange={(e) => patchNotify({ email: { ...notify.email, host: e.target.value } })}
                        placeholder="smtp.gmail.com"
                      />
                    </Field>
                    <Field label="Port">
                      <input
                        className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                        value={notify.email.port}
                        onChange={(e) => patchNotify({ email: { ...notify.email, port: e.target.value } })}
                        placeholder="587"
                      />
                    </Field>
                    <Field label="Username">
                      <input
                        className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                        value={notify.email.username}
                        onChange={(e) => patchNotify({ email: { ...notify.email, username: e.target.value } })}
                        placeholder="alert@example.com"
                      />
                    </Field>
                    <Field label="Password">
                      <input
                        className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                        type="password"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder={notify.email.hasPassword ? "Stored — leave blank to keep" : "app password"}
                        autoComplete="new-password"
                      />
                    </Field>
                    <Field label="From">
                      <input
                        className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                        value={notify.email.from}
                        onChange={(e) => patchNotify({ email: { ...notify.email, from: e.target.value } })}
                        placeholder="serverhub@example.com"
                      />
                    </Field>
                    <Field label="To">
                      <input
                        className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                        value={notify.email.to}
                        onChange={(e) => patchNotify({ email: { ...notify.email, to: e.target.value } })}
                        placeholder="captain@example.com"
                      />
                    </Field>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2 mt-2">
                    <span className="text-[13px] text-muted dark:text-fog">Use TLS / STARTTLS</span>
                    <Toggle
                      checked={notify.email.tls}
                      onChange={() => patchNotify({ email: { ...notify.email, tls: !notify.email.tls } })}
                      label="SMTP TLS"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap mt-5 pt-4 border-t border-line dark:border-edge">
                  <button
                    className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover"
                    disabled={ntBusy}
                    onClick={() => void saveNotify()}
                  >
                    <Check size={14} /> {ntBusy ? "Saving…" : "Save configuration"}
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss"
                    onClick={() => void probeNotify()}
                  >
                    <Send size={14} /> Send test dispatch
                  </button>
                </div>
                {ntTest && (
                  <p className="font-mono text-xs text-muted dark:text-fog mt-2 p-2 rounded bg-paper dark:bg-abyss border border-line dark:border-edge">
                    Telegram: {ntTest.telegram} · Email: {ntTest.email}
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {/* ── Tab 3: Host System ── */}
      {activeTab === "system" && (
        <div className="space-y-5">
          <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-ink dark:text-bone">Host Parameters</h2>
                <p className="text-muted dark:text-fog text-[13px]">Core runtime metrics and daemon routing points.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
                SERVERHUB · v2.0
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5">
                <Kicker>API Endpoint</Kicker>
                <div className="font-mono text-[13px] mt-1.5 truncate text-ink dark:text-bone font-medium">{apiUrl}</div>
              </div>
              <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5">
                <div className="flex items-center justify-between gap-4">
                  <Kicker>Docker Socket</Kicker>
                  <span
                    className={
                      info?.dockerAvailable
                        ? "w-2.5 h-2.5 rounded-full bg-moss shadow-[0_0_0_3px_rgba(22,163,74,0.18)]"
                        : "w-2.5 h-2.5 rounded-full bg-stone shadow-[0_0_0_3px_rgba(168,162,158,0.25)]"
                    }
                  />
                </div>
                <div className="font-mono text-[13px] mt-1.5 truncate text-ink dark:text-bone font-medium">
                  {info ? (info.dockerAvailable ? "/var/run/docker.sock · live" : "unreachable") : "probing…"}
                </div>
              </div>
              <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5">
                <Kicker>Uptime</Kicker>
                <div className="font-mono text-[13px] mt-1.5 text-ink dark:text-bone font-medium">{info ? fmtUptime(info.uptimeSec) : "—"}</div>
              </div>
              <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5">
                <Kicker>Fleet Census</Kicker>
                <div className="font-mono text-[13px] mt-1.5 truncate text-ink dark:text-bone font-medium">
                  {info
                    ? `${info.projects} ships · ${info.services} stations · ${
                        info.runningContainers < 0 ? "?" : info.runningContainers
                      } running`
                    : "—"}
                </div>
              </div>
            </div>

            <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5 mt-4 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[13px] font-medium text-ink dark:text-bone">Heartbeat interval</span>
              <span className="font-mono text-xs text-muted dark:text-fog">
                Every tick <strong className="font-mono text-ink dark:text-bone font-semibold">30s</strong>
              </span>
            </div>
          </section>

          <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
                  v2.0
                </span>
                <span className="font-mono text-xs text-muted dark:text-fog flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-moss shadow-[0_0_0_3px_rgba(22,163,74,0.18)]" />
                  Bridge manned
                </span>
              </div>
              <em className="text-muted dark:text-fog text-[13px] not-italic">Self-hosted container & server orchestrator.</em>
            </div>
          </section>
        </div>
      )}

      {/* ── Tab 4: Users Administration (Admin only) ── */}
      {activeTab === "users" && user?.role === "admin" && (
        <div className="space-y-5">
          <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink dark:text-bone mb-1">Create Operator Account</h2>
            <p className="text-muted dark:text-fog text-[13px] mb-4">Add a new user credential to access the console.</p>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                className="bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input px-3 py-2 text-ink dark:text-bone text-sm outline-none focus:border-accent dark:focus:border-ember"
                placeholder="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <input
                type="password"
                className="bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input px-3 py-2 text-ink dark:text-bone text-sm outline-none focus:border-accent dark:focus:border-ember font-mono"
                placeholder="Password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <select
                  className="bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input px-3 py-2 text-ink dark:text-bone text-sm outline-none focus:border-accent dark:focus:border-ember"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                >
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={creatingUser || !newUsername.trim() || !newUserPassword}
                  className="px-4 py-2 bg-accent dark:bg-ember text-white dark:text-black font-semibold text-sm rounded-input disabled:opacity-50 hover:bg-accent-hover dark:hover:bg-ember-hover whitespace-nowrap"
                >
                  {creatingUser ? "Adding…" : "Add"}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-line dark:border-edge flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-ink dark:text-bone text-base">Registered Accounts</h3>
                <p className="text-muted dark:text-fog text-xs">Operators with active authorization tokens</p>
              </div>
              <span className="font-mono text-xs text-muted dark:text-fog">{usersList.length} accounts</span>
            </div>
            <div className="divide-y divide-line dark:divide-edge">
              {loadingUsers ? (
                <div className="p-6 text-center text-muted dark:text-fog text-sm">Loading users…</div>
              ) : usersList.length === 0 ? (
                <div className="p-6 text-center text-muted dark:text-fog text-sm">No users found.</div>
              ) : (
                usersList.map((u) => (
                  <div key={u.username} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-semibold text-ink dark:text-bone text-sm flex items-center gap-2">
                        {u.username}
                        <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-tint dark:bg-emboss border border-line dark:border-edge">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-muted dark:text-fog text-xs font-mono mt-0.5">
                        Created {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {u.username !== user?.username && (
                      <button
                        onClick={() => void handleDeleteUser(u.username)}
                        className="p-1.5 text-muted dark:text-fog hover:text-red-500 hover:bg-paper dark:hover:bg-emboss rounded-md transition-colors"
                        title={`Delete ${u.username}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* ── Tab 5: Danger Zone ── */}
      {activeTab === "danger" && (
        <section className="bg-white dark:bg-panel border border-brick/40 rounded-card p-5 shadow-sm">
          <div className="flex items-center gap-2.5 flex-wrap text-brick mb-2">
            <TriangleAlert size={20} />
            <h2 className="text-lg font-bold text-ink dark:text-bone">Danger Zone</h2>
          </div>
          <p className="text-muted dark:text-fog text-[13px] mb-5">
            Irreversible host actions. Proceed with operational clearance.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-brick/30 bg-brick/5 dark:bg-brick/10 flex-wrap">
              <div>
                <div className="font-semibold text-ink dark:text-bone text-sm">Fresh start (Restart ServerHub)</div>
                <div className="text-muted dark:text-fog text-xs mt-0.5">Copy host command to cleanly restart the bridge container.</div>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-brick text-brick hover:bg-brick hover:text-white transition-colors"
                onClick={() => setConfirmRestart(true)}
              >
                Copy restart command
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-brick/30 bg-brick/5 dark:bg-brick/10 flex-wrap">
              <div>
                <div className="font-semibold text-ink dark:text-bone text-sm">Wipe Deployment History</div>
                <div className="text-muted dark:text-fog text-xs mt-0.5">Purges every past build and launch record. Active services remain running.</div>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-brick text-brick hover:bg-brick hover:text-white transition-colors"
                onClick={() => setConfirmWipe(true)}
              >
                Wipe deployment logs
              </button>
            </div>
          </div>
        </section>
      )}

      {confirmRestart && (
        <ConfirmModal
          title="Fresh-start ServerHub?"
          body="The bridge cannot restart itself from inside container space. Run the command below on the host instead — it has been copied to your clipboard."
          confirmLabel="Copy command & close"
          onClose={() => setConfirmRestart(false)}
          onConfirm={() => {
            void navigator.clipboard.writeText("docker compose restart serverhub").catch(() => undefined);
            pushToast("Command copied: docker compose restart serverhub");
            setConfirmRestart(false);
          }}
        />
      )}

      {confirmWipe && (
        <ConfirmModal
          title="Wipe deployment history?"
          body="This deletes every recorded launch. Projects, services and secrets are untouched. This cannot be undone."
          confirmLabel="Wipe history"
          requireText="WIPE"
          onClose={() => setConfirmWipe(false)}
          onConfirm={async () => {
            try {
              const r = await api.wipeDeployments();
              pushToast(`History wiped. ${r.deleted} entries cleared.`);
              setConfirmWipe(false);
            } catch (e) {
              pushToast(e instanceof Error ? e.message : "Wipe failed", true);
            }
          }}
        />
      )}

      {confirmLogoutAll && (
        <ConfirmModal
          title="Invalidate all operator sessions?"
          body="This will log out every active browser session across all devices. You will need to sign back in."
          confirmLabel="Log out all sessions"
          onClose={() => setConfirmLogoutAll(false)}
          onConfirm={handleLogoutAll}
        />
      )}
    </main>
  );
}

function AlertRow({
  title,
  hint,
  on,
  onFlip,
  last,
}: {
  title: string;
  hint: string;
  on: boolean;
  onFlip: () => void;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3.5 border-t border-line dark:border-edge ${
        last ? "border-b-0" : ""
      }`}
    >
      <div>
        <div className="font-medium text-sm text-ink dark:text-bone">{title}</div>
        <div className="text-muted dark:text-fog text-[13px]">{hint}</div>
      </div>
      <Toggle checked={on} onChange={onFlip} label={title} />
    </div>
  );
}

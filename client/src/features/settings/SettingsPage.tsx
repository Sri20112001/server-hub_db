import { BellRing, Server, TriangleAlert, User, Users } from "lucide-react";
import { api } from "../../lib/api";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Kicker } from "../../components/ui/Kicker";
import { SettingsSkeleton } from "../../components/ui/SettingsSkeleton";
import { useSettings, type SettingsController, type SettingsTab } from "../../hooks/useSettings";
import { SettingsProfileTab } from "../../components/SettingsProfileTab";
import { SettingsNotificationsTab } from "../../components/SettingsNotificationsTab";
import { SettingsSystemTab } from "../../components/SettingsSystemTab";
import { SettingsUsersTab } from "../../components/SettingsUsersTab";
import { SettingsDangerTab } from "../../components/SettingsDangerTab";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

// Settings shell: page header, tab navigation, the active tab body and the
// three confirmation modals. All state and actions come from useSettings.
export function SettingsPage({ setOnline }: { setOnline: (v: boolean) => void }) {
  useDocumentTitle("Settings");
  const c: SettingsController = useSettings(setOnline);

  if (c.loading) {
    return <SettingsSkeleton />;
  }

  const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile & Security", icon: <User size={15} /> },
    { id: "notifications", label: "Notifications & Alerts", icon: <BellRing size={15} /> },
    { id: "system", label: "Host System", icon: <Server size={15} /> },
    ...(c.user?.role === "admin" ? [{ id: "users" as SettingsTab, label: "Users", icon: <Users size={15} /> }] : []),
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
            onClick={() => c.setActiveTab(t.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-input text-xs font-mono font-medium transition-colors whitespace-nowrap ${
              c.activeTab === t.id
                ? "bg-accent dark:bg-ember text-white dark:text-black font-semibold shadow-sm"
                : "text-muted dark:text-fog hover:text-ink dark:hover:text-bone hover:bg-white/60 dark:hover:bg-emboss/50"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {c.activeTab === "profile" && <SettingsProfileTab c={c} />}
      {c.activeTab === "notifications" && <SettingsNotificationsTab c={c} />}
      {c.activeTab === "system" && <SettingsSystemTab c={c} />}
      {c.activeTab === "users" && c.user?.role === "admin" && <SettingsUsersTab c={c} />}
      {c.activeTab === "danger" && <SettingsDangerTab c={c} />}

      {c.confirmRestart && (
        <ConfirmModal
          title="Fresh-start ServerHub?"
          body="The bridge cannot restart itself from inside container space. Run the command below on the host instead — it has been copied to your clipboard."
          confirmLabel="Copy command & close"
          onClose={() => c.setConfirmRestart(false)}
          onConfirm={() => {
            void navigator.clipboard.writeText("docker compose restart serverhub").catch(() => undefined);
            c.pushToast("Command copied: docker compose restart serverhub");
            c.setConfirmRestart(false);
          }}
        />
      )}

      {c.confirmWipe && (
        <ConfirmModal
          title="Wipe deployment history?"
          body="This deletes every recorded launch. Projects, services and secrets are untouched. This cannot be undone."
          confirmLabel="Wipe history"
          requireText="WIPE"
          onClose={() => c.setConfirmWipe(false)}
          onConfirm={async () => {
            try {
              const r = await api.wipeDeployments();
              c.pushToast(`History wiped. ${r.deleted} entries cleared.`);
              c.setConfirmWipe(false);
            } catch (e) {
              c.pushToast(e instanceof Error ? e.message : "Wipe failed", true);
            }
          }}
        />
      )}

      {c.confirmLogoutAll && (
        <ConfirmModal
          title="Invalidate all operator sessions?"
          body="This will log out every active browser session across all devices. You will need to sign back in."
          confirmLabel="Log out all sessions"
          onClose={() => c.setConfirmLogoutAll(false)}
          onConfirm={c.handleLogoutAll}
        />
      )}
    </main>
  );
}

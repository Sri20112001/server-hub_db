import { BellRing, Check, Send } from "lucide-react";
import { Field } from "../../components/ui/Field";
import { Toggle } from "../../components/ui/Toggle";
import { AlertRow } from "./AlertRow";
import type { SettingsController } from "./useSettings";

// Tab 2: browser alert toggles plus the server-side dispatch channels
// (trigger events, Telegram, SMTP, mobile push).
export function SettingsNotificationsTab({ c }: { c: SettingsController }) {
  const notify = c.notify;

  return (
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
          on={c.alerts.deployFinished}
          onFlip={() => c.flip("deployFinished")}
        />
        <AlertRow
          title="Health state changed"
          hint="Toast if a ship or node turns Choppy or Lost signal"
          on={c.alerts.healthChanged}
          onFlip={() => c.flip("healthChanged")}
        />
        <AlertRow
          title="High resource usage"
          hint="Toast if CPU/RAM exceeds 85% for > 5 mins"
          on={c.alerts.highUsage}
          onFlip={() => c.flip("highUsage")}
          last
        />
      </section>

      <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink dark:text-bone">Server-Side Notification Dispatch</h2>
            <p className="text-muted dark:text-fog text-[13px]">Automated dispatches to Telegram, Email (SMTP), and mobile push on failure events — no browser required.</p>
          </div>
          {notify && (
            <Toggle checked={notify.enabled} onChange={() => c.patchNotify({ enabled: !notify.enabled })} label="Notifications master switch" />
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
                onFlip={() => c.patchNotify({ events: { ...notify.events, deployFailed: !notify.events.deployFailed } })}
              />
              <AlertRow
                title="Resource pressure"
                hint="Ping on CPU/RAM/disk threshold crossings"
                on={notify.events.threshold}
                onFlip={() => c.patchNotify({ events: { ...notify.events, threshold: !notify.events.threshold } })}
              />
              <AlertRow
                title="Backup failed"
                hint="Ping on failed snapshots and restores"
                on={notify.events.backupFailed}
                onFlip={() => c.patchNotify({ events: { ...notify.events, backupFailed: !notify.events.backupFailed } })}
              />
              <AlertRow
                title="Project action failed"
                hint="Ping on failed wake/nap/restart"
                on={notify.events.projectFailed}
                onFlip={() => c.patchNotify({ events: { ...notify.events, projectFailed: !notify.events.projectFailed } })}
                last
              />
            </div>

            <div className="pt-4 border-t border-line dark:border-edge">
              <h3 className="font-semibold text-sm mb-2 text-ink dark:text-bone">Telegram Channel</h3>
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-[13px] text-muted dark:text-fog">Enabled (requires bot token + chat id)</span>
                <Toggle
                  checked={notify.telegram.enabled}
                  onChange={() => c.patchNotify({ telegram: { ...notify.telegram, enabled: !notify.telegram.enabled } })}
                  label="Telegram channel"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                <Field label="Bot token">
                  <input
                    className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                    type="password"
                    value={c.tgToken}
                    onChange={(e) => c.setTgToken(e.target.value)}
                    placeholder={notify.telegram.hasToken ? "Stored — leave blank to keep" : "123456:ABC-DEF…"}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Chat id">
                  <input
                    className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                    value={notify.telegram.chatId}
                    onChange={(e) => c.patchNotify({ telegram: { ...notify.telegram, chatId: e.target.value } })}
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
                  onChange={() => c.patchNotify({ email: { ...notify.email, enabled: !notify.email.enabled } })}
                  label="Email channel"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                <Field label="SMTP host">
                  <input
                    className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                    value={notify.email.host}
                    onChange={(e) => c.patchNotify({ email: { ...notify.email, host: e.target.value } })}
                    placeholder="smtp.gmail.com"
                  />
                </Field>
                <Field label="Port">
                  <input
                    className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                    value={notify.email.port}
                    onChange={(e) => c.patchNotify({ email: { ...notify.email, port: e.target.value } })}
                    placeholder="587"
                  />
                </Field>
                <Field label="Username">
                  <input
                    className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                    value={notify.email.username}
                    onChange={(e) => c.patchNotify({ email: { ...notify.email, username: e.target.value } })}
                    placeholder="alert@example.com"
                  />
                </Field>
                <Field label="Password">
                  <input
                    className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                    type="password"
                    value={c.smtpPass}
                    onChange={(e) => c.setSmtpPass(e.target.value)}
                    placeholder={notify.email.hasPassword ? "Stored — leave blank to keep" : "app password"}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="From">
                  <input
                    className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                    value={notify.email.from}
                    onChange={(e) => c.patchNotify({ email: { ...notify.email, from: e.target.value } })}
                    placeholder="serverhub@example.com"
                  />
                </Field>
                <Field label="To">
                  <input
                    className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                    value={notify.email.to}
                    onChange={(e) => c.patchNotify({ email: { ...notify.email, to: e.target.value } })}
                    placeholder="captain@example.com"
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between gap-4 py-2 mt-2">
                <span className="text-[13px] text-muted dark:text-fog">Use TLS / STARTTLS</span>
                <Toggle
                  checked={notify.email.tls}
                  onChange={() => c.patchNotify({ email: { ...notify.email, tls: !notify.email.tls } })}
                  label="SMTP TLS"
                />
              </div>
            </div>

            <div className="pt-5 border-t border-line dark:border-edge mt-5">
              <h3 className="font-semibold text-sm mb-2 text-ink dark:text-bone">Mobile Push Channel</h3>
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-[13px] text-muted dark:text-fog">
                  Enabled
                  {notify.push && (
                    <span className="font-mono text-xs ml-2">
                      · {notify.push.devices} device{notify.push.devices === 1 ? "" : "s"} registered
                    </span>
                  )}
                </span>
                <Toggle
                  checked={notify.push?.enabled ?? true}
                  onChange={() => c.patchNotify({ push: { enabled: !(notify.push?.enabled ?? true), devices: notify.push?.devices ?? 0 } })}
                  label="Mobile push channel"
                />
              </div>
              <p className="text-muted dark:text-fog text-xs mt-1">
                Devices register automatically on mobile login. Switch off to silence pushes without unregistering devices.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap mt-5 pt-4 border-t border-line dark:border-edge">
              <button
                className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover"
                disabled={c.ntBusy}
                onClick={() => void c.saveNotify()}
              >
                <Check size={14} /> {c.ntBusy ? "Saving…" : "Save configuration"}
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss"
                onClick={() => void c.probeNotify()}
              >
                <Send size={14} /> Send test dispatch
              </button>
            </div>
            {c.ntTest && (
              <p className="font-mono text-xs text-muted dark:text-fog mt-2 p-2 rounded bg-paper dark:bg-abyss border border-line dark:border-edge">
                Telegram: {c.ntTest.telegram} · Email: {c.ntTest.email} · Push: {c.ntTest.push}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

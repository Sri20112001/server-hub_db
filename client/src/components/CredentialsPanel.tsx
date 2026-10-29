import React from "react";
import { Check, Loader2 } from "lucide-react";
import { DatabaseIcon } from "./DatabaseIcon";
import { btnGhost, inputCls } from "../utils/databaseTokens";

// Username/password form shown when the server rejects a browse or when the
// user wants to store credentials for it.
export function CredentialsPanel({
  engine,
  username,
  password,
  browsing,
  authRequired,
  onChangeUsername,
  onChangePassword,
  onSubmit,
}: {
  engine: string;
  username: string;
  password: string;
  browsing: boolean;
  authRequired: boolean;
  onChangeUsername: (v: string) => void;
  onChangePassword: (v: string) => void;
  onSubmit: () => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3.5 rounded-xl bg-paper/60 dark:bg-abyss/60 border border-line dark:border-edge mb-4"
    >
      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-ink dark:text-bone">
        <DatabaseIcon engine={engine} size={14} />
        <span>Authentication Credentials</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <label className="flex flex-col gap-1 text-[11px] text-muted dark:text-fog">
          Username
          <input
            className={`${inputCls} py-1.5 text-xs`}
            value={username}
            onChange={(e) => onChangeUsername(e.target.value)}
            placeholder={
              engine === "postgres" ? "postgres" : engine === "mysql" ? "root" : "optional"
            }
            autoComplete="username"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-muted dark:text-fog">
          Password
          <input
            className={`${inputCls} py-1.5 text-xs`}
            type="password"
            value={password}
            onChange={(e) => onChangePassword(e.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          className={`${btnGhost} py-1.5 justify-center`}
          disabled={browsing}
        >
          {browsing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Check size={12} />
          )}
          {browsing ? "Connecting…" : "Save & Connect"}
        </button>
      </div>

      {authRequired && (
        <p className="mt-2 text-[11px] text-muted dark:text-fog leading-relaxed">
          Access rejected or password required by this server. Please enter credentials above.
        </p>
      )}
    </form>
  );
}

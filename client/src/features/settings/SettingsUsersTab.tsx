import { Trash2 } from "lucide-react";
import type { SettingsController } from "./useSettings";

// Tab 4 (admin only): create operator accounts and manage the registry.
export function SettingsUsersTab({ c }: { c: SettingsController }) {
  return (
    <div className="space-y-5">
      <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink dark:text-bone mb-1">Create Operator Account</h2>
        <p className="text-muted dark:text-fog text-[13px] mb-4">Add a new user credential to access the console.</p>
        <form onSubmit={c.handleCreateUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input px-3 py-2 text-ink dark:text-bone text-sm outline-none focus:border-accent dark:focus:border-ember"
            placeholder="Username"
            value={c.newUsername}
            onChange={(e) => c.setNewUsername(e.target.value)}
          />
          <input
            type="password"
            className="bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input px-3 py-2 text-ink dark:text-bone text-sm outline-none focus:border-accent dark:focus:border-ember font-mono"
            placeholder="Password"
            value={c.newUserPassword}
            onChange={(e) => c.setNewUserPassword(e.target.value)}
          />
          <div className="flex gap-2">
            <select
              className="bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input px-3 py-2 text-ink dark:text-bone text-sm outline-none focus:border-accent dark:focus:border-ember"
              value={c.newUserRole}
              onChange={(e) => c.setNewUserRole(e.target.value)}
            >
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={c.creatingUser || !c.newUsername.trim() || !c.newUserPassword}
              className="px-4 py-2 bg-accent dark:bg-ember text-white dark:text-black font-semibold text-sm rounded-input disabled:opacity-50 hover:bg-accent-hover dark:hover:bg-ember-hover whitespace-nowrap"
            >
              {c.creatingUser ? "Adding…" : "Add"}
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
          <span className="font-mono text-xs text-muted dark:text-fog">{c.usersList.length} accounts</span>
        </div>
        <div className="divide-y divide-line dark:divide-edge">
          {c.loadingUsers ? (
            <div className="p-6 text-center text-muted dark:text-fog text-sm">Loading users…</div>
          ) : c.usersList.length === 0 ? (
            <div className="p-6 text-center text-muted dark:text-fog text-sm">No users found.</div>
          ) : (
            c.usersList.map((u) => (
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
                {u.username !== c.user?.username && (
                  <button
                    onClick={() => void c.handleDeleteUser(u.username)}
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
  );
}

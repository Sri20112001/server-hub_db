import { Copy, Info, Key, Terminal } from "lucide-react";
import { API_BASE } from "../../lib/api";
import { copyToClipboard } from "../../lib/clipboard";
import { AGENT_CLI_PLATFORMS, getRunnerCommand } from "./agentCommands";
import { TokenRow } from "./TokenRow";
import type { AgentToken } from "../../lib/types/servers";
import type { AgentTokenForm } from "./useServerDetail";

// Tokens tab: generate/revoke agent tokens, show the freshly minted token with
// a per-platform run-command generator, and a static launch cheat sheet.
export function ServerTokensTab({
  serverId,
  tokens,
  refetchTokens,
  form,
}: {
  serverId: number;
  tokens: AgentToken[];
  refetchTokens: () => void;
  form: AgentTokenForm;
}) {
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-ink dark:text-bone flex items-center gap-2">
              <Key size={15} className="text-accent dark:text-ember" />
              <span>Agent Authentication Tokens</span>
            </h2>
            <p className="text-xs text-muted dark:text-fog mt-0.5">
              Tokens authorize your local serverhub-agent daemon to push real-time heartbeats and telemetry.
            </p>
          </div>
          <button
            onClick={() => form.setShow(!form.show)}
            className="px-3 py-1.5 bg-accent dark:bg-ember text-white dark:text-black font-semibold text-xs rounded-lg hover:bg-accent-hover dark:hover:bg-ember-hover transition-colors cursor-pointer"
          >
            {form.show ? "Cancel" : "+ Generate Token"}
          </button>
        </div>

        {/* Token Generation Form */}
        {form.show && (
          <div className="mb-4 p-4 bg-paper dark:bg-abyss rounded-xl border border-line dark:border-edge space-y-3">
            <label className="block text-xs font-mono font-medium text-ink dark:text-bone">
              Token Label
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-white dark:bg-panel border border-line dark:border-edge rounded-lg px-3 py-2 text-ink dark:text-bone text-xs font-mono outline-none focus:border-accent dark:focus:border-ember"
                placeholder="e.g. node-primary-win, k8s-worker-01"
                value={form.label}
                onChange={(e) => form.setLabel(e.target.value)}
              />
              <button
                onClick={() => void form.create()}
                disabled={form.creating}
                className="px-4 py-2 bg-accent dark:bg-ember text-white dark:text-black text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-accent-hover dark:hover:bg-ember-hover cursor-pointer"
              >
                {form.creating ? "Generating…" : "Create"}
              </button>
            </div>
          </div>
        )}

        {/* Newly Created Token Callout */}
        {form.newToken && (
          <div className="mb-5 p-4.5 bg-amber-500/10 dark:bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                <Info size={14} />
                <span>Copy this agent token now. It will not be shown again!</span>
              </div>
              <button
                onClick={() => form.setNewToken(null)}
                className="text-xs text-amber-800 dark:text-amber-300 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-white dark:bg-panel p-2.5 rounded-lg border border-amber-500/30 text-ink dark:text-bone flex-1 break-all select-all">
                {form.newToken}
              </code>
              <button
                onClick={() => copyToClipboard(form.newToken!, "Token")}
                className="p-2.5 bg-white dark:bg-panel border border-amber-500/30 rounded-lg text-ink dark:text-bone hover:border-accent dark:hover:border-ember cursor-pointer"
                title="Copy Token"
              >
                <Copy size={14} />
              </button>
            </div>

            {/* Quick Runner Command for this token */}
            <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-mono font-bold text-amber-900 dark:text-amber-200">
                  Run Command Generator:
                </span>
                <div className="flex gap-1">
                  {AGENT_CLI_PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => form.setPlatform(p.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        form.platform === p.id
                          ? "bg-amber-500 text-black font-bold"
                          : "bg-white/60 dark:bg-black/30 text-ink/70 dark:text-bone/70 hover:text-ink dark:hover:text-bone"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <pre className="p-2.5 rounded-lg bg-white dark:bg-panel border border-amber-500/30 font-mono text-[11px] text-ink dark:text-bone overflow-x-auto select-all">
                  {getRunnerCommand(form.platform, form.newToken, API_BASE)}
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(getRunnerCommand(form.platform, form.newToken!, API_BASE), "Run Command")
                  }
                  className="absolute right-2 top-2 p-1 rounded bg-paper dark:bg-abyss text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
                  title="Copy run command"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Tokens List */}
        <div className="space-y-2">
          {tokens.length === 0 ? (
            <div className="text-center py-8 text-muted dark:text-fog text-xs">
              No authentication tokens created yet. Click "+ Generate Token" to connect an agent.
            </div>
          ) : (
            tokens.map((t) => (
              <TokenRow key={t.id} token={t} serverId={serverId} onRevoked={refetchTokens} />
            ))
          )}
        </div>
      </div>

      {/* Platform Setup Cheat Sheet */}
      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 space-y-3 font-mono text-xs">
        <span className="font-bold text-ink dark:text-bone uppercase tracking-wider text-[11px] flex items-center gap-2">
          <Terminal size={14} className="text-accent dark:text-ember" />
          <span>Standard Agent Launch Reference</span>
        </span>

        <div className="space-y-2">
          <div>
            <span className="text-muted dark:text-fog text-[10px] uppercase">
              CLI Flag (Universal Windows, macOS, Linux):
            </span>
            <pre className="bg-paper dark:bg-abyss p-2.5 rounded-lg border border-line dark:border-edge text-ink dark:text-bone mt-0.5 select-all overflow-x-auto">
              ./serverhub-agent -token="&lt;token&gt;" -url="{API_BASE}"
            </pre>
          </div>

          <div>
            <span className="text-muted dark:text-fog text-[10px] uppercase">
              Windows PowerShell:
            </span>
            <pre className="bg-paper dark:bg-abyss p-2.5 rounded-lg border border-line dark:border-edge text-ink dark:text-bone mt-0.5 select-all overflow-x-auto">
              $env:AGENT_TOKEN="&lt;token&gt;"; $env:SERVERHUB_URL="{API_BASE}"; .\serverhub-agent.exe
            </pre>
          </div>

          <div>
            <span className="text-muted dark:text-fog text-[10px] uppercase">
              Windows Command Prompt (CMD):
            </span>
            <pre className="bg-paper dark:bg-abyss p-2.5 rounded-lg border border-line dark:border-edge text-ink dark:text-bone mt-0.5 select-all overflow-x-auto">
              set AGENT_TOKEN=&lt;token&gt;&amp;&amp; set SERVERHUB_URL={API_BASE}&amp;&amp; serverhub-agent.exe
            </pre>
          </div>

          <div>
            <span className="text-muted dark:text-fog text-[10px] uppercase">
              Linux / macOS / Bash:
            </span>
            <pre className="bg-paper dark:bg-abyss p-2.5 rounded-lg border border-line dark:border-edge text-ink dark:text-bone mt-0.5 select-all overflow-x-auto">
              AGENT_TOKEN="&lt;token&gt;" SERVERHUB_URL="{API_BASE}" ./serverhub-agent
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

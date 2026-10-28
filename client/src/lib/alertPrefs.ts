// Browser alert preferences (Settings → Notifications & Alerts). Shared by
// the settings page (read/write) and the dashboard (read) so the defaults
// live in exactly one place.

export const ALERT_PREFS_KEY = "serverhub.alerts";

export interface AlertPrefs {
  deployFinished: boolean;
  healthChanged: boolean;
  highUsage: boolean;
}

const DEFAULTS: AlertPrefs = {
  deployFinished: true,
  healthChanged: true,
  highUsage: false,
};

export function loadAlertPrefs(): AlertPrefs {
  try {
    const raw = localStorage.getItem(ALERT_PREFS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* fall through */
  }
  return { ...DEFAULTS };
}

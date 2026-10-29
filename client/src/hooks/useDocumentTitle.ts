import { useEffect, useRef } from "react";

export interface UseDocumentTitleOptions {
  /**
   * If true, preserves previous title and restores it when the component unmounts.
   * Default: true
   */
  restoreOnUnmount?: boolean;
  /**
   * App title suffix. Defaults to "ServerHub".
   */
  suffix?: string;
  /**
   * Whether to format with suffix: e.g. `${title} · ServerHub`
   * Default: true
   */
  withSuffix?: boolean;
}

const DEFAULT_TITLE = "ServerHub — Bridge Console";
const DEFAULT_SUFFIX = "ServerHub";

/**
 * Custom hook to dynamically set and manage custom document title for each page.
 *
 * @param title Page-specific title (e.g. "Dashboard", "Servers", "Fleet Registry")
 * @param options Customization options for formatting and unmount restoration
 *
 * @example
 * // In ServersPage.tsx
 * useDocumentTitle("Servers"); // Document title becomes "Servers · ServerHub"
 *
 * @example
 * // In ServerDetailPage.tsx
 * useDocumentTitle(server ? `${server.name}` : "Server Details");
 */
export function useDocumentTitle(
  title?: string | null,
  options: UseDocumentTitleOptions = {}
) {
  const {
    restoreOnUnmount = true,
    suffix = DEFAULT_SUFFIX,
    withSuffix = true,
  } = options;

  const prevTitleRef = useRef<string>(document.title);

  useEffect(() => {
    const prev = prevTitleRef.current;

    if (!title || !title.trim()) {
      document.title = DEFAULT_TITLE;
    } else {
      const cleanTitle = title.trim();
      document.title = withSuffix ? `${cleanTitle} · ${suffix}` : cleanTitle;
    }

    return () => {
      if (restoreOnUnmount) {
        document.title = prev;
      }
    };
  }, [title, suffix, withSuffix, restoreOnUnmount]);
}

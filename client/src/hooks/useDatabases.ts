import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { useUi } from "../stores/store";
import type { DbItem, DbServerInfo, DbTarget } from "../lib/types/databases";
import type { Project } from "../lib/types/projects";

function serverTarget(s: DbServerInfo): DbTarget {
  return { engine: s.engine, source: s.source, host: s.host, port: s.port, container: s.container };
}

// Server discovery, browsing, credential connection and database registration
// for the databases page. The page shell only lays out explorer + browser.
export function useDatabases(setOnline: (v: boolean) => void) {
  const pushToast = useUi((s) => s.pushToast);

  // Primary Data State
  const [servers, setServers] = useState<DbServerInfo[] | null>(null);
  const [dockerAvailable, setDockerAvailable] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [dbs, setDbs] = useState<DbItem[] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filtering & Selection State
  const [serverSearch, setServerSearch] = useState("");
  const [dbSearch, setDbSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [projectId, setProjectId] = useState<string>("");

  // Operation / Async States
  const [browsing, setBrowsing] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [browseErr, setBrowseErr] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registering, setRegistering] = useState(false);

  // Guard against race conditions when clicking through servers quickly
  const activeReqIdRef = useRef<number>(0);

  const loadServers = useCallback(async () => {
    try {
      const r = await api.dbServers();
      setServers(r.servers);
      setDockerAvailable(r.dockerAvailable);
      setOnline(true);
    } catch {
      setServers([]);
    }
  }, [setOnline]);

  useEffect(() => {
    // Intentional: initial fetch on mount (loadServers is a stable useCallback).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadServers();
    api.projects().then(setProjects).catch(() => setProjects([]));
  }, [loadServers]);

  const selected = useMemo(
    () => servers?.find((s) => s.key === selectedKey) ?? null,
    [servers, selectedKey],
  );

  const browse = useCallback(
    async (srv: DbServerInfo, user?: string, pass?: string) => {
      const reqId = ++activeReqIdRef.current;
      setBrowsing(true);
      setBrowseErr(null);
      setAuthRequired(false);

      try {
        const t = { ...serverTarget(srv), username: user ?? "", password: pass ?? "" };
        const r = await api.browseDatabases(t);
        if (reqId === activeReqIdRef.current) {
          setDbs(r.databases);
          setChecked(new Set());
        }
      } catch (e) {
        if (reqId !== activeReqIdRef.current) return;
        const msg = e instanceof Error ? e.message : "Browse failed";
        if (
          msg.toLowerCase().includes("password") ||
          msg.toLowerCase().includes("username") ||
          msg.toLowerCase().includes("auth")
        ) {
          setAuthRequired(true);
          setDbs(null);
        } else {
          setBrowseErr(msg);
          setDbs(null);
        }
      } finally {
        if (reqId === activeReqIdRef.current) {
          setBrowsing(false);
        }
      }
    },
    [],
  );

  const pick = (srv: DbServerInfo) => {
    if (srv.key === selectedKey) return;
    setSelectedKey(srv.key);
    setUsername("");
    setPassword("");
    setDbSearch("");
    setDbs(null);
    void browse(srv);
  };

  const connectAndBrowse = async () => {
    if (!selected) return;
    setBrowsing(true);
    setBrowseErr(null);
    try {
      await api.connectDatabase({ ...serverTarget(selected), username, password });
      pushToast(`Connected to "${selected.name}". Credential saved.`);
      await loadServers();
      await browse(selected, username, password);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connect failed";
      if (
        msg.toLowerCase().includes("password") ||
        msg.toLowerCase().includes("username") ||
        msg.toLowerCase().includes("auth") ||
        msg.toLowerCase().includes("invalid")
      ) {
        setAuthRequired(true);
        pushToast(msg, true);
      } else {
        setBrowseErr(msg);
      }
    } finally {
      setBrowsing(false);
    }
  };

  const toggle = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Filtered Lists
  const [engineFilter, setEngineFilter] = useState<string>("all");

  const engines = useMemo(() => {
    if (!servers) return [];
    const set = new Set<string>();
    for (const s of servers) {
      if (s.engine) set.add(s.engine.toLowerCase());
    }
    return Array.from(set);
  }, [servers]);

  const filteredServers = useMemo(() => {
    if (!servers) return [];
    let list = servers;
    if (engineFilter !== "all") {
      list = list.filter((s) => s.engine?.toLowerCase() === engineFilter);
    }
    if (!serverSearch.trim()) return list;
    const q = serverSearch.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.engine.toLowerCase().includes(q) ||
        (s.container && s.container.toLowerCase().includes(q)) ||
        `${s.host}:${s.port}`.includes(q),
    );
  }, [servers, serverSearch, engineFilter]);

  const filteredDbs = useMemo(() => {
    if (!dbs) return [];
    if (!dbSearch.trim()) return dbs;
    return dbs.filter((d) => d.name.toLowerCase().includes(dbSearch.toLowerCase()));
  }, [dbs, dbSearch]);

  const tickable = useMemo(() => filteredDbs.filter((d) => !d.registered), [filteredDbs]);
  const allTicked = tickable.length > 0 && tickable.every((d) => checked.has(d.name));

  const selectNonSystem = () => {
    const nonSys = tickable.filter((d) => !d.system).map((d) => d.name);
    setChecked(new Set(nonSys));
  };

  const register = async () => {
    if (!selected || checked.size === 0 || !projectId) return;
    setRegistering(true);
    try {
      const r = await api.registerDatabases(
        Number(projectId),
        serverTarget(selected),
        [...checked],
        username || undefined,
        password || undefined,
      );
      const names = r.registered.map((x) => x.database).join(", ");
      pushToast(
        r.registered.length === 0
          ? "Nothing new — already registered."
          : `${r.registered.length} database${r.registered.length === 1 ? "" : "s"} registered: ${names}.`,
      );
      setChecked(new Set());
      await loadServers();
      await browse(selected, username || undefined, password || undefined);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Register failed", true);
    } finally {
      setRegistering(false);
    }
  };

  return {
    servers,
    dockerAvailable,
    selectedKey,
    dbs,
    projects,
    serverSearch,
    setServerSearch,
    dbSearch,
    setDbSearch,
    checked,
    setChecked,
    projectId,
    setProjectId,
    browsing,
    authRequired,
    browseErr,
    username,
    setUsername,
    password,
    setPassword,
    registering,
    loadServers,
    selected,
    browse,
    pick,
    connectAndBrowse,
    toggle,
    engineFilter,
    setEngineFilter,
    engines,
    filteredServers,
    filteredDbs,
    tickable,
    allTicked,
    selectNonSystem,
    register,
  };
}

export type DatabaseController = ReturnType<typeof useDatabases>;

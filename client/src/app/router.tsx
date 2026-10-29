import { useEffect, useState } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { AppShell } from "../components/chrome/AppShell";
import { DashboardPage } from "../features/overview/DashboardPage";
import { FleetPage } from "../features/overview/FleetPage";
import { DatabasesPage } from "../features/databases/DatabasesPage";
import { ProjectDetailsPage } from "../features/projects/ProjectDetailsPage";
import { TelemetryPage } from "../features/telemetry/TelemetryPage";
import { ServersPage } from "../features/servers/ServersPage";
import { ServerDetailPage } from "../features/servers/ServerDetailPage";
import { AlertsPage } from "../features/alerts/AlertsPage";
import { AlertRulesPage } from "../features/alerts/AlertRulesPage";
import { HealthChecksPage } from "../features/health/HealthChecksPage";
import { MonitoringPage } from "../features/monitoring/MonitoringPage";
import { AuditLogPage } from "../features/audit/AuditLogPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { LoginPage } from "../features/auth/LoginPage";
import { NotFoundPage } from "../features/core/NotFoundPage";
import { useAuth } from "../stores/store";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, checked, check } = useAuth();
  useEffect(() => {
    if (!checked) void check();
  }, [checked, check]);
  if (!checked) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  const [online, setOnline] = useState(true);
  const router = createBrowserRouter(
    [
      {
        path: "/",
        errorElement: <NotFoundPage />,
        children: [
          {
            path: "login",
            element: <LoginPage />,
          },
          {
            path: "",
            element: <AppShell online={online} />,
            children: [
              {
                index: true,
                element: (
                  <Protected>
                    <DashboardPage setOnline={setOnline} />
                  </Protected>
                ),
              },
              {
                path: "fleet",
                element: (
                  <Protected>
                    <FleetPage setOnline={setOnline} />
                  </Protected>
                ),
              },
              {
                path: "projects/:id",
                element: (
                  <Protected>
                    <ProjectDetailsPage setOnline={setOnline} />
                  </Protected>
                ),
              },
              {
                path: "databases",
                element: (
                  <Protected>
                    <DatabasesPage setOnline={setOnline} />
                  </Protected>
                ),
              },
              {
                path: "settings",
                element: (
                  <Protected>
                    <SettingsPage setOnline={setOnline} />
                  </Protected>
                ),
              },
              {
                path: "telemetry",
                element: (
                  <Protected>
                    <TelemetryPage />
                  </Protected>
                ),
              },
              {
                path: "servers",
                element: (
                  <Protected>
                    <ServersPage setOnline={setOnline} />
                  </Protected>
                ),
              },
              {
                path: "servers/:id",
                element: (
                  <Protected>
                    <ServerDetailPage setOnline={setOnline} />
                  </Protected>
                ),
              },
              {
                path: "alerts",
                element: (
                  <Protected>
                    <AlertsPage />
                  </Protected>
                ),
              },
              {
                path: "alert-rules",
                element: (
                  <Protected>
                    <AlertRulesPage />
                  </Protected>
                ),
              },
              {
                path: "health-checks",
                element: (
                  <Protected>
                    <HealthChecksPage />
                  </Protected>
                ),
              },
              {
                path: "audit",
                element: (
                  <Protected>
                    <AuditLogPage />
                  </Protected>
                ),
              },
              {
                path: "monitoring",
                element: (
                  <Protected>
                    <MonitoringPage />
                  </Protected>
                ),
              },
            ],
          },
          {
            path: "*",
            element: <NotFoundPage />,
          },
        ],
      },
    ],
    { basename: "/server-hub" },
  );
  return <RouterProvider router={router} />;
}

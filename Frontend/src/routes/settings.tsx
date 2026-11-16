import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Card, Button, Dot, MonoLabel, Badge, Toggle, Dropdown, MenuItem } from "@/components/ako";
import { fetchSettings, updateSettings } from "@/lib/api";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "AKOA · Settings" },
      {
        name: "description",
        content: "Console, environment and agent policy preferences for AKOA.",
      },
      { property: "og:title", content: "AKOA · Settings" },
      { property: "og:description", content: "Console, environment and agent policy preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SettingsPage() {
  const [autoApprove, setAutoApprove] = useState(false);
  const [requireForecast, setRequireForecast] = useState(true);
  const [notifyRecs, setNotifyRecs] = useState(true);
  const [notifyExec, setNotifyExec] = useState(true);
  const [notifyPolicy, setNotifyPolicy] = useState(true);
  const [namespace, setNamespace] = useState("development");
  const [cluster, setCluster] = useState("minikube");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoadError(null);
        const s = await fetchSettings();
        setAutoApprove(s.autoApprove);
        setRequireForecast(s.requireForecast);
        setNotifyRecs(s.notifyRecommendations);
        setNotifyExec(s.notifyExecution);
        setNotifyPolicy(s.notifyPolicy);
        setNamespace(s.namespace);
        setCluster(s.cluster);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load settings";
        setLoadError(message);
      }
    };
    void run();
  }, []);

  const save = async () => {
    try {
      const s = await updateSettings({
        namespace,
        autoApprove,
        requireForecast,
        notifyRecommendations: notifyRecs,
        notifyExecution: notifyExec,
        notifyPolicy,
      });
      setCluster(s.cluster);
      toast.success("Settings saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save settings";
      toast.error("Settings save failed", { description: message });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">Settings</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Console, environment, and agent policy preferences.
            </p>
            <p className="mt-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Development / Minikube
            </p>
          </div>
          <Button onClick={save}>Save changes</Button>
        </div>

        {loadError ? (
          <Card className="mb-6 border-critical/30 bg-critical/5 p-4">
            <p className="text-sm text-critical">Unable to load settings from backend.</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{loadError}</p>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-foreground">Environment</h2>
              <MonoLabel>Connection</MonoLabel>
            </div>
            <div className="mt-5 divide-y divide-border">
              <div className="flex items-center justify-between gap-4 pb-4">
                <div>
                  <div className="text-sm text-foreground">Namespace</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Scope for telemetry and guarded actions
                  </div>
                </div>
                <Dropdown
                  trigger={
                    <Button variant="secondary" size="sm">
                      <span className="font-mono">{namespace}</span>
                      <ChevronDown size={13} className="text-muted-foreground" />
                    </Button>
                  }
                >
                  {(close) => (
                    <>
                      {["development", "staging", "production"].map((ns) => (
                        <MenuItem
                          key={ns}
                          onClick={() => {
                            setNamespace(ns);
                            close();
                          }}
                        >
                          {ns}
                        </MenuItem>
                      ))}
                    </>
                  )}
                </Dropdown>
              </div>
              <div className="flex items-center justify-between gap-4 pt-4">
                <div>
                  <div className="text-sm text-foreground">Cluster</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Kubernetes context in use</div>
                </div>
                <span className="font-mono text-sm text-foreground">{cluster}</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-4">
                <div>
                  <div className="text-sm text-foreground">Telemetry sources</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Prometheus · Kubernetes API</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-healthy">
                  <Dot className="bg-healthy" />
                  Connected
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-foreground">Agent policy</h2>
              <MonoLabel>Guarded execution</MonoLabel>
            </div>
            <div className="mt-5 divide-y divide-border">
              <div className="flex items-center justify-between gap-4 pb-4">
                <div>
                  <div className="text-sm text-foreground">Auto-approve low-risk actions</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Execute scale-downs below 10% utilization without review
                  </div>
                </div>
                <Toggle checked={autoApprove} onChange={setAutoApprove} label="Auto-approve low-risk actions" />
              </div>
              <div className="flex items-center justify-between gap-4 pt-4">
                <div>
                  <div className="text-sm text-foreground">Require forecast evidence</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Recommendations must include a 60-minute forecast
                  </div>
                </div>
                <Toggle checked={requireForecast} onChange={setRequireForecast} label="Require forecast evidence" />
              </div>
              <div className="flex items-center justify-between gap-4 pt-4">
                <div>
                  <div className="text-sm text-foreground">Max replicas per action</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Upper bound the agent may request in one change
                  </div>
                </div>
                <Badge tone="muted">4</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-foreground">Notifications</h2>
              <MonoLabel>Console alerts</MonoLabel>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                ["Recommendations", "New optimization opportunities", notifyRecs, setNotifyRecs],
                ["Execution results", "Success and failure of executed actions", notifyExec, setNotifyExec],
                ["Policy violations", "Blocked or rejected guarded actions", notifyPolicy, setNotifyPolicy],
              ].map(([title, sub, checked, set]) => (
                <div
                  key={title as string}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-4"
                >
                  <div>
                    <div className="text-sm text-foreground">{title as string}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{sub as string}</div>
                  </div>
                  <Toggle
                    checked={checked as boolean}
                    onChange={set as (v: boolean) => void}
                    label={title as string}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

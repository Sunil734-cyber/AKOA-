import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Card, Button, Dot, MonoLabel, Badge } from "@/components/ako";
import { fetchActions, type BackendActionRecord } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/actions")({
  component: ActionHistory,
  head: () => ({
    meta: [
      { title: "AKOA · Action History" },
      {
        name: "description",
        content: "Auditable infrastructure changes and approval decisions across your Kubernetes environment.",
      },
      { property: "og:title", content: "AKOA · Action History" },
      {
        property: "og:description",
        content: "Auditable infrastructure changes and approval decisions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ActionHistory() {
  const [actions, setActions] = useState<BackendActionRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(actions[0]?.id ?? "");

  useEffect(() => {
    const run = async () => {
      try {
        setLoadError(null);
        const payload = await fetchActions();
        setActions(payload.actions);
        setSelectedId(payload.actions[0]?.id ?? "");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load action history";
        setLoadError(message);
      }
    };
    void run();
  }, []);

  const selected = actions.find((a) => a.id === selectedId) ?? actions[0];

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Action History
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Auditable infrastructure changes and approval decisions.
            </p>
            <p className="mt-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Today · Development / Minikube
            </p>
          </div>
          <Button variant="secondary" onClick={() => toast.success("Audit log exported (CSV)")}>
            <Download size={14} />
            Export audit log
          </Button>
        </div>

        {loadError ? (
          <Card className="mb-6 border-critical/30 bg-critical/5 p-4">
            <p className="text-sm text-critical">Unable to load action history from backend.</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{loadError}</p>
          </Card>
        ) : null}

        {/* table */}
        <Card className="overflow-x-auto px-2 py-2">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Time", "Service", "Action", "Requested by", "Approved by", "Result"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => {
                const isSelected = selected?.id === a.id;
                return (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={cn(
                      "cursor-pointer border-b border-border/60 transition-colors last:border-b-0",
                      isSelected
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <td className="px-4 py-4 font-mono text-muted-foreground">{a.time}</td>
                    <td className="px-4 py-4 font-mono font-semibold text-foreground">{a.service}</td>
                    <td className="px-4 py-4 font-mono text-foreground">{a.action}</td>
                    <td className="px-4 py-4 text-muted-foreground">{a.requestedBy}</td>
                    <td className="px-4 py-4 text-muted-foreground">{a.approvedBy ?? "—"}</td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-sm font-medium",
                          a.result === "Success" ? "text-healthy" : "text-critical",
                        )}
                      >
                        <Dot className={a.result === "Success" ? "bg-healthy" : "bg-critical"} />
                        {a.result}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* detail */}
        {selected ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  <span className="font-mono">{selected.service}</span> · {selected.action}
                </h2>
                <MonoLabel>Selected · {selected.time}</MonoLabel>
              </div>
              <div className="mt-5 divide-y divide-border">
                {[
                  ["What happened", selected.what],
                  ["Why", selected.why],
                  ["Evidence", selected.evidence],
                  ["Approver", selected.approver],
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-3.5 sm:grid-cols-[140px_1fr] sm:gap-4">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-semibold text-foreground">Kubernetes action</h2>
              <div className="mt-4 rounded-lg border border-border bg-background/60 px-4 py-3 font-mono text-xs leading-relaxed">
                <div className="text-muted-foreground">
                  {selected.k8sVerb} {selected.k8sResource}
                </div>
                <div className="mt-1.5 text-primary">{selected.k8sField}</div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-medium",
                    selected.result === "Success" ? "text-healthy" : "text-critical",
                  )}
                >
                  <Dot className={selected.result === "Success" ? "bg-healthy" : "bg-critical"} />
                  {selected.result}
                </span>
                {selected.duration !== "—" ? (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Completed in {selected.duration}
                  </span>
                ) : null}
              </div>
              <div className="mt-4">
                <Badge tone="neutral">
                  <Dot className="bg-muted-foreground" />
                  Audit ID {selected.id}
                </Badge>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}

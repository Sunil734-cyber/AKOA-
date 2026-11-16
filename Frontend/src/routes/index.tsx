import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card, CardHeader, Dot, MonoLabel, Badge, StatusDot } from "@/components/ako";
import { fetchOverview, toService, type BackendOverviewResponse } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Overview,
  head: () => ({
    meta: [
      { title: "AKOA · Infrastructure Overview" },
      {
        name: "description",
        content: "What is happening across your Kubernetes environment — services, telemetry and optimization potential.",
      },
      { property: "og:title", content: "AKOA · Infrastructure Overview" },
      {
        property: "og:description",
        content: "Services, telemetry and optimization potential across your Kubernetes environment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Overview() {
  const [overview, setOverview] = useState<BackendOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await fetchOverview();
        setOverview(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load overview";
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, []);

  const services = useMemo(() => (overview ? overview.services.map(toService) : []), [overview]);

  const stats = useMemo(() => {
    if (!overview) {
      return [
        { label: "Services", value: "-", tone: "text-foreground", note: "Loading" },
        { label: "Running Replicas", value: "-", tone: "text-healthy", note: "Loading" },
        { label: "Average CPU", value: "-", tone: "text-foreground", note: "Loading" },
        { label: "Average Memory", value: "-", tone: "text-foreground", note: "Loading" },
        { label: "Service Health", value: "-", tone: "text-primary", note: "Loading" },
      ];
    }

    const healthyCount = Object.entries(overview.summary.by_status)
      .filter(([k]) => k === "Healthy")
      .reduce((acc, [, v]) => acc + v, 0);

    return [
      {
        label: "Services",
        value: String(overview.summary.services),
        tone: "text-foreground",
        note: "All monitored",
      },
      {
        label: "Running Replicas",
        value: String(Math.round(overview.summary.running_replicas)),
        tone: "text-healthy",
        note: "Desired state matched",
      },
      {
        label: "Average CPU",
        value:
          overview.summary.cpu_pct_of_request === null
            ? "N/A"
            : `${Math.round(overview.summary.cpu_pct_of_request)}%`,
        tone: "text-foreground",
        note: "% of requested CPU",
      },
      {
        label: "Average Memory",
        value:
          overview.summary.mem_pct_of_request === null
            ? "N/A"
            : `${Math.round(overview.summary.mem_pct_of_request)}%`,
        tone: "text-foreground",
        note: "% of requested memory",
      },
      {
        label: "Service Health",
        value: `${healthyCount}/${overview.summary.services}`,
        tone: "text-primary",
        note: "Healthy services",
      },
    ];
  }, [overview]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Infrastructure Overview
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              What is happening across your Kubernetes environment.
            </p>
            <p className="mt-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              {overview?.environment ?? "Loading environment"}
            </p>
          </div>
          <Badge tone="healthy">
            <Dot className="bg-healthy" />
            {isLoading ? "Loading" : "Operational"}
          </Badge>
        </div>

        {loadError ? (
          <Card className="mb-6 border-critical/30 bg-critical/5 p-4">
            <p className="text-sm text-critical">Unable to load overview from backend.</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{loadError}</p>
          </Card>
        ) : null}

        {/* stat cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {stats.map((s) => (
            <Card key={s.label} className="p-5">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className={`mt-3 text-4xl font-semibold tracking-tight ${s.tone}`}>{s.value}</div>
              <div className="mt-3 text-xs text-muted-foreground">{s.note}</div>
            </Card>
          ))}
        </div>

        {/* services table */}
        <Card className="mt-6">
          <CardHeader
            title="Services"
            right={
              <MonoLabel className="mt-1">
                Live telemetry · {overview?.updated_at ? new Date(overview.updated_at).toLocaleString() : "Loading"}
              </MonoLabel>
            }
          />
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Service", "Status", "Replicas", "CPU", "Memory", "Requests/s", "Latency", "Errors"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.name} className="border-b border-border/60 last:border-b-0">
                    <td className="px-4 py-4 font-mono text-sm font-semibold text-foreground">{s.name}</td>
                    <td className="px-4 py-4">
                      <StatusDot status={s.status} />
                    </td>
                    <td className="px-4 py-4 font-mono text-muted-foreground">
                      {s.ready} / {s.desired}
                    </td>
                    <td className="px-4 py-4 font-mono text-muted-foreground">{s.cpu}%</td>
                    <td className="px-4 py-4 font-mono text-muted-foreground">{s.memory}%</td>
                    <td className="px-4 py-4 font-mono text-muted-foreground">{s.reqRate}</td>
                    <td className="px-4 py-4 font-mono text-muted-foreground">{s.latency}</td>
                    <td className="px-4 py-4 font-mono text-muted-foreground">{s.errRate}</td>
                  </tr>
                ))}
                {!isLoading && services.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No services returned by API.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        {/* activity + sources */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-foreground">Recent activity</h2>
            <div className="mt-4 space-y-3">
              {services.slice(0, 3).map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-foreground">
                    {s.name} is {s.status.toLowerCase()} with {s.ready}/{s.desired} replicas
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">live</span>
                </div>
              ))}
              {!isLoading && services.length === 0 ? (
                <div className="text-sm text-muted-foreground">No activity available from API data.</div>
              ) : null}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-foreground">Telemetry sources</h2>
            <div className="mt-4 space-y-3">
              {(overview?.sources ?? []).map((src) => (
                <div key={src.name} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-foreground">{src.name}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      src.status === "connected"
                        ? "text-healthy"
                        : src.status === "degraded"
                          ? "text-warning"
                          : "text-critical"
                    }`}
                  >
                    <Dot
                      className={
                        src.status === "connected"
                          ? "bg-healthy"
                          : src.status === "degraded"
                            ? "bg-warning"
                            : "bg-critical"
                      }
                    />
                    {src.status}
                  </span>
                </div>
              ))}
              {!overview?.sources?.length ? (
                <div className="text-sm text-muted-foreground">No telemetry sources returned yet.</div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ArrowRight, Check, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import {
  Card,
  CardHeader,
  Button,
  Dot,
  MonoLabel,
  Badge,
  StatusDot,
  Dropdown,
  MenuItem,
  Tabs,
} from "@/components/ako";
import { TelemetryChart, ChartLegend, type ChartLimit } from "@/components/chart";
import { ConfirmChangeModal } from "@/components/confirm-change";
import {
  METRICS,
  RANGES,
  actionsFor,
  rangeLabel,
  type MetricKey,
  type RangeKey,
  type ScaleAction,
} from "@/lib/akoa";
import {
  fetchServiceDetail,
  fetchServiceMetrics,
  formatMiBToRequest,
  formatMillicoresToRequest,
  mapMetricsToTelemetry,
  toService,
  type BackendServiceDetail,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/services/$name")({
  component: ServiceDetail,
  head: () => ({
    meta: [
      { title: "AKOA · Service detail" },
      {
        name: "description",
        content: "Live and forecast telemetry, dependencies and guarded actions for a Kubernetes service.",
      },
      { property: "og:title", content: "AKOA · Service detail" },
      {
        property: "og:description",
        content: "Telemetry, dependencies and guarded actions for a Kubernetes service.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const TABS = [
  "Overview",
  "Resource utilization",
  "Request rate",
  "Latency",
  "Replica history",
  "Events",
  "Dependencies",
  "AKOA analysis",
  "Actions",
];

type SeriesByMetric = Record<MetricKey, ReturnType<typeof mapMetricsToTelemetry>>;

function emptySeriesByMetric(): SeriesByMetric {
  const empty = {
    labels: [],
    values: [],
    forecast: [],
    min: 0,
    avg: 0,
    max: 0,
    current: 0,
  };
  return {
    cpu: empty,
    memory: empty,
    reqRate: empty,
    latency: empty,
    error: empty,
    replicas: empty,
  };
}

function ChartCard({
  metric,
  series,
  className,
}: {
  metric: MetricKey;
  series: ReturnType<typeof mapMetricsToTelemetry>;
  className?: string;
}) {
  const meta = METRICS[metric];

  const limits: ChartLimit[] | undefined =
    metric === "cpu"
      ? [
          { v: 100, label: "Limit 100%", color: "var(--color-critical)" },
          { v: 50, label: "Request 50%", color: "var(--color-warning)" },
        ]
      : undefined;

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">{meta.label}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Min {meta.format(series.min)} · avg {meta.format(series.avg)} · max {meta.format(series.max)}
          </p>
          <div className="mt-2">
            <ChartLegend color={meta.color} showForecast={false} />
          </div>
        </div>
        <span
          className="font-mono text-2xl font-semibold"
          style={{ color: metric === "replicas" ? "var(--color-foreground)" : meta.color }}
        >
          {meta.format(series.current)}
        </span>
      </div>
      <TelemetryChart series={series} meta={meta} limits={limits} className="mt-4" />
    </Card>
  );
}

function ServiceDetail() {
  const { name } = Route.useParams();
  const [tab, setTab] = useState("Overview");
  const [range, setRange] = useState<RangeKey>("24h");
  const [pendingAction, setPendingAction] = useState<ScaleAction | null>(null);
  const [detail, setDetail] = useState<BackendServiceDetail | null>(null);
  const [seriesByMetric, setSeriesByMetric] = useState<SeriesByMetric>(emptySeriesByMetric());
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoadingDetail(true);
        setLoadError(null);
        const d = await fetchServiceDetail(name);
        setDetail(d);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load service detail";
        setLoadError(message);
      } finally {
        setIsLoadingDetail(false);
      }
    };
    void run();
  }, [name]);

  useEffect(() => {
    const run = async () => {
      if (!name) {
        return;
      }
      try {
        setIsLoadingMetrics(true);
        setLoadError(null);
        const payload = await fetchServiceMetrics(name, range);
        setSeriesByMetric({
          cpu: mapMetricsToTelemetry("cpu", payload),
          memory: mapMetricsToTelemetry("memory", payload),
          reqRate: mapMetricsToTelemetry("reqRate", payload),
          latency: mapMetricsToTelemetry("latency", payload),
          error: mapMetricsToTelemetry("error", payload),
          replicas: mapMetricsToTelemetry("replicas", payload),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load service metrics";
        setLoadError(message);
      } finally {
        setIsLoadingMetrics(false);
      }
    };
    void run();
  }, [name, range]);

  const svc = useMemo(() => (detail ? toService(detail) : null), [detail]);
  const actions = useMemo(() => (svc ? actionsFor(svc) : []), [svc]);

  if (!isLoadingDetail && !svc) {
    return (
      <AppLayout>
        <Card className="mx-auto max-w-lg p-10 text-center">
          <h1 className="text-xl font-semibold text-foreground">Service not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">No service named {name} is monitored in this environment.</p>
          <Link to="/services" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft size={14} /> Back to services
          </Link>
        </Card>
      </AppLayout>
    );
  }

  const showChart = (m: MetricKey) => {
    switch (tab) {
      case "Overview":
        return true;
      case "Resource utilization":
        return m === "cpu" || m === "memory";
      case "Request rate":
        return m === "reqRate";
      case "Latency":
        return m === "latency";
      case "Replica history":
        return m === "replicas";
      default:
        return false;
    }
  };

  const showBody = tab === "Overview";

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-3xl font-bold tracking-tight text-foreground lg:text-4xl">{svc?.name ?? name}</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">Deployment · default namespace · Cluster minikube</p>
            <p className="mt-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Live telemetry · {isLoadingMetrics ? "refreshing" : "from backend"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot status={svc?.status ?? "Unknown"} />
            <Dropdown
              align="right"
              trigger={
                <Button>
                  Actions
                  <ChevronDown size={14} />
                </Button>
              }
            >
              {(close) => (
                <>
                  <MenuLabel2>Guarded actions</MenuLabel2>
                  {actions.map((a) => (
                    <MenuItem
                      key={a.key}
                      onClick={() => {
                        setPendingAction(a);
                        close();
                      }}
                    >
                      <span>{a.label}</span>
                      <Badge tone={a.risk === "LOW" ? "healthy" : a.risk === "MEDIUM" ? "warning" : "critical"}>
                        {a.risk}
                      </Badge>
                    </MenuItem>
                  ))}
                </>
              )}
            </Dropdown>
          </div>
        </div>

        {loadError ? (
          <Card className="mb-6 border-critical/30 bg-critical/5 p-4">
            <p className="text-sm text-critical">Unable to load service data from backend.</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{loadError}</p>
          </Card>
        ) : null}

        <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-6" />

        <Card className="flex flex-wrap items-center gap-x-10 gap-y-4 px-6 py-4">
          {[
            ["Desired / ready", `${svc?.desired ?? 0} / ${svc?.ready ?? 0}`],
            ["CPU request", formatMillicoresToRequest(detail?.cpu_request_m)],
            ["Memory request", formatMiBToRequest(detail?.mem_request_mib)],
            ["Image", svc?.image ?? "Unknown"],
            ["Uptime", svc?.uptime ?? "Unknown"],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 font-mono text-sm font-semibold text-foreground">{value}</div>
            </div>
          ))}
          <div className="ml-auto">
            <Badge tone="healthy">
              <Dot className="bg-healthy" />
              {svc?.status ?? "Unknown"}
            </Badge>
          </div>
        </Card>

        {tab === "Dependencies" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {(["upstream", "downstream"] as const).map((dir) => (
              <Card key={dir} className="p-5">
                <h3 className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">{dir}</h3>
                <div className="mt-4 space-y-3">
                  {(detail?.dependencies?.[dir] ?? []).map((dep) => (
                    <div key={dep} className="flex items-center justify-between">
                      <span className="font-mono text-sm text-foreground">{dep}</span>
                      <StatusDot status="Healthy" className="text-[13px]" />
                    </div>
                  ))}
                  {(detail?.dependencies?.[dir] ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No {dir} dependencies configured.</div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {tab === "Events" ? (
          <Card className="mt-6">
            <CardHeader title="Pod events" meta="Live pod snapshot" />
            <div className="overflow-x-auto px-2 pb-2">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Pod", "Ready", "CPU (m)", "Memory (MiB)", "Restarts (1h)"].map((h) => (
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
                  {(detail?.pods ?? []).map((pod) => (
                    <tr key={pod.name} className="border-b border-border/60 last:border-b-0">
                      <td className="px-4 py-3.5 font-mono text-muted-foreground">{pod.name}</td>
                      <td className="px-4 py-3.5 font-mono text-foreground">{pod.ready ? "Yes" : "No"}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{pod.cpu_m?.toFixed(1) ?? "N/A"}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{pod.mem_mib?.toFixed(1) ?? "N/A"}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{pod.restarts_1h ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {tab === "AKOA analysis" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <ObservedRangeCard metricKey="cpu" series={seriesByMetric.cpu} range={range} />
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <h3 className="text-[15px] font-semibold text-foreground">AKOA interpretation</h3>
                <MonoLabel>Analysis</MonoLabel>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {detail?.status_reasons?.length
                  ? detail.status_reasons.join(". ")
                  : "No analysis reasons were returned for this service."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Evidence grounded", "Policy checked", "Live telemetry"].map((chip) => (
                  <Badge key={chip} tone="info">
                    <Check size={11} />
                    {chip}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {tab === "Actions" ? (
          <div className="mt-6 space-y-4">
            {actions.map((a) => (
              <Card key={a.key} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-mono text-sm font-semibold text-foreground">{a.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={a.risk === "LOW" ? "healthy" : a.risk === "MEDIUM" ? "warning" : "critical"}>
                    <Dot />
                    Risk {a.risk}
                  </Badge>
                  <Button variant="secondary" onClick={() => setPendingAction(a)}>
                    Review <ArrowRight size={13} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {showBody || showChart("cpu") ? (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-foreground">Telemetry</h2>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                {RANGES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    title={rangeLabel(r.key)}
                    className={cn(
                      "rounded-md px-3 py-1.5 font-mono text-xs transition-colors",
                      range === r.key
                        ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              {(["cpu", "memory", "reqRate", "latency", "error", "replicas"] as MetricKey[])
                .filter((m) => showChart(m))
                .map((m) => (
                  <ChartCard key={m} metric={m} series={seriesByMetric[m]} />
                ))}
            </div>
          </>
        ) : null}

        <ConfirmChangeModal
          open={pendingAction !== null}
          onClose={() => setPendingAction(null)}
          service={svc?.name ?? name}
          from={pendingAction?.from ?? 0}
          to={pendingAction?.to ?? 0}
          reason={pendingAction?.reason ?? ""}
          forecast={pendingAction?.forecast ?? ""}
          impact={pendingAction?.impact ?? ""}
          risk={pendingAction?.risk ?? "LOW"}
          note={pendingAction?.note ?? ""}
        />
      </div>
    </AppLayout>
  );
}

function MenuLabel2({ children }: { children: React.ReactNode }) {
  return <div className="px-3 pt-2 pb-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{children}</div>;
}

function ObservedRangeCard({
  metricKey,
  series,
  range,
}: {
  metricKey: MetricKey;
  series: ReturnType<typeof mapMetricsToTelemetry>;
  range: RangeKey;
}) {
  const meta = METRICS[metricKey];
  return (
    <Card className="p-5">
      <h3 className="text-[15px] font-semibold text-foreground">Observed range</h3>
      <div className="mt-5 grid grid-cols-3 gap-4">
        {[
          ["Min", series.min],
          ["Average", series.avg],
          ["Max", series.max],
        ].map(([label, value]) => (
          <div key={label as string}>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-foreground">{meta.format(value as number)}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <ChevronRight size={13} className="text-primary" />
        Window {rangeLabel(range)} · Prometheus · Kubernetes API
      </div>
    </Card>
  );
}

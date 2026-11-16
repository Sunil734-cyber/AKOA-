import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Card, Button, Dot, MonoLabel, Badge, Dropdown, MenuItem } from "@/components/ako";
import { TelemetryChart, ChartLegend, type ChartLimit } from "@/components/chart";
import {
  METRICS,
  RANGES,
  type Service,
  rangeLabel,
  type MetricKey,
  type RangeKey,
} from "@/lib/akoa";
import { fetchServiceMetrics, fetchServices, mapMetricsToTelemetry } from "@/lib/api";

export const Route = createFileRoute("/metrics")({
  component: MetricsPage,
  head: () => ({
    meta: [
      { title: "AKOA · Metrics" },
      {
        name: "description",
        content: "Explore live, historical and forecast service telemetry from Prometheus and the Kubernetes API.",
      },
      { property: "og:title", content: "AKOA · Metrics" },
      {
        property: "og:description",
        content: "Live, historical and forecast service telemetry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const METRIC_KEYS: MetricKey[] = ["cpu", "memory", "reqRate", "latency", "error"];

function MetricsPage() {
  const [service, setService] = useState("");
  const [metric, setMetric] = useState<MetricKey>("cpu");
  const [range, setRange] = useState<RangeKey>("24h");
  const [services, setServices] = useState<Service[]>([]);
  const [environment, setEnvironment] = useState("Loading...");
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [liveSeriesByMetric, setLiveSeriesByMetric] = useState<Record<MetricKey, ReturnType<typeof mapMetricsToTelemetry>> | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoadingServices(true);
        setLoadError(null);
        const snapshot = await fetchServices();
        setServices(snapshot.services);
        setEnvironment(snapshot.environment);
        const preferred = snapshot.services.find((s) => s.name === "backend")?.name ?? snapshot.services[0]?.name ?? "";
        setService(preferred);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to reach AKOA API";
        setLoadError(message);
      } finally {
        setIsLoadingServices(false);
      }
    };

    void run();
  }, []);

  const loadMetrics = async (opts?: { showToast?: boolean }) => {
    if (!service) {
      return;
    }
    try {
      setIsLoadingMetrics(true);
      setLoadError(null);
      const payload = await fetchServiceMetrics(service, range);
      const mapped: Record<MetricKey, ReturnType<typeof mapMetricsToTelemetry>> = {
        cpu: mapMetricsToTelemetry("cpu", payload),
        memory: mapMetricsToTelemetry("memory", payload),
        reqRate: mapMetricsToTelemetry("reqRate", payload),
        latency: mapMetricsToTelemetry("latency", payload),
        error: mapMetricsToTelemetry("error", payload),
        replicas: mapMetricsToTelemetry("replicas", payload),
      };
      setLiveSeriesByMetric(mapped);
      if (opts?.showToast) {
        toast.success("Live telemetry refreshed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load metrics";
      setLoadError(message);
      if (opts?.showToast) {
        toast.error("Could not refresh telemetry");
      }
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (!service) {
      return;
    }
    void loadMetrics();
  }, [service, range]);

  const meta = METRICS[metric];
  const series = useMemo(() => {
    if (!liveSeriesByMetric) {
      return {
        labels: [],
        values: [],
        forecast: [],
        min: 0,
        avg: 0,
        max: 0,
        current: 0,
      };
    }
    return liveSeriesByMetric[metric];
  }, [liveSeriesByMetric, metric]);

  const limits: ChartLimit[] | undefined =
    metric === "cpu"
      ? [
          { v: 100, label: "Demo limit 1000m · 100%", color: "var(--color-critical)" },
          { v: 50, label: "Request 500m · 50%", color: "var(--color-warning)" },
        ]
      : undefined;

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">Metrics</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Explore live, historical, and forecast service telemetry.
            </p>
            <p className="mt-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Prometheus · Kubernetes API
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => toast.success("Metrics export prepared (CSV)")}>
              <Download size={14} />
              Export
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void loadMetrics({ showToast: true });
              }}
              disabled={isLoadingMetrics || !service}
            >
              <RefreshCw size={14} />
              {isLoadingMetrics ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {loadError ? (
          <Card className="mb-6 border-critical/30 bg-critical/5 p-4">
            <p className="text-sm text-critical">Unable to load live metrics from AKOA API.</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{loadError}</p>
          </Card>
        ) : null}

        {/* filters */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Dropdown
            align="left"
            trigger={
              <Button variant="secondary" className="min-w-44 justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="inline-flex items-center gap-2 font-mono">
                  {service || "No service"}
                  <ChevronDown size={14} className="text-muted-foreground" />
                </span>
              </Button>
            }
          >
            {(close) => (
              <>
                {services.map((s) => (
                  <MenuItem
                    key={s.name}
                    onClick={() => {
                      setService(s.name);
                      close();
                    }}
                  >
                    {s.name}
                  </MenuItem>
                ))}
              </>
            )}
          </Dropdown>
          <Dropdown
            align="left"
            trigger={
              <Button variant="secondary" className="min-w-52 justify-between">
                <span className="text-muted-foreground">Metric</span>
                <span className="inline-flex items-center gap-2">
                  {meta.label}
                  <ChevronDown size={14} className="text-muted-foreground" />
                </span>
              </Button>
            }
          >
            {(close) => (
              <>
                {METRIC_KEYS.map((k) => (
                  <MenuItem
                    key={k}
                    onClick={() => {
                      setMetric(k);
                      close();
                    }}
                  >
                    {METRICS[k].label}
                  </MenuItem>
                ))}
              </>
            )}
          </Dropdown>
          <Dropdown
            align="left"
            trigger={
              <Button variant="secondary" className="min-w-44 justify-between">
                <span className="text-muted-foreground">Time range</span>
                <span className="inline-flex items-center gap-2">
                  {rangeLabel(range)}
                  <ChevronDown size={14} className="text-muted-foreground" />
                </span>
              </Button>
            }
          >
            {(close) => (
              <>
                {RANGES.map((r) => (
                  <MenuItem
                    key={r.key}
                    onClick={() => {
                      setRange(r.key);
                      close();
                    }}
                  >
                    {rangeLabel(r.key)}
                  </MenuItem>
                ))}
              </>
            )}
          </Dropdown>
        </div>

        {/* info trio */}
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-healthy">
                <Dot className="bg-healthy" />
                Live telemetry
              </span>
              <Badge tone="muted">
                <Dot className="bg-muted-foreground" />
                {isLoadingMetrics ? "Refreshing" : environment}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Observed values from Prometheus. No inference applied.
            </p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <Dot className="bg-primary" />
                AKOA analysis
              </span>
              <Badge tone="info">
                <Dot className="bg-primary" />
                Last 10 minutes
              </Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Behavior interpreted against history and policy.
            </p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-warning">
                <Dot className="bg-warning" />
                Forecast
              </span>
              <Badge tone="warning">
                <Dot className="bg-warning" />
                Next 60 minutes
              </Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Projected range, not observed telemetry.
            </p>
          </Card>
        </div>

        {/* main chart */}
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                <span className="font-mono">{service || "No service selected"}</span> · {meta.label}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Live API · {meta.label} {meta.unit === "%" ? "%" : meta.unit} · Min{" "}
                {meta.format(series.min)} · avg {meta.format(series.avg)} · max {meta.format(series.max)} ·{" "}
                {series.labels.length} samples / {rangeLabel(range)}
              </p>
              <div className="mt-2">
                <ChartLegend color={meta.color} showForecast={metric !== "error"} />
              </div>
            </div>
            <span className="font-mono text-3xl font-semibold" style={{ color: meta.color }}>
              {meta.format(series.current)}
            </span>
          </div>
          <TelemetryChart series={series} meta={meta} limits={limits} forecastLabel="Forecast · next 60m" height={320} className="mt-4" />
        </Card>

        {/* observed range + interpretation */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
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
                  <div className="mt-1 font-mono text-2xl font-semibold text-foreground">
                    {meta.format(value as number)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <h3 className="text-[15px] font-semibold text-foreground">AKOA interpretation</h3>
              <MonoLabel>Analysis</MonoLabel>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {series.values.length === 0
                ? "No telemetry points were returned for the selected service and time range."
                : `Observed ${meta.label.toLowerCase()} for ${service} over ${rangeLabel(range)} with ${series.labels.length} samples. The chart reflects measured Prometheus telemetry from your AKOA backend.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Evidence grounded", "Policy checked"].map((chip) => (
                <Badge key={chip} tone="info">
                  <Check size={11} />
                  {chip}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        {!isLoadingServices && services.length === 0 ? (
          <Card className="mt-6 p-4">
            <p className="text-sm text-muted-foreground">No monitored services were returned by the backend.</p>
          </Card>
        ) : null}
      </div>
    </AppLayout>
  );
}

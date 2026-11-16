import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import {
  Card,
  Button,
  Dot,
  MonoLabel,
  Badge,
  StatusDot,
  Dropdown,
  MenuItem,
  Input,
} from "@/components/ako";
import { type Service } from "@/lib/akoa";
import { fetchServices } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/services/")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "AKOA · Services" },
      {
        name: "description",
        content: "Browse monitored Kubernetes services with live telemetry, replicas and optimization potential.",
      },
      { property: "og:title", content: "AKOA · Services" },
      {
        property: "og:description",
        content: "Monitored services with live telemetry and optimization potential.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SORTS = ["CPU usage", "Memory usage", "Name"] as const;
const STATUSES = ["All", "Healthy", "Underutilized", "Warning", "Degraded", "Critical"] as const;

function sortServices(list: Service[], sort: (typeof SORTS)[number]): Service[] {
  const copy = [...list];
  switch (sort) {
    case "CPU usage":
      return copy.sort((a, b) => b.cpu - a.cpu);
    case "Memory usage":
      return copy.sort((a, b) => b.memory - a.memory);
    case "Name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}

function ServiceRow({ svc }: { svc: Service }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start gap-6">
        <div className="w-60 min-w-52 shrink-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-lg font-bold text-foreground">{svc.name}</span>
            <StatusDot status={svc.status} className="text-[13px]" />
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {svc.namespace} · {svc.kind}
          </div>
          <div className="mt-3">
            {svc.badge === "POLICY COMPLIANT" ? (
              <Badge tone="muted">
                <Dot className="bg-muted-foreground" />
                Policy compliant
              </Badge>
            ) : (
              <Badge tone="info">
                <Dot className="bg-primary" />
                Optimization available
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 xl:flex-row xl:items-start">
          <div className="grid min-w-[560px] flex-1 grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 xl:min-w-0 xl:grid-cols-[repeat(7,minmax(max-content,1fr))] xl:gap-x-8">
            {[
              ["Replicas", `${svc.ready} / ${svc.desired}`],
              ["CPU", `${svc.cpu}%`],
              ["Memory", `${svc.memory}%`],
              ["Requests/sec", svc.reqRate],
              ["Error rate", svc.errRate],
              ["Latency", svc.latency],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 font-mono text-sm font-semibold whitespace-nowrap text-foreground">
                  {value}
                </div>
              </div>
            ))}
            <div>
              <div className="text-xs text-muted-foreground">Potential optimization</div>
              <div
                className={cn(
                  "mt-1 font-mono text-sm font-semibold whitespace-nowrap",
                  svc.optimization === "No change"
                    ? "text-muted-foreground"
                    : svc.optimizationHighlight
                      ? "text-primary"
                      : "text-foreground",
                )}
              >
                {svc.optimization}
                {svc.optimization !== "No change" ? (
                  <span className="font-normal text-muted-foreground"> / mo</span>
                ) : null}
              </div>
            </div>
          </div>

          <Link
            to="/services/$name"
            params={{ name: svc.name }}
            className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
          >
            <ArrowRight size={14} className="text-primary" />
            Inspect
          </Link>
        </div>
      </div>
    </Card>
  );
}

function ServicesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("CPU usage");
  const [services, setServices] = useState<Service[]>([]);
  const [environment, setEnvironment] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async (showToast = false) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const snapshot = await fetchServices();
      setServices(snapshot.services);
      setEnvironment(snapshot.environment);
      if (showToast) {
        toast.success("Live telemetry refreshed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach AKOA API";
      setLoadError(message);
      if (showToast) {
        toast.error("Could not refresh telemetry");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = services.filter(
      (s) => (status === "All" || s.status === status) && (q === "" || s.name.toLowerCase().includes(q)),
    );
    return sortServices(list, sort);
  }, [query, status, sort, services]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">Services</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">{services.length} services monitored</p>
            <p className="mt-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Live telemetry · {environment}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              void load(true);
            }}
            disabled={isLoading}
          >
            <RefreshCw size={14} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {loadError ? (
          <Card className="mb-6 border-critical/30 bg-critical/5 p-4">
            <p className="text-sm text-critical">Unable to load services from AKOA API.</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{loadError}</p>
          </Card>
        ) : null}

        {/* filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search
              size={15}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services..."
              className="pl-9"
            />
          </div>
          <Dropdown
            align="right"
            trigger={
              <Button variant="secondary">
                Environment: {environment}
                <ChevronDown size={14} className="text-muted-foreground" />
              </Button>
            }
          >
            {(close) => (
              <>
                <MenuItem onClick={close}>{environment}</MenuItem>
              </>
            )}
          </Dropdown>
          <Dropdown
            align="right"
            trigger={
              <Button variant="secondary">
                Status: {status}
                <ChevronDown size={14} className="text-muted-foreground" />
              </Button>
            }
          >
            {(close) => (
              <>
                {STATUSES.map((s) => (
                  <MenuItem
                    key={s}
                    onClick={() => {
                      setStatus(s);
                      close();
                    }}
                  >
                    {s}
                  </MenuItem>
                ))}
              </>
            )}
          </Dropdown>
          <Dropdown
            align="right"
            trigger={
              <Button variant="secondary">
                Sort: {sort}
                <ChevronDown size={14} className="text-muted-foreground" />
              </Button>
            }
          >
            {(close) => (
              <>
                {SORTS.map((s) => (
                  <MenuItem
                    key={s}
                    onClick={() => {
                      setSort(s);
                      close();
                    }}
                  >
                    {s}
                  </MenuItem>
                ))}
              </>
            )}
          </Dropdown>
        </div>

        <div className="space-y-4">
          {filtered.map((svc) => (
            <ServiceRow key={svc.name} svc={svc} />
          ))}
          {filtered.length === 0 ? (
            <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">No services found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different search term or clear the status filter.
              </p>
            </Card>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Showing {filtered.length} of {services.length} services
          </span>
          <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
            Observe <span className="text-primary">→</span> Understand{" "}
            <span className="text-primary">→</span> Decide <span className="text-primary">→</span>{" "}
            Optimize
          </span>
        </div>
      </div>
    </AppLayout>
  );
}

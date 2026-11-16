import type { MetricKey, RangeKey, Service, ServiceStatus, TelemetrySeries } from "@/lib/akoa";

const API_BASE_URL =
  (import.meta.env["VITE_AKOA_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8100";

console.log("API Base URL:", API_BASE_URL);

interface BackendPoint {
  t: number;
  v: number;
}

interface BackendSeries {
  unit: string;
  points: BackendPoint[];
  stats: {
    min: number | null;
    avg: number | null;
    max: number | null;
    last: number | null;
  };
}

interface BackendServiceSummary {
  name: string;
  status: ServiceStatus;
  replicas_desired: number | null;
  replicas_ready: number | null;
  cpu_pct: number | null;
  cpu_limit_pct: number | null;
  mem_pct: number | null;
  req_rate: number | null;
  error_rate: number | null;
  latency_ms: number | null;
  image: string | null;
  uptime_seconds: number | null;
  cpu_request_m?: number | null;
  mem_request_mib?: number | null;
  cpu_limit_m?: number | null;
}

export interface BackendServiceDetail extends BackendServiceSummary {
  status_reasons: string[];
  pods: Array<{
    name: string;
    ready: boolean | null;
    cpu_m: number | null;
    mem_mib: number | null;
    restarts_total: number | null;
    restarts_1h: number | null;
    uptime_seconds: number | null;
    image: string | null;
  }>;
  dependencies: {
    upstream: string[];
    downstream: string[];
  };
  analysis_window: {
    minutes: number;
    cpu_m_avg: number | null;
    cpu_pct_avg: number | null;
    req_rate_avg: number | null;
  };
}

interface BackendServicesResponse {
  environment: string;
  updated_at: string;
  services: BackendServiceSummary[];
}

export interface BackendOverviewResponse {
  environment: string;
  updated_at: string;
  summary: {
    services: number;
    running_replicas: number;
    desired_replicas: number;
    cpu_used_m: number;
    cpu_requested_m: number;
    cpu_pct_of_request: number | null;
    mem_used_mib: number;
    mem_requested_mib: number;
    mem_pct_of_request: number | null;
    by_status: Record<string, number>;
  };
  services: BackendServiceSummary[];
  sources: Array<{
    name: string;
    status: "connected" | "degraded" | "unreachable";
    last_success: string | null;
  }>;
}

export interface BackendMetricsResponse {
  service: string;
  range: RangeKey;
  step_seconds: number;
  start: number;
  end: number;
  available: boolean;
  missing: string[];
  series: Record<string, BackendSeries>;
}

export interface BackendCostsResponse {
  updated_at: string;
  usage_window: "10m" | "1h" | "6h" | "24h";
  assumptions: {
    profile: string;
    provider: string;
    description: string;
    currency: "INR" | "USD";
    vcpu_hour: number;
    gib_hour: number;
    hours_per_month: number;
    simulation_multiplier: number;
    billing_basis: "requested";
    fx: {
      usd_to_inr: number;
      as_of: string;
      source: string;
    } | null;
    price_source: string;
    price_verified_on: string;
    notes: string[];
    disclaimer: string;
  };
  services: Array<{
    name: string;
    available: boolean;
    replicas: number | null;
    cpu_request_m_per_replica: number | null;
    mem_request_mib_per_replica: number | null;
    cost_per_replica_monthly: number | null;
    allocated_monthly: number | null;
    used_monthly: number | null;
    unused_monthly: number | null;
    unused_pct: number | null;
    avg_cpu_m: number | null;
    avg_mem_mib: number | null;
  }>;
  totals: {
    allocated_monthly: number;
    used_monthly: number;
    unused_monthly: number;
    unused_pct: number | null;
  };
}

export interface BackendCostEstimateResponse {
  service: string;
  replicas_current: number;
  replicas_new: number;
  cost_per_replica_monthly: number;
  monthly_current: number;
  monthly_new: number;
  monthly_delta: number;
  pct_change: number | null;
}

export interface BackendActionRecord {
  id: string;
  time: string;
  service: string;
  action: string;
  requestedBy: string;
  approvedBy: string | null;
  result: "Success" | "Rejected";
  what: string;
  why: string;
  evidence: string;
  approver: string;
  k8sVerb: string;
  k8sResource: string;
  k8sField: string;
  duration: string;
}

export interface BackendActionsResponse {
  updated_at: string;
  actions: BackendActionRecord[];
}

export interface BackendActionCreate {
  service: string;
  action: string;
  requestedBy: string;
  approvedBy: string | null;
  result: "Success" | "Rejected";
  what: string;
  why: string;
  evidence: string;
  approver: string;
  k8sVerb: string;
  k8sResource: string;
  k8sField: string;
  duration: string;
}

export interface BackendProfile {
  name: string;
  email: string;
  company: string;
  role: string;
  sso: "Enabled" | "Disabled";
  lastSignIn: string;
  permissions: string[];
}

export interface BackendProfileUpdate {
  name: string;
  email: string;
  company: string;
  role: string;
}

export interface BackendSettings {
  namespace: string;
  cluster: string;
  autoApprove: boolean;
  requireForecast: boolean;
  notifyRecommendations: boolean;
  notifyExecution: boolean;
  notifyPolicy: boolean;
}

export interface BackendSettingsUpdate {
  namespace: string;
  autoApprove: boolean;
  requireForecast: boolean;
  notifyRecommendations: boolean;
  notifyExecution: boolean;
  notifyPolicy: boolean;
}

export interface BackendCopilotResponse {
  service: string;
  headline: string;
  metrics: [string, string][];
  close: string;
}

export interface BackendLoginResponse {
  user: string;
  token: string;
}

type MetricsSeriesKeyMap = Record<MetricKey, string>;

const METRICS_KEY_MAP: MetricsSeriesKeyMap = {
  cpu: "cpu_m",
  memory: "mem_mib",
  reqRate: "req_rate",
  latency: "latency_ms",
  error: "error_rate",
  replicas: "replicas",
};

function toUptimeText(seconds: number | null): string {
  if (!seconds || seconds <= 0) {
    return "Unknown";
  }
  const totalHours = Math.floor(seconds / 3600);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days}d ${hours}h`;
}

function toNum(value: number | null | undefined, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function formatReqRate(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }
  if (value >= 10) {
    return `${Math.round(value)} req/s`;
  }
  return `${value.toFixed(1)} req/s`;
}

function formatLatency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }
  return `${Math.round(value)} ms`;
}

function formatErrorRate(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }
  return `${(value * 100).toFixed(1)}%`;
}

function buildService(summary: BackendServiceSummary): Service {
  const desired = Math.max(0, Math.round(toNum(summary.replicas_desired, 0)));
  const ready = Math.max(0, Math.round(toNum(summary.replicas_ready, 0)));
  const cpuPct = Math.round(toNum(summary.cpu_limit_pct, summary.cpu_pct ?? 0));
  const memPct = Math.round(toNum(summary.mem_pct, 0));

  return {
    name: summary.name,
    kind: "Deployment",
    namespace: "default",
    cluster: "minikube",
    status: summary.status,
    desired,
    ready,
    cpu: cpuPct,
    memory: memPct,
    reqRate: formatReqRate(summary.req_rate),
    latency: formatLatency(summary.latency_ms),
    errRate: formatErrorRate(summary.error_rate),
    optimization: summary.status === "Underutilized" ? "Optimization available" : "No change",
    optimizationHighlight: summary.status === "Underutilized",
    badge: summary.status === "Underutilized" ? "OPTIMIZATION AVAILABLE" : "POLICY COMPLIANT",
    cpuRequest: "Live",
    memoryRequest: "Live",
    cpuLimit: "Live",
    image: summary.image ?? "Unknown",
    uptime: toUptimeText(summary.uptime_seconds),
  };
}

function formatLabel(unixSeconds: number, range: RangeKey): string {
  const d = new Date(unixSeconds * 1000);
  if (range === "7d") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function indexByTimestamp(points: BackendPoint[]): Map<number, number> {
  return new Map(points.map((pt) => [pt.t, pt.v]));
}

function asPercentSeries(primary: BackendPoint[], reference: BackendPoint[]): BackendPoint[] {
  if (reference.length === 0) {
    return primary;
  }
  const refMap = indexByTimestamp(reference);
  return primary
    .map((pt) => {
      const ref = refMap.get(pt.t);
      if (!ref || ref <= 0) {
        return null;
      }
      return { t: pt.t, v: (pt.v / ref) * 100 };
    })
    .filter((pt): pt is BackendPoint => pt !== null);
}

function emptyTelemetrySeries(): TelemetrySeries {
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

export function mapMetricsToTelemetry(metric: MetricKey, payload: BackendMetricsResponse): TelemetrySeries {
  const cpuSeries = payload.series.cpu_m?.points ?? [];
  const cpuLimitSeries = payload.series.cpu_limit_m?.points ?? [];
  const memSeries = payload.series.mem_mib?.points ?? [];
  const memReqSeries = payload.series.mem_request_mib?.points ?? [];

  let points: BackendPoint[] = payload.series[METRICS_KEY_MAP[metric]]?.points ?? [];

  if (metric === "cpu") {
    points = asPercentSeries(cpuSeries, cpuLimitSeries);
  }
  if (metric === "memory") {
    points = asPercentSeries(memSeries, memReqSeries);
  }
  if (metric === "error") {
    points = points.map((pt) => ({ t: pt.t, v: pt.v * 100 }));
  }

  if (points.length === 0) {
    return emptyTelemetrySeries();
  }

  const labels = points.map((pt) => formatLabel(pt.t, payload.range));
  const values = points.map((pt) => pt.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((acc, cur) => acc + cur, 0) / values.length;
  const current = values[values.length - 1] ?? 0;

  return {
    labels,
    values,
    forecast: [],
    min,
    avg,
    max,
    current,
  };
}

export interface ServicesSnapshot {
  environment: string;
  updatedAt: string;
  services: Service[];
}

export function toService(summary: BackendServiceSummary): Service {
  return buildService(summary);
}

export function formatMillicoresToRequest(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Unknown";
  }
  return `${Math.round(value)}m`;
}

export function formatMiBToRequest(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Unknown";
  }
  return `${Math.round(value)} MiB`;
}

export async function fetchServices(): Promise<ServicesSnapshot> {
  const payload = await fetchJson<BackendServicesResponse>("/api/services");
  return {
    environment: payload.environment,
    updatedAt: payload.updated_at,
    services: payload.services.map(buildService),
  };
}

export async function fetchServiceDetail(name: string): Promise<BackendServiceDetail> {
  return fetchJson<BackendServiceDetail>(`/api/services/${encodeURIComponent(name)}`);
}

export async function fetchOverview(): Promise<BackendOverviewResponse> {
  return fetchJson<BackendOverviewResponse>("/api/overview");
}

export async function fetchServiceMetrics(name: string, range: RangeKey): Promise<BackendMetricsResponse> {
  return fetchJson<BackendMetricsResponse>(`/api/metrics/${encodeURIComponent(name)}?range=${range}`);
}

export async function fetchCosts(usageWindow: "10m" | "1h" | "6h" | "24h" = "1h"): Promise<BackendCostsResponse> {
  return fetchJson<BackendCostsResponse>(`/api/costs?usage_window=${usageWindow}`);
}

export async function fetchCostEstimate(
  service: string,
  replicas: number,
): Promise<BackendCostEstimateResponse> {
  return fetchJson<BackendCostEstimateResponse>(
    `/api/costs/estimate?service=${encodeURIComponent(service)}&replicas=${replicas}`,
  );
}

export async function fetchActions(): Promise<BackendActionsResponse> {
  return fetchJson<BackendActionsResponse>("/api/actions");
}

export async function createAction(payload: BackendActionCreate): Promise<BackendActionRecord> {
  return fetchJson<BackendActionRecord>("/api/actions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchProfile(): Promise<BackendProfile> {
  return fetchJson<BackendProfile>("/api/profile");
}

export async function updateProfile(payload: BackendProfileUpdate): Promise<BackendProfile> {
  return fetchJson<BackendProfile>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchSettings(): Promise<BackendSettings> {
  return fetchJson<BackendSettings>("/api/settings");
}

export async function updateSettings(payload: BackendSettingsUpdate): Promise<BackendSettings> {
  return fetchJson<BackendSettings>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function queryCopilot(question: string): Promise<BackendCopilotResponse> {
  return fetchJson<BackendCopilotResponse>("/api/copilot/query", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

export async function loginApi(
  email: string,
  password: string,
  keepSignedIn: boolean,
): Promise<BackendLoginResponse> {
  return fetchJson<BackendLoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, keepSignedIn }),
  });
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

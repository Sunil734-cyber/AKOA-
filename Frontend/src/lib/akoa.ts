/*
 * AKOA mock data + deterministic synthetic telemetry.
 * Everything here is pure and SSR-safe: series generation is seeded so the
 * server and client render identical values (no hydration mismatch).
 */

export type MetricKey = "cpu" | "memory" | "reqRate" | "latency" | "error" | "replicas";
export type RangeKey = "15m" | "1h" | "6h" | "24h" | "7d";

export interface MetricMeta {
  key: MetricKey;
  label: string;
  color: string;
  unit: string;
  format: (v: number) => string;
  step?: boolean;
}

export const METRICS: Record<MetricKey, MetricMeta> = {
  cpu: {
    key: "cpu",
    label: "CPU utilization",
    color: "var(--color-primary)",
    unit: "%",
    format: (v) => `${Math.round(v)}%`,
  },
  memory: {
    key: "memory",
    label: "Memory utilization",
    color: "var(--color-healthy)",
    unit: "%",
    format: (v) => `${Math.round(v)}%`,
  },
  reqRate: {
    key: "reqRate",
    label: "Request rate",
    color: "var(--color-primary)",
    unit: "req/s",
    format: (v) => `${v >= 10 ? Math.round(v) : v.toFixed(1)} req/s`,
  },
  latency: {
    key: "latency",
    label: "p95 latency",
    color: "var(--color-warning)",
    unit: "ms",
    format: (v) => `${Math.round(v)} ms`,
  },
  error: {
    key: "error",
    label: "Error rate",
    color: "var(--color-critical)",
    unit: "%",
    format: (v) => `${v.toFixed(1)}%`,
  },
  replicas: {
    key: "replicas",
    label: "Replica count",
    color: "var(--color-muted-foreground)",
    unit: "",
    format: (v) => `${Math.round(v)}`,
    step: true,
  },
};

export type ServiceStatus =
  | "Healthy"
  | "Underutilized"
  | "Warning"
  | "Degraded"
  | "Critical"
  | "Unknown";

export type ServiceBadge = "POLICY COMPLIANT" | "OPTIMIZATION AVAILABLE";

export interface Service {
  name: string;
  kind: string;
  namespace: string;
  cluster: string;
  status: ServiceStatus;
  ready: number;
  desired: number;
  cpu: number;
  memory: number;
  reqRate: string;
  latency: string;
  errRate: string;
  optimization: string;
  optimizationHighlight?: boolean;
  badge: ServiceBadge;
  cpuRequest: string;
  memoryRequest: string;
  cpuLimit: string;
  image: string;
  uptime: string;
}

export const SERVICES: Service[] = [
  {
    name: "frontend",
    kind: "Deployment",
    namespace: "development",
    cluster: "minikube",
    status: "Healthy",
    ready: 2,
    desired: 2,
    cpu: 24,
    memory: 31,
    reqRate: "18 req/s",
    latency: "42 ms",
    errRate: "0.1%",
    optimization: "₹620 / mo",
    badge: "POLICY COMPLIANT",
    cpuRequest: "250m",
    memoryRequest: "256 MiB",
    cpuLimit: "500m",
    image: "frontend:v2.1.0",
    uptime: "9d 2h",
  },
  {
    name: "backend",
    kind: "Deployment",
    namespace: "development",
    cluster: "minikube",
    status: "Healthy",
    ready: 2,
    desired: 2,
    cpu: 41,
    memory: 38,
    reqRate: "31 req/s",
    latency: "51 ms",
    errRate: "0.2%",
    optimization: "No change",
    badge: "POLICY COMPLIANT",
    cpuRequest: "500m",
    memoryRequest: "512 MiB",
    cpuLimit: "1000m",
    image: "backend:v1.8.4",
    uptime: "6d 14h",
  },
  {
    name: "db-service",
    kind: "Deployment",
    namespace: "development",
    cluster: "minikube",
    status: "Underutilized",
    ready: 1,
    desired: 1,
    cpu: 4,
    memory: 9,
    reqRate: "0.3 req/s",
    latency: "37 ms",
    errRate: "0%",
    optimization: "₹X, XXX / mo",
    optimizationHighlight: true,
    badge: "OPTIMIZATION AVAILABLE",
    cpuRequest: "500m",
    memoryRequest: "1 GiB",
    cpuLimit: "1000m",
    image: "db-service:v5.0.1",
    uptime: "12d 8h",
  },
];

export function getService(name: string): Service | undefined {
  return SERVICES.find((s) => s.name === name);
}

/* ---------------------------------- ranges --------------------------------- */

export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "15m", label: "15m" },
  { key: "1h", label: "1h" },
  { key: "6h", label: "6h" },
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
];

const RANGE_LABELS: Record<RangeKey, string[]> = {
  "15m": ["-15m", "-12m", "-9m", "-6m", "-3m", "Now"],
  "1h": ["-1h", "-48m", "-36m", "-24m", "-12m", "Now"],
  "6h": ["-6h", "-5h", "-4h", "-3h", "-2h", "-1h", "Now"],
  "24h": [
    "00:00", "02:00", "04:00", "06:00", "08:00", "10:00",
    "12:00", "14:00", "16:00", "18:00", "Now",
  ],
  "7d": ["-7d", "-6d", "-5d", "-4d", "-3d", "-2d", "-1d", "Now"],
};

export function rangeLabel(key: RangeKey): string {
  switch (key) {
    case "15m": return "15 minutes";
    case "1h": return "1 hour";
    case "6h": return "6 hours";
    case "24h": return "24 hours";
    case "7d": return "7 days";
  }
}

/* ------------------------------ series engine ------------------------------ */

export interface ForecastPt {
  label: string;
  v: number;
  lo?: number;
  hi?: number;
}

export interface TelemetrySeries {
  labels: string[];
  values: number[];
  forecast: ForecastPt[];
  min: number;
  avg: number;
  max: number;
  current: number;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE: Record<MetricKey, Record<string, number>> = {
  cpu: { frontend: 24, backend: 41, "db-service": 4 },
  memory: { frontend: 31, backend: 38, "db-service": 9 },
  reqRate: { frontend: 18, backend: 31, "db-service": 0.3 },
  latency: { frontend: 42, backend: 51, "db-service": 37 },
  error: { frontend: 0.1, backend: 0.2, "db-service": 0 },
  replicas: { frontend: 2, backend: 2, "db-service": 1 },
};

const SPREAD: Record<MetricKey, number> = {
  cpu: 7,
  memory: 6,
  reqRate: 6,
  latency: 14,
  error: 0.08,
  replicas: 0,
};

// Fixed 24h CPU curve for backend, matching the reference telemetry.
const BACKEND_CPU_24H = [18, 22, 25, 28, 30, 33, 36, 44, 66, 44, 41];

export function getSeries(service: string, metric: MetricKey, range: RangeKey): TelemetrySeries {
  const labels = RANGE_LABELS[range];
  const base = BASE[metric][service] ?? 10;

  let values: number[];
  if (service === "backend" && metric === "cpu" && range === "24h") {
    values = BACKEND_CPU_24H;
  } else if (metric === "replicas") {
    const r = mulberry32(hashStr(`${service}-${metric}-${range}`));
    const changeAt = 4 + Math.floor(r() * Math.max(1, labels.length - 6));
    const start = Math.max(1, base - 1);
    const target = base + 1;
    values = labels.map((_, i) => (i < changeAt ? start : target));
  } else {
    const r = mulberry32(hashStr(`${service}-${metric}-${range}`));
    const n = labels.length;
    values = labels.map((_, i) => {
      const t = i / Math.max(1, n - 1);
      const shape = 1 + 0.3 * Math.sin(Math.PI * t);
      const noise = (r() - 0.5) * SPREAD[metric];
      return Math.max(0, base * shape + noise);
    });
  }

  const current = values[values.length - 1] ?? 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  let forecast: ForecastPt[] = [];
  if (metric !== "error") {
    const r = mulberry32(hashStr(`${service}-${metric}-${range}-f`));
    const span = metric === "replicas" ? 0 : Math.max(2, max * 0.08, base * 0.2);
    const drift = metric === "replicas" ? 0 : (r() - 0.4) * span;
    const end = metric === "replicas" ? current : current + drift;
    const fLabel = range === "7d" ? "+6h" : "+60m";
    forecast = [
      { label: fLabel, v: end, lo: end - span, hi: end + span },
    ];
  }

  return { labels, values, forecast, min, avg, max, current };
}

/* ------------------------------ interpretations ---------------------------- */

export function interpretation(metric: MetricKey, svc: Service, s: TelemetrySeries): string {
  const cur = METRICS[metric].format(s.current);
  const lo = METRICS[metric].format(s.min);
  const hi = METRICS[metric].format(s.max);
  if (metric === "cpu") {
    return `CPU rose with request volume and remains within policy (min ${lo} · max ${hi}). Forecast indicates sustained elevated demand; consider a reviewed scale-out.`;
  }
  if (metric === "error") {
    return `Error rate stayed within SLO across the window (min ${lo} · max ${hi}). No error spike or dependency failure was detected.`;
  }
  if (metric === "replicas") {
    return `Replica count adapted to demand during the window and now sits at ${Math.round(s.current)}. Desired state is matched and policy compliant.`;
  }
  return `${METRICS[metric].label} is stable around ${cur} (min ${lo} · max ${hi}) and remains within policy. Forecast shows no deviation that requires action.`;
}

/* ------------------------------ guarded actions ---------------------------- */

export type Risk = "LOW" | "MEDIUM" | "HIGH";

export interface ScaleAction {
  key: string;
  label: string;
  from: number;
  to: number;
  risk: Risk;
  reason: string;
  forecast: string;
  impact: string;
  note: string;
}

export function actionsFor(svc: Service): ScaleAction[] {
  const cur = svc.ready;
  const down = Math.max(1, cur - 1);
  return [
    {
      key: "scale-out",
      label: `Scale out · ${cur} → ${cur + 2} replicas`,
      from: cur,
      to: cur + 2,
      risk: "MEDIUM",
      reason: "Request volume increased 41% over last 90 minutes",
      forecast: "Demand expected to remain elevated",
      impact: "Higher compute usage and potentially improved latency",
      note: "Resource usage will increase. Change remains within scaling policy.",
    },
    {
      key: "scale-down",
      label: `Scale down · ${cur} → ${down} replicas`,
      from: cur,
      to: down,
      risk: "LOW",
      reason: "Sustained low utilization across the observation window",
      forecast: "Demand forecast remains low",
      impact: "Lower compute usage and reduced monthly cost",
      note: "Change remains within scaling policy.",
    },
    {
      key: "restart",
      label: "Restart rollout",
      from: cur,
      to: cur,
      risk: "LOW",
      reason: "Operator-initiated rollout restart",
      forecast: "No demand change expected",
      impact: "Pods replaced one at a time; capacity preserved",
      note: "Rolling replacement, no replica change.",
    },
  ];
}

/* ------------------------------- audit trail ------------------------------- */

export interface ActionRecord {
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

export const SEED_ACTIONS: ActionRecord[] = [
  {
    id: "AKOA-2409-1032",
    time: "10:32",
    service: "backend",
    action: "2 → 4 replicas",
    requestedBy: "Sreenidhi",
    approvedBy: "Sreenidhi",
    result: "Success",
    what: "Replica count was increased from 2 to 4.",
    why: "Request volume increased 41% over 90 minutes; forecast remained elevated.",
    evidence: "CPU peaked at 68%; p95 latency increased to 74 ms.",
    approver: "Sreenidhi Guruprasad · Infrastructure Engineer",
    k8sVerb: "PATCH apps/v1",
    k8sResource: "Deployment development/backend",
    k8sField: "spec.replicas: 4",
    duration: "14.2s",
  },
  {
    id: "AKOA-2409-0915",
    time: "09:15",
    service: "db-service",
    action: "3 → 1 replicas",
    requestedBy: "AKOA",
    approvedBy: "Sreenidhi",
    result: "Success",
    what: "Replica count was reduced from 3 to 1.",
    why: "CPU remained below 10% for 6 hours; forecast predicted low demand.",
    evidence: "CPU 6-hour average 8%; request rate 0.3 req/s.",
    approver: "Sreenidhi Guruprasad · Infrastructure Engineer",
    k8sVerb: "PATCH apps/v1",
    k8sResource: "Deployment development/db-service",
    k8sField: "spec.replicas: 1",
    duration: "11.8s",
  },
  {
    id: "AKOA-2409-0842",
    time: "08:42",
    service: "frontend",
    action: "1 → 2 replicas",
    requestedBy: "AKOA",
    approvedBy: null,
    result: "Rejected",
    what: "Proposed replica increase from 1 to 2.",
    why: "Recommendation required approval outside the low-risk policy window.",
    evidence: "Confidence 74% below the 80% auto-approval threshold.",
    approver: "—",
    k8sVerb: "PATCH apps/v1",
    k8sResource: "Deployment development/frontend",
    k8sField: "spec.replicas: 2",
    duration: "—",
  },
];

/* ----------------------------- recommendation ------------------------------ */

export const RECOMMENDATION = {
  service: "db-service",
  title: "Potential scale-down",
  desc: "Right-size replicas to match sustained low demand.",
  current: 3,
  recommended: 1,
  confidence: 91,
  risk: "LOW" as Risk,
  evidence: [
    ["CPU 6-hour average", "8%"],
    ["Current CPU", "5%"],
    ["Request rate", "0.3 req/s"],
    ["Historical trend", "Consistently low"],
    ["Forecast next 60 minutes", "Low · 6–10%"],
  ] as [string, string][],
  impactReduction: "~66%",
  impactSaving: "₹X, XXX",
  impactNote: "No change is executed until reviewed and confirmed.",
  reasoning: [
    ["CURRENT STATE", "CPU 7%"],
    ["HISTORICAL", "6-hour average 8%"],
    ["TREND", "Decreasing"],
    ["FORECAST", "Next 60m · 6–10%"],
    ["DECISION", "Potential scale-down"],
  ] as [string, string][],
  checks: [
    "CPU below 10% for 6 hours",
    "Request rate below 1 req/s",
    "No dependent service requires current capacity",
    "Forecast predicts low demand",
    "Policy allows scale-down",
  ],
  pipeline: [
    ["1", "Observation", "Telemetry collected"],
    ["2", "Analysis", "Behavior interpreted"],
    ["3", "Decision", "Recommendation proposed"],
    ["4", "Execution", "Requires confirmation"],
  ] as [string, string, string][],
};

/* --------------------------------- copilot --------------------------------- */

export const COPILOT_TOOLS: [string, string, string][] = [
  ["Metrics query", "CPU utilization · 90m", "Complete"],
  ["Request history", "Volume change · 90m", "Complete"],
  ["Forecast", "Demand · next 60m", "Complete"],
  ["Dependencies", "4 upstream · 2 downstream", "Complete"],
  ["Policy check", "Scale-out within limits", "Passed"],
];

export const COPILOT_PATH: [string, string][] = [
  ["Interpretation", "Complete"],
  ["Proposed action", "Ready"],
  ["User review", "Required"],
  ["Confirmation", "Locked"],
  ["Execution", "Locked"],
];

export interface CopilotReply {
  headline: string;
  metrics: [string, string][];
  close: string;
}

export function copilotReply(question: string): CopilotReply {
  const q = question.toLowerCase();
  const svc = SERVICES.find((s) => q.includes(s.name.toLowerCase())) ?? getService("backend")!;
  const s = getSeries(svc.name, "cpu", "24h");
  return {
    headline: `${svc.name} CPU is at ${Math.round(s.current)}% (min ${Math.round(s.min)}% · max ${Math.round(s.max)}%) across the observed window. Request volume is the primary correlated driver; no deployment regression, dependency loop or error spike was detected.`,
    metrics: [
      ["CPU change", `${Math.round(s.min)}% → ${Math.round(s.max)}%`],
      ["Request volume", "+18%"],
      ["Current replicas", String(svc.ready)],
      ["p95 latency", svc.latency],
    ],
    close:
      "Forecast demand remains within policy limits for the next 60 minutes. No action is proposed unless evidence crosses the guarded threshold.",
  };
}

/* ---------------------------------- profile -------------------------------- */

export const PROFILE = {
  name: "Sreenidhi Guruprasad",
  email: "sreenidhi@company.com",
  company: "Company Infrastructure",
  role: "Infrastructure Engineer",
  sso: "Enabled",
  lastSignIn: "Today · 08:31",
  permissions: [
    "View infrastructure",
    "View metrics",
    "View recommendations",
    "Request actions",
    "Approve low-risk actions",
  ],
};

export const NOTIFICATIONS: [string, string][] = [
  ["backend scaled 2 → 4 replicas", "10:32"],
  ["db-service optimization identified", "09:48"],
  ["frontend scale-out rejected by policy", "08:42"],
];

export const EVENTS: [string, string, string][] = [
  ["18:20", "ScalingReplicaSet", "Scaled up replica set backend-7f4c to 3"],
  ["16:02", "RollingUpdate", "Rolling update completed for backend:v1.8.4"],
  ["12:41", "Scheduled", "Scheduled pod backend-7f4c-9xk2l on minikube"],
  ["09:15", "ScalingReplicaSet", "Scaled down replica set db-service-5d8f to 1"],
];

export const DEPENDENCIES: { name: string; direction: "upstream" | "downstream"; status: ServiceStatus }[] = [
  { name: "frontend", direction: "upstream", status: "Healthy" },
  { name: "ingress", direction: "upstream", status: "Healthy" },
  { name: "redis", direction: "downstream", status: "Healthy" },
  { name: "postgres", direction: "downstream", status: "Healthy" },
];

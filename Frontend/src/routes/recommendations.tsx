import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Card, Button, Dot, MonoLabel, Badge, RiskBadge } from "@/components/ako";
import { ConfirmChangeModal } from "@/components/confirm-change";
import { fetchCostEstimate, fetchCosts, type BackendCostEstimateResponse, type BackendCostsResponse } from "@/lib/api";

export const Route = createFileRoute("/recommendations")({
  component: Recommendations,
  head: () => ({
    meta: [
      { title: "AKOA · Agent Recommendations" },
      {
        name: "description",
        content: "Optimization opportunities identified from telemetry, historical behavior, forecasting and policy analysis.",
      },
      { property: "og:title", content: "AKOA · Agent Recommendations" },
      {
        property: "og:description",
        content: "Optimization opportunities from telemetry, forecasting and policy analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function currency(amount: number, code: "INR" | "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(amount);
}

function Recommendations() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [costs, setCosts] = useState<BackendCostsResponse | null>(null);
  const [estimate, setEstimate] = useState<BackendCostEstimateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        const c = await fetchCosts("1h");
        setCosts(c);

        const top = [...c.services]
          .filter((s) => s.available && (s.unused_monthly ?? 0) > 0 && (s.replicas ?? 0) >= 1)
          .sort((a, b) => (b.unused_monthly ?? 0) - (a.unused_monthly ?? 0))[0];

        if (top?.name && top.replicas && top.replicas > 1) {
          const e = await fetchCostEstimate(top.name, Math.max(1, Math.floor(top.replicas) - 1));
          setEstimate(e);
        } else {
          setEstimate(null);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unable to load recommendation data";
        setError(message);
      }
    };

    void run();
  }, []);

  const recommendation = useMemo(() => {
    if (!costs) {
      return null;
    }
    const rec = [...costs.services]
      .filter((s) => s.available && (s.unused_monthly ?? 0) > 0)
      .sort((a, b) => (b.unused_monthly ?? 0) - (a.unused_monthly ?? 0))[0];
    return rec ?? null;
  }, [costs]);

  const risk: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  const currentReplicas = Math.max(1, Math.round(estimate?.replicas_current ?? recommendation?.replicas ?? 1));
  const recommendedReplicas = Math.max(1, Math.round(estimate?.replicas_new ?? currentReplicas));

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">Agent Recommendations</h1>
            <p className="mt-2 max-w-3xl text-[15px] text-muted-foreground">
              Optimization opportunities identified from live cost and telemetry data.
            </p>
            <p className="mt-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">AKOA analysis · usage window 1h</p>
          </div>
          <Badge tone="info">
            <Dot className="bg-primary" />
            {recommendation ? "1 opportunity" : "No opportunities"}
          </Badge>
        </div>

        {error ? (
          <Card className="mb-6 border-critical/30 bg-critical/5 p-4">
            <p className="text-sm text-critical">Unable to load recommendations from backend.</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{error}</p>
          </Card>
        ) : null}

        {!recommendation || !costs ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">No optimization recommendation is currently available from the cost engine.</p>
          </Card>
        ) : (
          <>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border px-6 py-5">
                <div className="min-w-64">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-lg font-bold text-foreground">{recommendation.name}</span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      <Dot className="bg-primary" />
                      Potential scale-down
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">Right-size replicas based on unused monthly allocation.</p>
                </div>
                <div className="flex flex-wrap items-center gap-8">
                  {[
                    ["Current replicas", String(currentReplicas)],
                    ["Recommended", String(recommendedReplicas)],
                    ["Unused", recommendation.unused_pct !== null ? `${recommendation.unused_pct.toFixed(1)}%` : "N/A"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="mt-1 font-mono text-2xl font-semibold text-foreground">{value}</div>
                    </div>
                  ))}
                  <RiskBadge risk={risk} />
                  <Button onClick={() => setConfirmOpen(true)}>
                    <ArrowRight size={14} />
                    Review Recommendation
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-6 lg:grid-cols-2">
                <Card className="bg-muted/30 p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="text-[15px] font-semibold text-foreground">Evidence</h3>
                    <MonoLabel>Observation</MonoLabel>
                  </div>
                  <div className="mt-4 divide-y divide-border">
                    {[
                      ["Service", recommendation.name],
                      ["Replicas", String(Math.round(recommendation.replicas ?? 0))],
                      ["Allocated monthly", currency(recommendation.allocated_monthly ?? 0, costs.assumptions.currency)],
                      ["Used monthly", currency(recommendation.used_monthly ?? 0, costs.assumptions.currency)],
                      ["Unused monthly", currency(recommendation.unused_monthly ?? 0, costs.assumptions.currency)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 py-3">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-muted/30 p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="text-[15px] font-semibold text-foreground">Estimated impact</h3>
                    <MonoLabel>Cost engine</MonoLabel>
                  </div>
                  <div className="mt-5">
                    <div className="font-mono text-4xl font-semibold text-healthy">
                      {recommendation.unused_pct !== null ? `${recommendation.unused_pct.toFixed(0)}%` : "N/A"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">potential reduction of unused allocation</div>
                  </div>
                  <div className="mt-5">
                    <div className="font-mono text-4xl font-semibold text-primary">
                      {estimate
                        ? currency(Math.abs(estimate.monthly_delta), costs.assumptions.currency)
                        : currency(recommendation.unused_monthly ?? 0, costs.assumptions.currency)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">estimated monthly saving</div>
                  </div>
                  <p className="mt-5 text-xs text-muted-foreground">No change is executed until reviewed and confirmed.</p>
                </Card>
              </div>

              <div className="border-t border-border px-6 py-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[15px] font-semibold text-foreground">Reasoning summary</h3>
                  <MonoLabel>Explainable evidence</MonoLabel>
                </div>
                <div className="mt-5 flex flex-wrap items-stretch gap-2">
                  {[
                    ["CURRENT", currency(recommendation.allocated_monthly ?? 0, costs.assumptions.currency)],
                    ["USED", currency(recommendation.used_monthly ?? 0, costs.assumptions.currency)],
                    ["UNUSED", currency(recommendation.unused_monthly ?? 0, costs.assumptions.currency)],
                    ["ACTION", `Scale ${currentReplicas} → ${recommendedReplicas}`],
                  ].map(([label, value], i, arr) => (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className={
                          i === arr.length - 1
                            ? "w-52 rounded-lg border border-primary/50 bg-primary/10 px-4 py-3"
                            : "w-52 rounded-lg border border-border bg-muted/30 px-4 py-3"
                        }
                      >
                        <div
                          className={
                            i === arr.length - 1
                              ? "font-mono text-[10px] font-semibold tracking-widest text-primary uppercase"
                              : "font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase"
                          }
                        >
                          {label}
                        </div>
                        <div className="mt-1.5 font-mono text-sm text-foreground">{value}</div>
                      </div>
                      {i < arr.length - 1 ? <ChevronRight size={14} className="shrink-0 text-muted-foreground" /> : null}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    "Cost assumptions visible",
                    "No automatic execution",
                    "Review required before change",
                  ].map((c) => (
                    <Badge key={c} tone="healthy" className="normal-case">
                      <Check size={11} />
                      <span className="font-sans text-xs tracking-normal">{c}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            <ConfirmChangeModal
              open={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              service={recommendation.name}
              from={currentReplicas}
              to={recommendedReplicas}
              reason="Cost engine shows sustained unused allocation for this service."
              forecast="Usage window indicates current allocation is higher than actual usage."
              impact={`Expected monthly delta: ${estimate ? currency(estimate.monthly_delta, costs.assumptions.currency) : "N/A"}`}
              risk={risk}
              note="No change is executed until reviewed and confirmed."
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}

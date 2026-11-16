import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Card, Button, Dot, MonoLabel, Badge, RiskBadge } from "@/components/ako";
import { ConfirmChangeModal } from "@/components/confirm-change";
import { COPILOT_PATH, COPILOT_TOOLS, type CopilotReply } from "@/lib/akoa";
import { queryCopilot } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/copilot")({
  component: Copilot,
  head: () => ({
    meta: [
      { title: "AKOA · AI Copilot" },
      {
        name: "description",
        content: "Investigate infrastructure behavior and prepare guarded, auditable actions with the AKOA AI Copilot.",
      },
      { property: "og:title", content: "AKOA · AI Copilot" },
      {
        property: "og:description",
        content: "Investigate infrastructure behavior and prepare guarded, auditable actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

interface Msg {
  role: "user" | "akoa";
  text: string;
  reply?: CopilotReply;
}

function AkoaMessage({ text, reply }: { text: string; reply?: CopilotReply | undefined }) {
  return (
    <Card className="border-l-2 border-l-primary p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-bold text-primary">
            A
          </span>
          <span className="text-sm font-semibold text-foreground">AKOA</span>
        </div>
        <Badge tone="healthy">
          <Dot className="bg-healthy" />
          Evidence grounded
        </Badge>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-foreground">{text}</p>
      {reply ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {reply.metrics.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1.5 font-mono text-sm font-semibold text-foreground">{value}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{reply.close}</p>
        </>
      ) : null}
    </Card>
  );
}

function Copilot() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "user", text: "Why is backend consuming so much CPU?" },
    {
      role: "akoa",
      text: "backend CPU increased from 32% to 68% over the last 90 minutes. Request volume increased 41% during the same period, making traffic growth the primary correlated driver.",
      reply: {
        headline: "",
        metrics: [
          ["CPU change", "32% → 68%"],
          ["Request volume", "+41%"],
          ["Current replicas", "2"],
          ["p95 latency", "51 ms"],
        ],
        close:
          "The increase is demand-correlated rather than anomalous. No dependency loop, deployment regression, or error spike was detected. Forecast demand remains elevated for the next 60 minutes.",
      },
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, thinking]);

  const send = async () => {
    const q = input.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    try {
      const answer = await queryCopilot(q);
      const reply: CopilotReply = {
        headline: answer.headline,
        metrics: answer.metrics,
        close: answer.close,
      };
      setMessages((m) => [...m, { role: "akoa", text: reply.headline, reply }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to query copilot";
      toast.error("Copilot request failed", { description: message });
      setMessages((m) => [
        ...m,
        {
          role: "akoa",
          text: "AKOA could not process this request right now. Please verify backend connectivity and retry.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              AKOA AI Copilot
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Investigate infrastructure behavior and prepare guarded, auditable actions.
            </p>
            <p className="mt-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Connected to Development / Minikube
            </p>
          </div>
          <Badge tone="info">
            <Dot className="bg-primary" />
            Analysis workspace
          </Badge>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          {/* chat column */}
          <div className="flex min-w-0 flex-col gap-5">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <Card key={i} className="p-5">
                  <MonoLabel className="text-[10px]">Sreenidhi</MonoLabel>
                  <p className="mt-2 text-[15px] text-foreground">{m.text}</p>
                </Card>
              ) : (
                <AkoaMessage key={i} text={m.text} reply={m.reply} />
              ),
            )}
            {thinking ? (
              <Card className="flex items-center gap-3 border-l-2 border-l-primary p-5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-bold text-primary">
                  A
                </span>
                <span className="text-sm text-muted-foreground">
                  Querying telemetry, correlating drivers, checking policy…
                </span>
                <span className="ml-auto flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </span>
              </Card>
            ) : null}

            {/* proposed action */}
            <div className="rounded-xl border border-warning/50 bg-warning/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ExternalLink size={15} className="text-warning" />
                  Proposed action
                </span>
                <RiskBadge risk="MEDIUM" />
              </div>
              <div className="mt-4 font-mono text-2xl">
                <span className="text-foreground">backend</span>
                <span className="mx-3 text-muted-foreground">2</span>
                <span className="text-warning">→</span>
                <span className="ml-3 text-warning">3 replicas</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                This is a proposal only. Review is required before AKOA can prepare a confirmation.
              </p>
              <Button className="mt-4" onClick={() => setConfirmOpen(true)}>
                <ArrowUp size={14} className="rotate-90" />
                Review Action
              </Button>
            </div>

            {/* input */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-2 pl-4 focus-within:border-primary/50">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="Ask AKOA about services, metrics, dependencies, or policy..."
                className="h-9 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={send}
                disabled={!input.trim() || thinking}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  input.trim() && !thinking
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground",
                )}
                aria-label="Send message"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>

          {/* right rail */}
          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-foreground">Tool activity</h3>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-healthy">
                  <Dot className="bg-healthy" />
                  Complete
                </span>
              </div>
              <div className="mt-4 space-y-4">
                {COPILOT_TOOLS.map(([title, sub, status]) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-healthy/50">
                      <Check size={10} className="text-healthy" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{title}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{sub}</div>
                    </div>
                    <span className="font-mono text-[11px] text-healthy">{status}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-foreground">Guarded path</h3>
              <div className="mt-4 space-y-4">
                {COPILOT_PATH.map(([step, status], i) => (
                  <div key={step} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold",
                        status === "Complete" && "bg-primary/15 text-primary",
                        status === "Ready" && "bg-primary/15 text-primary",
                        status === "Required" && "bg-warning/15 text-warning",
                        status === "Locked" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-foreground">{step}</span>
                    <span
                      className={cn(
                        "font-mono text-[11px]",
                        status === "Complete" && "text-healthy",
                        status === "Ready" && "text-primary",
                        status === "Required" && "text-warning",
                        status === "Locked" && "text-muted-foreground",
                      )}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <ConfirmChangeModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          service="backend"
          from={2}
          to={3}
          reason="Request volume increased 41% over last 90 minutes"
          forecast="Demand expected to remain elevated"
          impact="Higher compute usage and potentially improved latency"
          risk="MEDIUM"
          note="Resource usage will increase. Change remains within scaling policy."
        />
      </div>
    </AppLayout>
  );
}

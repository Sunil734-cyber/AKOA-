import { useState } from "react";
import { ShieldCheck, AlertTriangle, Check } from "lucide-react";
import { Modal, Button, RiskBadge } from "@/components/ako";
import { createAction } from "@/lib/api";
import { toast } from "sonner";

export interface ConfirmChangeProps {
  open: boolean;
  onClose: () => void;
  service: string;
  from: number;
  to: number;
  reason: string;
  forecast: string;
  impact: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  note: string;
}

export function ConfirmChangeModal({
  open,
  onClose,
  service,
  from,
  to,
  reason,
  forecast,
  impact,
  risk,
  note,
}: ConfirmChangeProps) {
  const [executing, setExecuting] = useState(false);

  const isScale = from !== to;
  const action = isScale ? `${from} → ${to} replicas` : "restart rollout";

  const confirm = async () => {
    setExecuting(true);
    try {
      const record = await createAction({
        service,
        action: isScale ? `${from} → ${to} replicas` : "restart rollout",
        requestedBy: "Sreenidhi",
        approvedBy: "Sreenidhi",
        result: "Success",
        what: isScale
          ? `Replica count was ${to > from ? "increased" : "reduced"} from ${from} to ${to}.`
          : "Rollout was restarted; pods replaced one at a time.",
        why: reason,
        evidence: `Based on live telemetry and forecast analysis for ${service}.`,
        approver: "Sreenidhi Guruprasad · Infrastructure Engineer",
        k8sVerb: "PATCH apps/v1",
        k8sResource: `Deployment development/${service}`,
        k8sField: isScale ? `spec.replicas: ${to}` : "spec.template.metadata.annotations: restartedAt",
        duration: "12.6s",
      });

      setExecuting(false);
      onClose();
      toast.success(`${service} ${action} executed`, {
        description: `Audit ID ${record.id} · Completed in ${record.duration}`,
      });
    } catch (error) {
      setExecuting(false);
      const message = error instanceof Error ? error.message : "Unable to execute action";
      toast.error("Action failed", { description: message });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirm Infrastructure Change"
      subtitle="Reviewed, auditable Kubernetes change"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={executing}>
            <Check size={15} />
            {executing ? "Executing…" : "Confirm & Execute"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-1">
          <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
            <span className="text-sm text-muted-foreground">Service</span>
            <span className="font-mono text-sm font-semibold text-foreground">{service}</span>
          </div>
          <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
            <span className="text-sm text-muted-foreground">
              {isScale ? "Current replicas" : "Replicas"}
            </span>
            <span className="font-mono text-sm text-foreground">{from}</span>
          </div>
          {isScale ? (
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">New replicas</span>
              <span className="font-mono text-sm font-semibold text-primary">{to}</span>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {[
            ["REASON", reason],
            ["FORECAST", forecast],
            ["EXPECTED IMPACT", impact],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {label}
              </div>
              <p className="mt-1 text-sm text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div
          className={
            risk === "LOW"
              ? "flex items-start gap-3 rounded-lg border border-healthy/40 bg-healthy/10 px-4 py-3"
              : "flex items-start gap-3 rounded-lg border border-warning/50 bg-warning/10 px-4 py-3"
          }
        >
          <AlertTriangle
            size={18}
            className={risk === "LOW" ? "mt-0.5 shrink-0 text-healthy" : "mt-0.5 shrink-0 text-warning"}
          />
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              Risk
              <RiskBadge risk={risk} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck size={14} className="shrink-0 text-muted-foreground" />
          Your identity, evidence, approval, and Kubernetes result will be recorded.
        </div>
      </div>
    </Modal>
  );
}

import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import type { Risk, ServiceStatus } from "@/lib/akoa";

/* --------------------------------- Button ---------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" &&
          "border border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent",
        variant === "ghost" && "text-muted-foreground hover:text-foreground hover:bg-accent",
        variant === "danger" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------- Card ----------------------------------- */

export function Card({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-border bg-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  meta,
  right,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-4 pb-3", className)}>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-foreground">{title}</div>
        {meta ? <div className="mt-0.5 text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

export function Dot({ className }: { className?: string }) {
  return <span className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", className)} />;
}

export function StatusDot({ status, className }: { status: ServiceStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <Dot
        className={cn(
          status === "Healthy" && "bg-healthy",
          status === "Underutilized" && "bg-warning",
          status === "Warning" && "bg-warning",
          status === "Degraded" && "bg-warning",
          status === "Critical" && "bg-critical",
          status === "Unknown" && "bg-muted-foreground",
        )}
      />
      <span
        className={cn(
          status === "Healthy" && "text-healthy",
          status === "Underutilized" && "text-warning",
          status === "Warning" && "text-warning",
          status === "Degraded" && "text-warning",
          status === "Critical" && "text-critical",
          status === "Unknown" && "text-muted-foreground",
        )}
      >
        {status}
      </span>
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "healthy" | "warning" | "critical" | "info" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase whitespace-nowrap",
        tone === "neutral" && "border-border bg-muted text-foreground",
        tone === "muted" && "border-border bg-transparent text-muted-foreground",
        tone === "healthy" && "border-healthy/40 bg-healthy/10 text-healthy",
        tone === "warning" && "border-warning/40 bg-warning/10 text-warning",
        tone === "critical" && "border-critical/40 bg-critical/10 text-critical",
        tone === "info" && "border-primary/40 bg-primary/10 text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <Badge tone={risk === "LOW" ? "healthy" : risk === "MEDIUM" ? "warning" : "critical"}>
      <Dot className={risk === "LOW" ? "bg-healthy" : risk === "MEDIUM" ? "bg-warning" : "bg-critical"} />
      Risk {risk}
    </Badge>
  );
}

/* ------------------------------ Section labels ----------------------------- */

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-medium tracking-widest text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------- Input ---------------------------------- */

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
        className,
      )}
      {...props}
    />
  );
}

/* --------------------------------- Dropdown -------------------------------- */

export function Dropdown({
  trigger,
  children,
  align = "right",
  menuClassName,
}: {
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "left" | "right";
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open ? (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-44 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl shadow-black/40",
            align === "right" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground hover:bg-accent",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-3 pt-2 pb-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{children}</div>;
}

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/60",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------------------------------- Toggle --------------------------------- */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
        checked ? "border-primary bg-primary" : "border-border bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all",
          checked ? "left-[18px] bg-primary-foreground" : "left-[2px] bg-muted-foreground",
        )}
      />
    </button>
  );
}

/* -------------------------------- Page header ------------------------------ */

export function PageHeader({
  title,
  subtitle,
  meta,
  right,
}: {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">{subtitle}</p> : null}
        {meta ? <div className="mt-3">{meta}</div> : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-3">{right}</div> : null}
    </div>
  );
}

/* ---------------------------------- Tabs ----------------------------------- */

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-6 overflow-x-auto border-b border-border", className)}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            "relative pb-3 text-sm whitespace-nowrap transition-colors",
            active === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t}
          {active === t ? (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
          ) : null}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Telemetry meta ----------------------------- */

export function TelemetryMeta({ text }: { text: string }) {
  return <MonoLabel>{text}</MonoLabel>;
}

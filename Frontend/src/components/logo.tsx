import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/60 bg-primary/10">
        <span className="font-mono text-lg font-bold text-primary">A</span>
      </div>
      <div>
        <div className="text-[15px] font-bold tracking-wide text-foreground">AKOA</div>
        <div className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          Autonomous Infrastructure
        </div>
      </div>
    </div>
  );
}

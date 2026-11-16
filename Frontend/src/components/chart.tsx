import { useRef, useState } from "react";
import type { TelemetrySeries, MetricMeta } from "@/lib/akoa";
import { cn } from "@/lib/utils";

export interface ChartLimit {
  v: number;
  label: string;
  color: string;
}

interface HoverState {
  index: number;
  clientX: number;
}

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * pow >= v) return m * pow;
  }
  return 10 * pow;
}

export interface TelemetryChartProps {
  series: TelemetrySeries;
  meta: MetricMeta;
  limits?: ChartLimit[] | undefined;
  forecastLabel?: string | undefined;
  height?: number | undefined;
  className?: string | undefined;
}

export function TelemetryChart({
  series,
  meta,
  limits,
  forecastLabel = "Next 60m",
  height = 260,
  className,
}: TelemetryChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  const W = 780;
  const H = height;
  const pad = { l: 58, r: 16, t: 22, b: 32 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const labels = [...series.labels, ...series.forecast.map((f) => f.label)];
  const obsValues = series.values;
  const fValues = series.forecast.map((f) => f.v);
  const all = [...obsValues, ...fValues];
  const hiVals = series.forecast.map((f) => f.hi ?? f.v).filter((v) => Number.isFinite(v));
  const limitVals = (limits ?? []).map((l) => l.v);
  const rawMax = Math.max(...all, ...hiVals, ...limitVals, 0.001);
  const yMax = meta.step ? Math.ceil(rawMax) + 1 : niceCeil(rawMax);

  const n = labels.length;
  const x = (i: number) => pad.l + (i / Math.max(1, n - 1)) * innerW;
  const y = (v: number) => pad.t + (1 - v / yMax) * innerH;

  const observedCount = obsValues.length;
  const nowX = x(observedCount - 1);

  // y ticks
  const tickCount = meta.step ? yMax : 4;
  const ticks: number[] = [];
  for (let i = 0; i <= tickCount; i++) {
    ticks.push((yMax / tickCount) * i);
  }

  // x labels — thin out
  const xTickIdx: number[] = [];
  const maxTicks = 8;
  const stepI = Math.max(1, Math.ceil(n / maxTicks));
  for (let i = 0; i < n; i += stepI) xTickIdx.push(i);
  if (xTickIdx[xTickIdx.length - 1] !== n - 1) xTickIdx.push(n - 1);

  // observed path
  const obsPath = meta.step
    ? stepPath(obsValues, x, y, observedCount)
    : linePath(obsValues, x, y, observedCount);

  // forecast dashed path (starts at last observed point)
  const lastObs = obsValues[observedCount - 1] ?? 0;
  const fcPoints: number[] = [lastObs, ...fValues];
  const fcPath = linePath(fcPoints, (i) => x(observedCount - 1 + i), y, fcPoints.length);

  const bandHi: number[] = [lastObs, ...series.forecast.map((f) => f.hi ?? f.v)];
  const bandLo: number[] = [lastObs, ...series.forecast.map((f) => f.lo ?? f.v)];
  const hasBand = series.forecast.length > 0 && series.forecast.some((f) => f.hi !== undefined);

  const bandPath = hasBand
    ? `M ${x(observedCount - 1)} ${y(bandHi[0] ?? 0)} ` +
      bandHi.slice(1).map((v, i) => `L ${x(observedCount + i)} ${y(v)}`).join(" ") +
      " " +
      bandLo.slice(1).map((v, i) => `L ${x(observedCount + (bandLo.length - 2 - i))} ${y(v)}`).reverse().join(" ") +
      " Z"
    : null;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width / W;
    const px = (e.clientX - rect.left) / scale;
    const idx = Math.round(((px - pad.l) / innerW) * (n - 1));
    if (idx < 0 || idx > n - 1) {
      setHover(null);
      return;
    }
    setHover({ index: idx, clientX: e.clientX - rect.left });
  };

  const hoverIsForecast = hover ? hover.index >= observedCount : false;
  const hoverValue = hover
    ? hoverIsForecast
      ? series.forecast[hover.index - observedCount]?.v
      : obsValues[hover.index]
    : undefined;
  const hoverLabel = hover ? labels[hover.index] : undefined;

  const yLabel = (v: number) => {
    if (meta.step) return `${Math.round(v)}`;
    return meta.format(v).replace(/ (req\/s|ms)$/, "");
  };

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full", className)}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img">
        {/* grid + y ticks */}
        {ticks.map((tv, i) => (
          <g key={i}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(tv)}
              y2={y(tv)}
              stroke="var(--color-border)"
              strokeWidth={1}
              opacity={0.55}
            />
            <text
              x={pad.l - 8}
              y={y(tv) + 3.5}
              textAnchor="end"
              className="fill-[var(--color-muted-foreground)] font-mono"
              fontSize={10}
            >
              {yLabel(tv)}
              {meta.step ? "" : ""}
            </text>
          </g>
        ))}

        {/* limit lines */}
        {(limits ?? []).map((l, i) => (
          <g key={i}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(l.v)}
              y2={y(l.v)}
              stroke={l.color}
              strokeWidth={1.5}
              strokeDasharray="6 5"
              opacity={0.75}
            />
            <text
              x={pad.l + 6}
              y={y(l.v) - 7}
              className="font-mono"
              fontSize={10.5}
              fill={l.color}
            >
              {l.label}
            </text>
          </g>
        ))}

        {/* forecast band */}
        {bandPath ? <path d={bandPath} fill="currentColor" className="text-primary" opacity={0.16} /> : null}

        {/* now divider */}
        {series.forecast.length > 0 ? (
          <line
            x1={nowX}
            x2={nowX}
            y1={pad.t - 4}
            y2={H - pad.b}
            stroke="var(--color-muted-foreground)"
            strokeWidth={1}
            strokeDasharray="2 4"
            opacity={0.6}
          />
        ) : null}
        {series.forecast.length > 0 ? (
          <text
            x={W - pad.r}
            y={pad.t - 8}
            textAnchor="end"
            className="fill-[var(--color-muted-foreground)] font-mono"
            fontSize={10.5}
          >
            {forecastLabel}
          </text>
        ) : null}

        {/* observed */}
        <path
          d={obsPath}
          fill="none"
          stroke={meta.color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {obsValues.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={meta.step ? 0 : 2.6} fill={meta.color} />
        ))}

        {/* forecast */}
        {series.forecast.length > 0 ? (
          <path
            d={fcPath}
            fill="none"
            stroke={meta.color}
            strokeWidth={2}
            strokeDasharray="5 5"
            strokeLinecap="round"
            opacity={0.85}
          />
        ) : null}

        {/* hover marker */}
        {hover ? (
          <g>
            <line
              x1={x(hover.index)}
              x2={x(hover.index)}
              y1={pad.t}
              y2={H - pad.b}
              stroke="var(--color-foreground)"
              strokeWidth={1}
              opacity={0.25}
            />
            <circle
              cx={x(hover.index)}
              cy={y(hoverValue ?? 0)}
              r={4}
              fill={meta.color}
              stroke="var(--color-background)"
              strokeWidth={2}
            />
          </g>
        ) : null}

        {/* x labels */}
        {xTickIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - pad.b + 20}
            textAnchor="middle"
            className="fill-[var(--color-muted-foreground)] font-mono"
            fontSize={10.5}
          >
            {labels[i]}
          </text>
        ))}
      </svg>

      {hover && hoverValue !== undefined ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[115%] rounded-lg border border-border bg-popover px-3 py-2 shadow-xl shadow-black/50"
          style={{ left: hover.clientX, top: (y(hoverValue) / H) * (wrapRef.current?.clientHeight ?? 0) }}
        >
          <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {hoverLabel} · {hoverIsForecast ? "Forecast" : "Observed"}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">{meta.format(hoverValue)}</div>
          <div className="font-mono text-[10px] text-muted-foreground">Synthetic sample</div>
        </div>
      ) : null}
    </div>
  );
}

function linePath(
  values: number[],
  xAt: (i: number) => number,
  yAt: (v: number) => number,
  count: number,
): string {
  if (count === 0) return "";
  return values
    .slice(0, count)
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(v)}`)
    .join(" ");
}

function stepPath(
  values: number[],
  xAt: (i: number) => number,
  yAt: (v: number) => number,
  count: number,
): string {
  if (count === 0) return "";
  let d = `M ${xAt(0)} ${yAt(values[0] ?? 0)}`;
  for (let i = 1; i < count; i++) {
    d += ` L ${xAt(i)} ${yAt(values[i - 1] ?? 0)} L ${xAt(i)} ${yAt(values[i] ?? 0)}`;
  }
  return d;
}

export function ChartLegend({ color, showForecast = true }: { color: string; showForecast?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
        Observed samples
      </span>
      {showForecast ? (
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="6" viewBox="0 0 18 6">
            <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          Forecast / interval · synthetic demo
        </span>
      ) : null}
    </div>
  );
}

/* Topology diagram for the AKOA sign-in screen. */

interface NodeSpec {
  id: string;
  x: number;
  y: number;
  w: number;
  highlight?: boolean;
}

const NODES: NodeSpec[] = [
  { id: "ingress", x: 60, y: 90, w: 150 },
  { id: "frontend", x: 320, y: 40, w: 170 },
  { id: "backend", x: 600, y: 60, w: 170, highlight: true },
  { id: "worker", x: 190, y: 260, w: 150 },
  { id: "redis", x: 470, y: 280, w: 130 },
  { id: "postgres", x: 660, y: 260, w: 150 },
];

const EDGES: [string, string, boolean][] = [
  ["ingress", "frontend", false],
  ["frontend", "backend", true],
  ["frontend", "worker", false],
  ["backend", "redis", false],
  ["backend", "postgres", false],
];

function nodeCenter(n: NodeSpec) {
  return { cx: n.x + n.w / 2, cy: n.y + 28 };
}

export function Topology({ className }: { className?: string }) {
  const byId = new Map(NODES.map((n) => [n.id, n]));
  return (
    <svg viewBox="0 0 840 380" className={className} role="img" aria-label="Cluster topology">
      {EDGES.map(([a, b, highlight]) => {
        const na = byId.get(a)!;
        const nb = byId.get(b)!;
        const ca = nodeCenter(na);
        const cb = nodeCenter(nb);
        return (
          <line
            key={`${a}-${b}`}
            x1={ca.cx}
            y1={ca.cy}
            x2={cb.cx}
            y2={cb.cy}
            stroke={highlight ? "var(--color-primary)" : "var(--color-border)"}
            strokeWidth={highlight ? 1.6 : 1.2}
            opacity={highlight ? 0.9 : 0.7}
          />
        );
      })}
      {NODES.map((n) => (
        <g key={n.id}>
          <rect
            x={n.x}
            y={n.y}
            width={n.w}
            height={62}
            rx={10}
            fill={n.highlight ? "color-mix(in oklab, var(--color-primary) 10%, var(--color-card))" : "var(--color-card)"}
            stroke={n.highlight ? "var(--color-primary)" : "var(--color-border)"}
            strokeWidth={n.highlight ? 1.6 : 1.2}
          />
          <circle cx={n.x + n.w - 16} cy={n.y + 18} r={4} fill="var(--color-healthy)" />
          <text
            x={n.x + 14}
            y={n.y + 23}
            fontSize={12.5}
            fontFamily="JetBrains Mono, monospace"
            fill={n.highlight ? "var(--color-primary)" : "var(--color-foreground)"}
          >
            {n.id}
          </text>
          <rect
            x={n.x + 14}
            y={n.y + 38}
            width={n.w - 60}
            height={4}
            rx={2}
            fill={n.highlight ? "var(--color-primary)" : "var(--color-muted)"}
            opacity={n.highlight ? 0.9 : 0.8}
          />
        </g>
      ))}
    </svg>
  );
}

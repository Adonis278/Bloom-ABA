/* Hand-rolled SVG line chart — no charting library, matching Crossfade.jsx's
   own precedent of a small custom component over a dependency. Tokens only
   (rgb(var(--line)) / rgb(var(--ink))): no new hues, no red/green status
   coding anywhere on the adult surface, consistent with "no red anywhere"
   everywhere else in this app. */
export default function TrendChart({ points, yMin, yMax, height = 72, width = 560 }) {
  if (!points || points.length === 0) {
    return <p className="text-[0.8125rem] text-muted">Nothing yet.</p>;
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const lo = yMin ?? Math.min(...ys);
  const hi = yMax ?? Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = hi - lo || 1;
  const pad = 6;

  const toX = (x) => pad + ((x - xMin) / xRange) * (width - pad * 2);
  const toY = (y) => height - pad - ((y - lo) / yRange) * (height - pad * 2);

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <line
        x1={pad}
        y1={height - pad}
        x2={width - pad}
        y2={height - pad}
        stroke="rgb(var(--line))"
        strokeWidth="1"
      />
      <path d={path} fill="none" stroke="rgb(var(--ink))" strokeWidth="1.5" />
      {points.length === 1 && (
        <circle cx={toX(points[0].x)} cy={toY(points[0].y)} r="2.5" fill="rgb(var(--ink))" />
      )}
    </svg>
  );
}

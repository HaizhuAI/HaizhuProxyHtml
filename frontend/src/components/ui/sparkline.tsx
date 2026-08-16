/* Lightweight SVG sparkline — traffic visualization without chart deps */
export function Sparkline({ data, width = 560, height = 150, stroke = 'var(--accent)', labels = true }: {
  data: number[]; width?: number; height?: number; stroke?: string; labels?: boolean;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pad = 6;
  const stepX = (width - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * stepX, height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2)]);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height - pad} L${pts[0][0].toFixed(1)},${height - pad} Z`;
  const last = data[data.length - 1];
  const prev = data[data.length - 2] ?? last;
  const delta = ((last - prev) / (prev || 1)) * 100;
  return (
    <div className="flex-col" style={{ gap: 8 }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="traffic chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity=".28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#spark-fill)" />
        <path d={line} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.2" fill={stroke} />
      </svg>
      {labels && (
        <div className="flex-between" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-low)' }}>
          <span>峰值 {max.toLocaleString()} MB</span>
          <span style={{ color: delta >= 0 ? 'var(--ok)' : 'var(--danger)' }}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}

/* Mini inline sparkline for tables/cards */
export function MiniSpark({ data, width = 90, height = 26 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - 2 - (v / max) * (height - 4)]);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}><path d={line} fill="none" stroke="var(--accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>;
}

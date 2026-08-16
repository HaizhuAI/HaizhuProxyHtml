export function PageHeader({ eyebrow, title, sub, right }: { eyebrow?: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex-between flex-wrap" style={{ marginBottom: 26, gap: 16 }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
        <h1 style={{ fontSize: 26, marginBottom: sub ? 6 : 0 }}>{title}</h1>
        {sub && <p className="muted" style={{ fontSize: 13.5 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

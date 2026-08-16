export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="flex-center" style={{ gap: 10 }}>
      <span style={{ width: size, height: size, borderRadius: 9, background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
        <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" stroke="#04140f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <path d="M3 12h18" />
        </svg>
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-.02em', color: 'var(--fg-hi)' }}>
        Haizhu<span style={{ color: 'var(--accent)' }}>Proxy</span>
      </span>
    </span>
  );
}

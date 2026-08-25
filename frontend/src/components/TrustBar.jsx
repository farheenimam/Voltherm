const TRUST_ITEMS = ['State DOTs', 'Charging Networks', 'Infrastructure Operators', 'Energy Utilities', 'Consulting & Eng.'];

export default function TrustBar() {
  return (
    <section style={{ borderBottom: '1px solid var(--line)', background: 'rgba(20,20,22,.95)' }}>
      <div
        className="container"
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div style={{ flex: '1 1 420px' }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 10px' }}>
            Trusted by leading charging networks and infrastructure agencies
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px' }}>
            {TRUST_ITEMS.map((item) => (
              <span key={item} style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid var(--line)', paddingLeft: 24 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>100+</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 150, marginTop: 4 }}>
              Organizations already using Voltherm
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

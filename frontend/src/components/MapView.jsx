/**
 * MapView — a stylized (non-geographic-accurate) risk map panel.
 *
 * Projects each site's lat/lng into the panel's viewBox with a simple
 * continental-US bounding box so markers land in roughly the right place
 * without pulling in a full mapping library. Swap `project()` for a real
 * projection (or a Mapbox/Leaflet embed) when wiring up production data.
 */

const VIEWBOX = { width: 800, height: 460 };

// Rough continental US bounding box for the dummy projection.
const BOUNDS = { minLat: 24, maxLat: 49, minLng: -125, maxLng: -66 };

function project(latitude, longitude) {
  const x = ((longitude - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * VIEWBOX.width;
  const y = ((BOUNDS.maxLat - latitude) / (BOUNDS.maxLat - BOUNDS.minLat)) * VIEWBOX.height;
  return { x, y };
}

function markerColor(tssScore) {
  if (tssScore == null) return 'var(--muted)';
  if (tssScore >= 75) return 'var(--green)';
  if (tssScore >= 60) return 'var(--amber)';
  return 'var(--danger)';
}

export default function MapView({ sites = [] }) {
  return (
    <div
      className="panel"
      style={{
        position: 'relative',
        padding: 16,
        height: '100%',
        minHeight: 340,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, #0d1720 0%, #070a0c 100%)',
      }}
    >
      <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} width="100%" height="100%" role="img" aria-label="Screened site risk map">
        <defs>
          <pattern id="mv-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59,167,224,.08)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#mv-grid)" />

        {sites.length === 0 && (
          <text x={VIEWBOX.width / 2} y={VIEWBOX.height / 2} textAnchor="middle" fill="var(--muted)" fontSize="14">
            No sites screened yet — submit one to see it on the map.
          </text>
        )}

        {sites.map((site) => {
          const { x, y } = project(site.latitude, site.longitude);
          const color = markerColor(site.tss?.score);
          return (
            <g key={site.id} transform={`translate(${x}, ${y})`}>
              <circle r="10" fill={color} opacity="0.18" />
              <circle r="5" fill={color} stroke="#0b0d0e" strokeWidth="1.5" />
              <title>
                {site.siteName} — TSS {site.tss?.score ?? '—'}
              </title>
            </g>
          );
        })}
      </svg>

      <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)' }}>
        <LegendDot color="var(--green)" label="TSS 75+" />
        <LegendDot color="var(--amber)" label="TSS 60–74" />
        <LegendDot color="var(--danger)" label="TSS < 60" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {label}
    </span>
  );
}

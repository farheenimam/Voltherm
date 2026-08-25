import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MapView from '../components/MapView.jsx';
import SiteScorecard from '../components/SiteScorecard.jsx';
import { listSites } from '../lib/api.js';

const STATS = [
  { value: '912', label: 'Sites Scored for Thermal Risk' },
  { value: '4,200+', label: 'Derating Hours Prevented' },
  { value: '$41M', label: 'Charger Downtime Averted' },
  { value: '97.3%', label: 'Average Uptime Post-Mitigation' },
];

export default function Dashboard() {
  const [sites, setSites] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    refreshSites();
  }, []);

  async function refreshSites() {
    try {
      const { sites: fetched } = await listSites();
      setSites(fetched);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    }
  }

  return (
    <main className="container" style={{ padding: '32px 24px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 30 30">
            <rect width="30" height="30" rx="7" fill="#39D97A" />
            <path d="M16 4 L8.5 16.5 H13.5 L12.5 26 L21.5 12.5 H16.5 L16 4 Z" fill="#141416" />
          </svg>
          <span style={{ fontWeight: 700, letterSpacing: '0.05em', color: '#fff' }}>VOLTHERM</span>
        </Link>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Risk Map & Site Screening</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 40 }}>
        <div style={{ height: 380 }}>
          <MapView sites={sites} />
        </div>
        <div className="panel" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#fff' }}>Recently Screened</h4>
          {loadError && <p style={{ fontSize: 12.5, color: 'var(--danger)' }}>{loadError}</p>}
          {sites.length === 0 && !loadError && (
            <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>No sites yet — screen one below to get started.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sites.slice(0, 6).map((site) => (
              <div key={site.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#c9ced1' }}>{site.siteName}</span>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>{site.tss?.score ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }}>
        {STATS.map((stat) => (
          <div key={stat.label} className="panel" style={{ padding: '18px 20px' }}>
            <div className="gradient-text" style={{ fontSize: 26, fontWeight: 800 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <SiteScorecard onScreened={refreshSites} />
    </main>
  );
}

import { useState } from 'react';
import AgentStatusLoader from './AgentStatusLoader.jsx';
import { screenSite, getSiteReportUrl } from '../lib/api.js';

const INITIAL_FORM = {
  siteName: '',
  address: '',
  latitude: '',
  longitude: '',
  surfaceType: 'asphalt',
  canopyCoveragePct: 0,
  treeCoveragePct: 0,
  estimatedChargerCount: 4,
  nevifunding: false,
};

export default function SiteScorecard({ onScreened }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    setResult(null);

    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        canopyCoveragePct: Number(form.canopyCoveragePct),
        treeCoveragePct: Number(form.treeCoveragePct),
        estimatedChargerCount: Number(form.estimatedChargerCount),
      };
      const site = await screenSite(payload);
      setResult(site);
      setStatus('done');
      onScreened?.(site);
    } catch (err) {
      setError(err.message || 'Something went wrong screening this site.');
      setStatus('error');
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
      <form onSubmit={handleSubmit} className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>Screen a candidate site</h3>

        <Field label="Site name">
          <input required value={form.siteName} onChange={(e) => update('siteName', e.target.value)} placeholder="I-95 Corridor — Lot 4" />
        </Field>

        <Field label="Address">
          <input required value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="1200 Peachtree St, Atlanta, GA" />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Latitude">
            <input required type="number" step="any" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} placeholder="33.7490" />
          </Field>
          <Field label="Longitude">
            <input required type="number" step="any" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} placeholder="-84.3880" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Surface type">
            <select value={form.surfaceType} onChange={(e) => update('surfaceType', e.target.value)}>
              <option value="asphalt">Asphalt</option>
              <option value="concrete">Concrete</option>
              <option value="gravel">Gravel</option>
              <option value="mixed">Mixed</option>
            </select>
          </Field>
          <Field label="Charger count">
            <input type="number" min="1" value={form.estimatedChargerCount} onChange={(e) => update('estimatedChargerCount', e.target.value)} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Canopy coverage %">
            <input type="number" min="0" max="100" value={form.canopyCoveragePct} onChange={(e) => update('canopyCoveragePct', e.target.value)} />
          </Field>
          <Field label="Tree coverage %">
            <input type="number" min="0" max="100" value={form.treeCoveragePct} onChange={(e) => update('treeCoveragePct', e.target.value)} />
          </Field>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
          <input type="checkbox" checked={form.nevifunding} onChange={(e) => update('nevifunding', e.target.checked)} />
          NEVI-funded site
        </label>

        <button type="submit" className="btn-primary" disabled={status === 'loading'} style={{ marginTop: 4 }}>
          {status === 'loading' ? 'Screening…' : 'Screen Site'}
        </button>

        {status === 'error' && (
          <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>
        )}
      </form>

      <div>
        {status === 'loading' && <AgentStatusLoader isComplete={false} />}
        {status === 'done' && result && <ResultCard site={result} />}
        {status === 'idle' && (
          <div className="panel" style={{ padding: 24, color: 'var(--muted)', fontSize: 13.5 }}>
            Fill out a candidate site and Voltherm's agents will return a Thermal Site Score (TSS) with a
            breakdown across heat, shade, and financial exposure.
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: 'var(--muted)' }}>
      {label}
      {children}
      <style>{`
        input, select {
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 9px 12px;
          color: var(--text);
          font-size: 13.5px;
          font-family: inherit;
        }
        input:focus, select:focus {
          border-color: var(--cyan);
        }
      `}</style>
    </label>
  );
}

function ResultCard({ site }) {
  const { tss, critiqueResult } = site;
  return (
    <div className="panel" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>Thermal Site Score</span>
        <a
          href={getSiteReportUrl(site.id)}
          style={{ fontSize: 12, color: 'var(--cyan)' }}
          target="_blank"
          rel="noreferrer"
        >
          Download report
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <span className="gradient-text" style={{ fontSize: 44, fontWeight: 800 }}>
          {tss.score}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 999,
            color: tss.band.color,
            background: `${tss.band.color}22`,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {tss.band.label}
        </span>
      </div>

      <p style={{ fontSize: 13.5, color: '#c9ced1', lineHeight: 1.6, margin: '0 0 18px' }}>{critiqueResult.summary}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
        {Object.entries(tss.breakdown).map(([key, value]) => (
          <div key={key} style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{value.subscore}</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'capitalize' }}>{key}</div>
          </div>
        ))}
      </div>

      {critiqueResult.prioritizedRecommendations?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 8 }}>
            Recommended mitigations
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {critiqueResult.prioritizedRecommendations.map((rec, i) => (
              <li key={i} style={{ fontSize: 13, color: '#c9ced1' }}>
                {rec.action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

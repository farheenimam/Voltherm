import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { Plus, Search, TrendingUp, DollarSign, ShieldAlert, CheckCircle, ArrowUpRight, Wrench } from 'lucide-react';

export default function Portfolio({ sites, user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'MEDIUM' | 'OPTIMAL'
  const navigate = useNavigate();

  // Filter sites based on search term & risk tier
  const filteredSites = sites.filter(s => {
    const matchesSearch = s.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (riskFilter === 'CRITICAL') return s.metrics.thermal_siting_score < 50;
    if (riskFilter === 'MEDIUM') return s.metrics.thermal_siting_score >= 50 && s.metrics.thermal_siting_score < 75;
    if (riskFilter === 'OPTIMAL') return s.metrics.thermal_siting_score >= 75;
    return true;
  });

  // Compute portfolio average statistics
  const avgTss = Math.round(sites.reduce((acc, s) => acc + s.metrics.thermal_siting_score, 0) / sites.length) || 0;
  const totalLoss = sites.reduce((acc, s) => acc + s.metrics.estimated_revenue_loss_usd, 0);
  const criticalSites = sites.filter(s => s.metrics.thermal_siting_score < 50).length;
  const avgShade = (sites.reduce((acc, s) => acc + s.metrics.shade_coverage_pct, 0) / sites.length).toFixed(1);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0D0D11' }}>
      <Sidebar user={user} onLogout={onLogout} firstSiteId={sites[0]?.site_id} />

      <div style={{ flex: 1, marginLeft: 240, padding: 32 }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Siting Portfolio Overview</h2>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--bg-border)',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--brand-orange)'
            }} className="mono">
              {sites.length} AUDITED CANDIDATES
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#64748B" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filter by city, state, or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 8,
                  padding: '10px 14px 10px 38px',
                  color: '#fff',
                  fontSize: 13,
                  width: 260,
                  outline: 'none'
                }}
              />
            </div>
            <button className="btn-primary" onClick={() => navigate('/wizard')}>
              <Plus size={16} />
              New Site Audit
            </button>
          </div>
        </header>

        {/* Metrics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          marginBottom: 32
        }}>
          {/* Card 1: Avg TSS */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>PORTFOLIO AVG TSS</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800 }} className="mono">{avgTss}</span>
              <span style={{ fontSize: 13, color: 'var(--status-optimal)', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
                <TrendingUp size={14} /> +5.4 pts
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target threshold: 75+ for NEVI</span>
          </div>

          {/* Card 2: Revenue at Risk */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ANNUAL REVENUE AT RISK</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--status-critical)' }} className="mono">
                ${(totalLoss / 1000).toFixed(1)}k
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/year</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--status-critical)' }}>Across {criticalSites} high-heat parcels</span>
          </div>

          {/* Card 3: Shade Coverage */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>AVG SHADE CANOPY</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--brand-orange)' }} className="mono">
                {avgShade}%
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>covered</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>85% direct asphalt exposure</span>
          </div>

          {/* Card 4: High Risk Count */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CRITICAL DERATING SITES</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--status-warning)' }} className="mono">
                {criticalSites}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>of {sites.length} sites</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Require solar canopy retrofit</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[
            { id: 'ALL', label: `All Sites (${sites.length})` },
            { id: 'CRITICAL', label: `Critical Risk (< 50)` },
            { id: 'MEDIUM', label: `Medium Risk (50–74)` },
            { id: 'OPTIMAL', label: `Optimal (75+)` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRiskFilter(tab.id)}
              style={{
                backgroundColor: riskFilter === tab.id ? 'rgba(255, 107, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: riskFilter === tab.id ? '1px solid var(--brand-orange)' : '1px solid var(--bg-border)',
                color: riskFilter === tab.id ? 'var(--brand-orange)' : 'var(--text-muted)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Siting Candidate Table matching Reference */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 13
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>
                <th style={{ padding: '16px 24px' }}>PARCEL & SITE NAME</th>
                <th style={{ padding: '16px 24px' }}>TSS SCORE</th>
                <th style={{ padding: '16px 24px' }}>DERATING HOURS</th>
                <th style={{ padding: '16px 24px' }}>REVENUE AT RISK</th>
                <th style={{ padding: '16px 24px' }}>STATUS</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>QUICK ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site) => {
                const isCritical = site.metrics.thermal_siting_score < 50;
                const isOptimal = site.metrics.thermal_siting_score >= 75;
                
                let badgeColor = 'var(--status-warning)';
                let badgeText = 'MEDIUM RISK';
                if (isCritical) {
                  badgeColor = 'var(--status-critical)';
                  badgeText = 'CRITICAL RISK';
                } else if (isOptimal) {
                  badgeColor = 'var(--status-optimal)';
                  badgeText = 'OPTIMAL';
                }

                return (
                  <tr
                    key={site.site_id}
                    style={{
                      borderBottom: '1px solid var(--bg-border)',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/sandbox/${site.site_id}`)}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#fff', fontSize: 14 }}>{site.site_name}</strong>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{site.location}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-dark)', marginTop: 2 }}>
                          {site.surface_type} &bull; {site.stall_count} Dispensers
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 70,
                          height: 6,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${site.metrics.thermal_siting_score}%`,
                            height: '100%',
                            backgroundColor: badgeColor
                          }} />
                        </div>
                        <span className="mono" style={{ color: badgeColor, fontWeight: 700, fontSize: 15 }}>
                          {site.metrics.thermal_siting_score}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '16px 24px' }} className="mono">
                      <span style={{ color: isCritical ? 'var(--status-critical)' : '#fff' }}>
                        {site.metrics.annual_derating_hours} hrs
                      </span>
                    </td>

                    <td style={{ padding: '16px 24px' }} className="mono">
                      <span style={{ color: isOptimal ? 'var(--status-optimal)' : 'var(--status-critical)', fontWeight: 700 }}>
                        -${site.metrics.estimated_revenue_loss_usd.toLocaleString()}
                      </span>
                    </td>

                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        color: badgeColor,
                        backgroundColor: `rgba(255, 255, 255, 0.04)`,
                        border: `1px solid ${badgeColor}`,
                        borderRadius: 4,
                        padding: '3px 8px',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.05em'
                      }}>
                        {badgeText}
                      </span>
                    </td>

                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 11 }}
                          onClick={() => navigate(`/sandbox/${site.site_id}`)}
                          title="Open Site Audit"
                        >
                          Audit &rarr;
                        </button>
                        <button
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: 11 }}
                          onClick={() => navigate(`/editor/${site.site_id}`)}
                          title="Design Solar Canopy / Mitigations"
                        >
                          <Wrench size={12} /> Mitigate
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--bg-border)'
          }}>
            <span>Showing {filteredSites.length} of {sites.length} audited sites</span>
            <span style={{ color: 'var(--brand-orange)' }}>All sites synced with FortyGuard micro-climate telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
}

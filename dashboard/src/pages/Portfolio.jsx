import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { Plus, Search, TrendingUp, DollarSign, Percent, CheckCircle } from 'lucide-react';

export default function Portfolio({ sites, user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Filter sites based on search term
  const filteredSites = sites.filter(s =>
    s.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute portfolio average statistics
  const avgTss = Math.round(sites.reduce((acc, s) => acc + s.metrics.thermal_siting_score, 0) / sites.length) || 0;
  const totalLoss = sites.reduce((acc, s) => acc + s.metrics.estimated_revenue_loss_usd, 0);

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
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Siting Portfolio</h2>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--bg-border)',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-muted)'
            }} className="mono">
              {sites.length} TOTAL SITES
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#64748B" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search sites..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 8,
                  padding: '10px 14px 10px 38px',
                  color: '#fff',
                  fontSize: 13,
                  width: 240,
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
          {/* Card 1 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>AVG TSS SCORE</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800 }} className="mono">{avgTss}</span>
              <span style={{ fontSize: 13, color: 'var(--status-optimal)', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
                <TrendingUp size={14} /> +4.2
              </span>
            </div>
          </div>
          {/* Card 2 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>REVENUE AT RISK</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--status-warning)' }} className="mono">
                ${(totalLoss / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
          {/* Card 3 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MITIGATION ROI</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--status-optimal)' }} className="mono">312%</span>
            </div>
          </div>
          {/* Card 4 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>AUDIT STATUS</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 32, fontWeight: 800 }} className="mono">85% Complete</span>
            </div>
          </div>
        </div>

        {/* Siting Candidate Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 14
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontWeight: 600 }}>
                <th style={{ padding: '16px 24px' }}>SITE NAME</th>
                <th style={{ padding: '16px 24px' }}>TSS SCORE</th>
                <th style={{ padding: '16px 24px' }}>REVENUE LOSS</th>
                <th style={{ padding: '16px 24px' }}>STATUS</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site) => {
                const isCritical = site.metrics.thermal_siting_score < 50;
                const isOptimal = site.metrics.thermal_siting_score >= 80;
                
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
                  <tr key={site.site_id} style={{
                    borderBottom: '1px solid var(--bg-border)',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }} onClick={() => navigate(`/sandbox/${site.site_id}`)}>
                    <td style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Avatar Thumbnail */}
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: '#1E293B',
                        backgroundImage: `url("https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=120&h=120&q=80")`,
                        backgroundSize: 'cover'
                      }}></div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{site.site_name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{site.location}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Progress visual bar */}
                        <div style={{
                          width: 80,
                          height: 6,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${site.metrics.thermal_siting_score}%`,
                            height: '100%',
                            backgroundColor: badgeColor
                          }}></div>
                        </div>
                        <span className="mono" style={{ color: badgeColor, fontWeight: 700 }}>
                          {site.metrics.thermal_siting_score}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', color: isOptimal ? 'var(--status-optimal)' : 'var(--status-critical)' }} className="mono">
                      -${site.metrics.estimated_revenue_loss_usd.toLocaleString()}/yr
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{
                        color: badgeColor,
                        backgroundColor: `rgba(${isCritical ? '239,68,68' : (isOptimal ? '16,185,129' : '245,158,11')}, 0.1)`,
                        border: `1px solid ${badgeColor}`,
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.05em'
                      }}>
                        {badgeText}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/sandbox/${site.site_id}`);
                        }}
                      >
                        Audit Site
                      </button>
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
            fontSize: 13,
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--bg-border)'
          }}>
            <span>Showing {filteredSites.length} of {sites.length} sites</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, opacity: 0.5, cursor: 'not-allowed' }}>Prev</button>
              <button disabled className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, opacity: 0.5, cursor: 'not-allowed' }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

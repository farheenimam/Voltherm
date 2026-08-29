import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { simulateMitigations } from '../mockData.js';

export default function Editor({ sites, onUpdateSite }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const site = sites.find(s => s.site_id === id) || sites[0];

  const [activeTab, setActiveTab] = useState('Design');
  const [selectedMitigations, setSelectedMitigations] = useState([]);

  if (!site) return <div>Site not found.</div>;

  const handleToggleMitigation = (type) => {
    const exists = selectedMitigations.some(m => m.type === type);
    if (exists) {
      setSelectedMitigations(prev => prev.filter(m => m.type !== type));
    } else {
      setSelectedMitigations(prev => [...prev, { type, coverage_pct: 100 }]);
    }
  };

  // Run simulation calculation
  const sim = simulateMitigations(site, selectedMitigations);
  const currentTss = selectedMitigations.length > 0 ? sim.tss_after : site.metrics.thermal_siting_score;
  const currentLoss = selectedMitigations.length > 0 ? sim.annual_revenue_loss_after_usd : site.metrics.estimated_revenue_loss_usd;
  const savings = selectedMitigations.length > 0 ? sim.annual_savings_usd : 0;
  const scoreDiff = currentTss - site.metrics.thermal_siting_score;

  const handleSave = () => {
    // Construct updated site profile
    const updated = {
      ...site,
      metrics: {
        ...site.metrics,
        thermal_siting_score: currentTss,
        estimated_revenue_loss_usd: currentLoss,
        risk_level: currentTss < 50 ? "CRITICAL RISK" : (currentTss < 75 ? "MEDIUM RISK" : "OPTIMAL")
      }
    };
    onUpdateSite(updated);
    navigate(`/sandbox/${site.site_id}`);
    window.location.reload();
  };

  const hasCanopy = selectedMitigations.some(m => m.type === 'Solar Canopy');
  const hasTree = selectedMitigations.some(m => m.type === 'Live Tree Wall');
  const hasPaint = selectedMitigations.some(m => m.type === 'Cool Reflective Paint');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D11',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header matching Page 3 reference */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(`/sandbox/${site.site_id}`)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Mitigation Editor</h2>
            <span style={{ fontSize: 11, color: 'var(--brand-orange)', letterSpacing: '0.05em', fontWeight: 700 }} className="mono">
              {site.site_name.toUpperCase()}
            </span>
          </div>
        </div>

        <button className="btn-primary" style={{ backgroundColor: 'var(--status-optimal)' }} onClick={handleSave}>
          <Save size={16} /> SAVE DESIGN
        </button>
      </header>

      {/* Editor Main Content Area */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 280px', height: 'calc(100vh - 69px)' }}>
        
        {/* Left Sidebar: Toolbox matching Page 3 reference */}
        <aside style={{
          backgroundColor: '#111216',
          borderRight: '1px solid var(--bg-border)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 24
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
              SHADE INFRASTRUCTURE
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Solar Canopy Card */}
              <div
                onClick={() => handleToggleMitigation('Solar Canopy')}
                style={{
                  backgroundColor: hasCanopy ? 'rgba(255, 107, 0, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: hasCanopy ? '1px solid var(--brand-orange)' : '1px solid var(--bg-border)',
                  borderRadius: 8,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'block', marginBottom: 4 }}>Solar Canopy</span>
                <span style={{ fontSize: 11, color: 'var(--status-optimal)' }} className="mono">18% TSS Impact</span>
              </div>

              {/* Live Tree Wall Card */}
              <div
                onClick={() => handleToggleMitigation('Live Tree Wall')}
                style={{
                  backgroundColor: hasTree ? 'rgba(255, 107, 0, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: hasTree ? '1px solid var(--brand-orange)' : '1px solid var(--bg-border)',
                  borderRadius: 8,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'block', marginBottom: 4 }}>Live Tree Wall</span>
                <span style={{ fontSize: 11, color: 'var(--status-optimal)' }} className="mono">8% TSS Impact</span>
              </div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
              SURFACE COATINGS
            </span>
            {/* Cool Reflective Paint Card */}
            <div
              onClick={() => handleToggleMitigation('Cool Reflective Paint')}
              style={{
                backgroundColor: hasPaint ? 'rgba(255, 107, 0, 0.08)' : 'rgba(255,255,255,0.02)',
                border: hasPaint ? '1px solid var(--brand-orange)' : '1px solid var(--bg-border)',
                borderRadius: 8,
                padding: 14,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'block', marginBottom: 4 }}>Cool Reflective Paint</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }} className="mono">High Albedo (0.8)</span>
            </div>
          </div>

          {/* ROI summary card at bottom left */}
          <div style={{
            marginTop: 'auto',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid var(--status-optimal)',
            borderRadius: 8,
            padding: 16
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--status-optimal)', display: 'block', marginBottom: 4 }}>ROI PROJECTION (LIVE)</span>
            <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: 'var(--status-optimal)' }}>
              +{selectedMitigations.length > 0 ? (12.4 + selectedMitigations.length * 5.2).toFixed(1) : '0.0'}%
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>Projected revenue increase due to reduced thermal throttling.</p>
          </div>
        </aside>

        {/* Center Panel Map Canvas matching Page 3 reference */}
        <main style={{
          position: 'relative',
          backgroundImage: `url("https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&h=800&q=80")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {/* Green dashed overlay representing proposed solar canopy placement */}
          {hasCanopy && (
            <div style={{
              position: 'absolute',
              top: '25%',
              left: '25%',
              width: '50%',
              height: '40%',
              border: '2px dashed var(--status-optimal)',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                backgroundColor: 'rgba(22, 23, 28, 0.9)',
                padding: '6px 12px',
                borderRadius: 4,
                border: '1px solid var(--bg-border)'
              }}>
                Proposed Solar Canopy (18% TSS reduction)
              </span>
            </div>
          )}

          {/* Tabs Bottom overlay */}
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(22, 23, 28, 0.95)',
            border: '1px solid var(--bg-border)',
            borderRadius: 20,
            padding: '4px 6px',
            display: 'flex',
            gap: 4
          }}>
            {['Design', 'Simulation', 'Satellite'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  backgroundColor: activeTab === tab ? 'var(--status-optimal)' : 'transparent',
                  color: activeTab === tab ? '#16171C' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 16,
                  padding: '6px 16px',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </main>

        {/* Right Sidebar Stats Diff Panel matching Page 3 reference */}
        <aside style={{
          backgroundColor: '#111216',
          borderLeft: '1px solid var(--bg-border)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          {/* Card 1: New TSS Score */}
          <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>NEW TSS SCORE</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="mono" style={{ fontSize: 32, fontWeight: 800 }}>{currentTss}</span>
              {scoreDiff > 0 && (
                <span className="mono" style={{ fontSize: 14, color: 'var(--status-optimal)', fontWeight: 600 }}>
                  ↑ +{scoreDiff}
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Annual Savings */}
          <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>ANNUAL SAVINGS</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span className="mono" style={{ fontSize: 32, fontWeight: 800, color: 'var(--status-optimal)' }}>
                ${savings.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Summary Box */}
          <div style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            padding: 12,
            border: '1px solid var(--bg-border)',
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.01)'
          }}>
            <h4 style={{ color: '#fff', marginBottom: 4 }}>Real-Time Impact</h4>
            Simulates the cooling offsets of overhead PV barriers and high-albedo coatings. Applying modifications helps keep temperature thresholds below derating curtailments.
          </div>
        </aside>
      </div>
    </div>
  );
}

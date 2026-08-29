import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Check, X, ShieldCheck, Download } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, siteId }) {
  const [selected, setSelected] = useState({
    summary: true,
    overlays: true,
    financials: true,
    mitigationRoi: true,
    neviSla: true
  });
  const [docFormat, setDocFormat] = useState('full'); // 'full' | 'summary'
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = () => {
    navigate(`/report/${siteId}`);
  };

  const modules = [
    {
      id: 'summary',
      title: 'Executive Summary & TSS Rating Scorecard',
      desc: 'Includes primary Thermal Siting Score (0–100), parcel metadata, and derating risk classification.'
    },
    {
      id: 'overlays',
      title: 'FortyGuard 10m Hyperlocal Thermal Heatmap Snapshot',
      desc: 'High-resolution GIS overlay mapping surface heat exceedance (>35°C) and albedo retention zones.'
    },
    {
      id: 'financials',
      title: 'Economic Impact & Revenue-at-Risk Breakdown',
      desc: 'Quantified revenue loss calculations based on utility rates, dispenser counts, and annual derating hours.'
    },
    {
      id: 'mitigationRoi',
      title: 'Mitigation Design Plan & Solar Canopy ROI',
      desc: 'Simulated resilience boost (+TSS), capital expenditure payback period, and avoided curtailment hours.'
    },
    {
      id: 'neviSla',
      title: 'NEVI 97% Uptime SLA Compliance Certification',
      desc: 'Official compliance verification letterhead required for federal DOT EV infrastructure funding awards.'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(8px)',
      padding: 16
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--bg-border)',
        borderRadius: 16,
        padding: 32,
        maxWidth: 600,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: 'rgba(255, 107, 0, 0.12)',
              border: '1px solid var(--brand-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={22} color="var(--brand-orange)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Configure NEVI Audit Export</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Select modules to compile into the formal federal compliance PDF.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Format Selector */}
        <div style={{
          display: 'flex',
          backgroundColor: '#0D0D11',
          padding: 4,
          borderRadius: 8,
          border: '1px solid var(--bg-border)'
        }}>
          <button
            type="button"
            onClick={() => setDocFormat('full')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: docFormat === 'full' ? 'var(--brand-orange)' : 'transparent',
              color: docFormat === 'full' ? '#fff' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Full NEVI Compliance Audit PDF
          </button>
          <button
            type="button"
            onClick={() => setDocFormat('summary')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: docFormat === 'summary' ? 'var(--brand-orange)' : 'transparent',
              color: docFormat === 'summary' ? '#fff' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Executive Summary Brief (1 Page)
          </button>
        </div>

        {/* Modules Checklist */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxHeight: 280,
          overflowY: 'auto',
          paddingRight: 4
        }}>
          {modules.map(mod => {
            const isChecked = selected[mod.id];
            return (
              <div
                key={mod.id}
                onClick={() => handleToggle(mod.id)}
                style={{
                  backgroundColor: isChecked ? 'rgba(255, 107, 0, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                  border: isChecked ? '1px solid var(--brand-orange)' : '1px solid var(--bg-border)',
                  borderRadius: 8,
                  padding: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{mod.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{mod.desc}</span>
                </div>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: `2px solid ${isChecked ? 'var(--brand-orange)' : 'var(--text-muted)'}`,
                  backgroundColor: isChecked ? 'var(--brand-orange)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isChecked && <Check size={14} color="#fff" strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          borderTop: '1px solid var(--bg-border)',
          paddingTop: 16
        }}>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '10px 18px', fontSize: 13 }}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleGenerate} style={{ padding: '10px 20px', fontSize: 13 }}>
            <Download size={16} /> Generate & View Report
          </button>
        </div>
      </div>
    </div>
  );
}

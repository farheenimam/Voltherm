import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Check, X } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, siteId }) {
  const [selected, setSelected] = useState({
    summary: true,
    overlays: true,
    financials: true,
    roi: false
  });
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = () => {
    navigate(`/report/${siteId}`);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--bg-border)',
        borderRadius: 16,
        padding: 32,
        maxWidth: 540,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 24
      }}>
        {/* Header matching Page 7 reference */}
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: 'rgba(255, 107, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={22} color="var(--brand-orange)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Generate NEVI Audit Report</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Select the analysis modules to include in your final PDF document for state grant applications.
            </p>
          </div>
        </div>

        {/* Modules checklist items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Card 1 */}
          <div
            onClick={() => handleToggle('summary')}
            style={{
              backgroundColor: '#0D0D11',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'border-color 0.2s'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Executive Summary & TSS Score</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Includes primary risk rating and site metadata.</span>
            </div>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              border: '2px solid var(--brand-orange)',
              backgroundColor: selected.summary ? 'var(--brand-orange)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selected.summary && <Check size={14} color="#fff" strokeWidth={3} />}
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => handleToggle('overlays')}
            style={{
              backgroundColor: '#0D0D11',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Thermal Heatmap Overlays</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Satellite imagery with FortyGuard heat island mapping.</span>
            </div>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              border: '2px solid var(--brand-orange)',
              backgroundColor: selected.overlays ? 'var(--brand-orange)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selected.overlays && <Check size={14} color="#fff" strokeWidth={3} />}
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => handleToggle('financials')}
            style={{
              backgroundColor: '#0D0D11',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Financial Revenue-at-Risk Analysis</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Throttling loss calculations and margin projections.</span>
            </div>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              border: '2px solid var(--brand-orange)',
              backgroundColor: selected.financials ? 'var(--brand-orange)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selected.financials && <Check size={14} color="#fff" strokeWidth={3} />}
            </div>
          </div>

          {/* Card 4 */}
          <div
            onClick={() => handleToggle('roi')}
            style={{
              backgroundColor: '#0D0D11',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Shade Mitigation ROI Study</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Before/After simulation comparison of canopies.</span>
            </div>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              border: '2px solid var(--brand-orange)',
              backgroundColor: selected.roi ? 'var(--brand-orange)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selected.roi && <Check size={14} color="#fff" strokeWidth={3} />}
            </div>
          </div>
        </div>

        {/* Buttons footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button className="btn-primary" onClick={handleGenerate}>
            Generate & Download
          </button>
        </div>
      </div>
    </div>
  );
}

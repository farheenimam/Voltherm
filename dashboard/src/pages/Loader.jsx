import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function Loader() {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        
        // Progress steps logic matching Page 6 reference
        const nextProg = prev + 5;
        if (nextProg < 35) {
          setStep(1); // Fetching satellite
        } else if (nextProg < 60) {
          setStep(2); // Collecting heat data
        } else if (nextProg < 85) {
          setStep(3); // Calculating TSS
        } else {
          setStep(4); // Generating AI Insights
        }
        return nextProg;
      });
    }, 150);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      // Hydrate site into local storage list
      const pendingRaw = sessionStorage.getItem('voltshield_pending_site');
      if (pendingRaw) {
        const pendingSite = JSON.parse(pendingRaw);
        
        // Fetch current sites list, append pending, and save
        const saved = localStorage.getItem('voltshield_sites');
        const sites = saved ? JSON.parse(saved) : [];
        
        // Check if already added to prevent duplication
        if (!sites.some(s => s.site_id === pendingSite.site_id)) {
          const updated = [pendingSite, ...sites];
          localStorage.setItem('voltshield_sites', JSON.stringify(updated));
        }
        
        sessionStorage.removeItem('voltshield_pending_site');
        
        // Redirect to sandbox view of the new site
        navigate(`/sandbox/${pendingSite.site_id}`);
        // Force refresh state on App.jsx if needed (HashRouter handles this on reload)
        window.location.reload();
      } else {
        navigate('/portfolio');
      }
    }
  }, [progress, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D11',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: 24
    }} className="bg-road-grid">
      <div style={{
        maxWidth: 480,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        textAlign: 'center'
      }}>
        {/* Pulsing Orange Lightning Spinner */}
        <div style={{ position: 'relative', width: 90, height: 90, marginBottom: 12 }}>
          {/* External rotating frame */}
          <Loader2 size={90} color="var(--brand-orange)" style={{
            animation: 'spin 2s linear infinite',
            opacity: 0.8
          }} />
          {/* Centered Flash Icon */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 5L10 14.5H16L15 25L22 15.5H16L17 5Z" fill="var(--brand-orange)"/>
            </svg>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Analyzing Site Resilience</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Fetching climate data from FortyGuard APIs...</p>
        </div>

        {/* Process Checklist Modal Panel */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--bg-border)',
          borderRadius: 12,
          padding: 24,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          textAlign: 'left'
        }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: step >= 1 ? 1 : 0.4 }}>
            {step > 1 ? (
              <CheckCircle2 size={18} color="var(--status-optimal)" />
            ) : (
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--brand-orange)' }}></span>
              </div>
            )}
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Satellite View Segmented</span>
          </div>

          {/* Step 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: step >= 2 ? 1 : 0.4 }}>
            {step > 2 ? (
              <CheckCircle2 size={18} color="var(--status-optimal)" />
            ) : (
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: step === 2 ? '2px solid var(--brand-orange)' : '2px solid var(--text-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {step === 2 && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--brand-orange)' }}></span>}
              </div>
            )}
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Urban Heat Data Collected</span>
          </div>

          {/* Step 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: step >= 3 ? 1 : 0.4 }}>
            {step > 3 ? (
              <CheckCircle2 size={18} color="var(--status-optimal)" />
            ) : (
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: step === 3 ? '2px solid var(--brand-orange)' : '2px solid var(--text-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {step === 3 && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--brand-orange)' }}></span>}
              </div>
            )}
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Calculating TSS Score...</span>
          </div>

          {/* Step 4 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: step >= 4 ? 1 : 0.4 }}>
            {step > 4 ? (
              <CheckCircle2 size={18} color="var(--status-optimal)" />
            ) : (
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: step === 4 ? '2px solid var(--brand-orange)' : '2px solid var(--text-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {step === 4 && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--brand-orange)' }}></span>}
              </div>
            )}
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Generating AI Insights</span>
          </div>
        </div>

        <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-orange)', letterSpacing: '0.05em' }}>
          {progress}% COMPLETE
        </div>
      </div>

      {/* Basic Keyframe Spinner Injection styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

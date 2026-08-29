import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export default function Loader({ onAddSite }) {
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
        
        const nextProg = prev + 4;
        if (nextProg < 30) {
          setStep(1);
        } else if (nextProg < 60) {
          setStep(2);
        } else if (nextProg < 85) {
          setStep(3);
        } else {
          setStep(4);
        }
        return nextProg;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const pendingRaw = sessionStorage.getItem('voltshield_pending_site');
      if (pendingRaw) {
        const pendingSite = JSON.parse(pendingRaw);
        
        if (onAddSite) {
          onAddSite(pendingSite);
        } else {
          const saved = localStorage.getItem('voltshield_sites');
          const sites = saved ? JSON.parse(saved) : [];
          if (!sites.some(s => s.site_id === pendingSite.site_id)) {
            const updated = [pendingSite, ...sites];
            localStorage.setItem('voltshield_sites', JSON.stringify(updated));
          }
        }
        
        sessionStorage.removeItem('voltshield_pending_site');
        
        // Short timeout for seamless visual transition
        setTimeout(() => {
          navigate(`/sandbox/${pendingSite.site_id}`);
        }, 400);
      } else {
        navigate('/portfolio');
      }
    }
  }, [progress, navigate]);

  const tasks = [
    { id: 1, label: 'Querying FortyGuard 10m Urban Heat LTM Grid...' },
    { id: 2, label: 'Segmenting Satellite Surface Albedo & Tree Canopy...' },
    { id: 3, label: 'Computing Thermal Siting Score (TSS) & Revenue Loss...' },
    { id: 4, label: 'Gemini Copilot Generating Engineering Mitigations...' }
  ];

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
        maxWidth: 520,
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--bg-border)',
        borderRadius: 20,
        padding: '48px 36px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        
        {/* Pulsing Radar Circle matching Screen 7 Reference */}
        <div style={{
          position: 'relative',
          width: 110,
          height: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Radar background ring */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px solid rgba(255, 107, 0, 0.25)',
            boxShadow: '0 0 25px rgba(255, 107, 0, 0.2)'
          }} />

          {/* Rotating radar sweep */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            borderTop: '2px solid var(--brand-orange)',
            borderRight: '2px solid transparent',
            borderBottom: '2px solid transparent',
            borderLeft: '2px solid transparent',
            animation: 'radar-sweep 1.4s linear infinite'
          }} />

          {/* Centered Flash Logo */}
          <div style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 107, 0, 0.12)',
            border: '1px solid var(--brand-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 5L10 14.5H16L15 25L22 15.5H16L17 5Z" fill="var(--brand-orange)"/>
            </svg>
          </div>
        </div>

        {/* Title and percentage */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Analyzing Thermal Resilience
          </h2>
          <div style={{
            fontSize: 28,
            fontWeight: 900,
            color: 'var(--brand-orange)',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            {progress}% COMPLETE
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: 6,
          backgroundColor: '#1E242B',
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: 'var(--brand-orange)',
            boxShadow: '0 0 12px var(--brand-orange)',
            transition: 'width 0.1s linear'
          }} />
        </div>

        {/* Status Checklist matching Screen 7 Mockup */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          textAlign: 'left'
        }}>
          {tasks.map(t => {
            const isDone = step > t.id || progress === 100;
            const isCurrent = step === t.id && progress < 100;

            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: isCurrent ? 'rgba(255, 107, 0, 0.08)' : (isDone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)'),
                  border: isCurrent ? '1px solid var(--brand-orange)' : (isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--bg-border)'),
                  transition: 'all 0.3s'
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={16} color="var(--status-optimal)" />
                ) : isCurrent ? (
                  <Loader2 size={16} color="var(--brand-orange)" style={{ animation: 'spin 1.5s linear infinite' }} />
                ) : (
                  <Circle size={16} color="#475569" />
                )}

                <span style={{
                  fontSize: 12,
                  fontWeight: isCurrent ? 700 : 500,
                  color: isDone ? '#FFFFFF' : (isCurrent ? 'var(--brand-orange)' : 'var(--text-muted)')
                }}>
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

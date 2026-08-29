import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('mara@evgo.com');
  const [password, setPassword] = useState('password');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === 'mara@evgo.com') {
      onLogin({
        name: 'Mara Velasquez',
        role: 'Site Planner',
        email: email
      });
      navigate('/portfolio');
    } else {
      setError('Access restricted to site planners. Please use mara@evgo.com.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D11',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }} className="bg-road-grid">
      <div style={{
        maxWidth: 480,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24
      }}>
        {/* Brand Shield Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: '#16171C',
            border: '2px solid var(--brand-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2.5L4.5 7.5V14.5C4.5 21.5 9.5 26.5 16 29.5C22.5 26.5 27.5 21.5 27.5 14.5V7.5L16 2.5Z" fill="#16171C" stroke="#FF6B00" stroke-width="2"/>
              <path d="M17 9L11 16.5H16L15 23L21 15.5H16L17 9Z" fill="#FF6B00"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>VoltShield</h1>
          <p style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: 320
          }}>
            Climate-Resilient EV Siting Copilot. Audit your sites for thermal resilience before you build.
          </p>
        </div>

        {/* Card Form */}
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--bg-border)',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--status-critical)',
              color: 'var(--status-critical)',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: 13
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#64748B" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  backgroundColor: '#0D0D11',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 8,
                  padding: '12px 16px 12px 44px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>PASSWORD</label>
              <a href="#" style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-orange)', textDecoration: 'none' }}>FORGOT?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#64748B" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  backgroundColor: '#0D0D11',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 8,
                  padding: '12px 16px 12px 44px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{
                width: 16,
                height: 16,
                accentColor: 'var(--brand-orange)',
                cursor: 'pointer'
              }}
            />
            <label htmlFor="remember" style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
              Remember this session for 30 days
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{
            justifyContent: 'center',
            marginTop: 8,
            fontSize: 15,
            padding: '14px 24px'
          }}>
            Enter Command Center →
          </button>
        </form>

        <span style={{ fontSize: 13, color: 'var(--text-dark)' }}>Don't have an account? <a href="#" style={{ color: '#fff', fontWeight: 600, textDecoration: 'none' }}>Contact Enterprise Sales</a></span>

        <footer style={{
          fontSize: 11,
          letterSpacing: '0.15em',
          color: 'var(--text-dark)',
          marginTop: 16,
          fontWeight: 600
        }}>
          SECURED BY FORTYGUARD URBAN HEAT INTEL
        </footer>
      </div>
    </div>
  );
}

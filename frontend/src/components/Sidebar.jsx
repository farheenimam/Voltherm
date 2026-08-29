import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Map, BarChart2, Folder, ShieldAlert, LogOut } from 'lucide-react';

export default function Sidebar({ user, onLogout, firstSiteId }) {
  return (
    <aside style={{
      width: 240,
      backgroundColor: '#111216',
      borderRight: '1px solid var(--bg-border)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Brand Header */}
        <Link to="/portfolio" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2.5L4.5 7.5V14.5C4.5 21.5 9.5 26.5 16 29.5C22.5 26.5 27.5 21.5 27.5 14.5V7.5L16 2.5Z" fill="#16171C" stroke="#FF6B00" stroke-width="2"/>
            <path d="M17 9L11 16.5H16L15 23L21 15.5H16L17 9Z" fill="#FF6B00"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '0.05em', color: '#fff' }}>VoltShield</span>
        </Link>

        {/* Navigation links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NavLink
            to="/grid"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? '#FFFFFF' : 'var(--text-muted)',
              backgroundColor: isActive ? 'rgba(255, 107, 0, 0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--brand-orange)' : '3px solid transparent',
              transition: 'all 0.2s'
            })}
          >
            <Map size={18} color={({ isActive }) => isActive ? 'var(--brand-orange)' : 'inherit'} />
            Grid Map
          </NavLink>

          <NavLink
            to={firstSiteId ? `/sandbox/${firstSiteId}` : '/portfolio'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? '#FFFFFF' : 'var(--text-muted)',
              backgroundColor: isActive ? 'rgba(255, 107, 0, 0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--brand-orange)' : '3px solid transparent',
              transition: 'all 0.2s'
            })}
          >
            <BarChart2 size={18} />
            Thermal Analysis
          </NavLink>

          <NavLink
            to="/portfolio"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? '#FFFFFF' : 'var(--text-muted)',
              backgroundColor: isActive ? 'rgba(255, 107, 0, 0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--brand-orange)' : '3px solid transparent',
              transition: 'all 0.2s'
            })}
          >
            <Folder size={18} />
            Siting Portfolio
          </NavLink>

          <NavLink
            to={firstSiteId ? `/editor/${firstSiteId}` : '/portfolio'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? '#FFFFFF' : 'var(--text-muted)',
              backgroundColor: isActive ? 'rgba(255, 107, 0, 0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--brand-orange)' : '3px solid transparent',
              transition: 'all 0.2s'
            })}
          >
            <ShieldAlert size={18} />
            Mitigation Hub
          </NavLink>
        </nav>
      </div>

      {/* User profile at bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Status System Health Indicator */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--bg-border)',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 11,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--status-optimal)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--status-optimal)' }}></span>
            SYSTEM OK / ACTIVE
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Telemetry sync 1.2s • 48 nodes online</div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--bg-border)',
          paddingTop: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=80&h=80&q=85"
              alt="Mara Velasquez"
              style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--brand-orange)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.role}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

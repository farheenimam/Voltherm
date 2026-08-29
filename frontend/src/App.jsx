import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { initialSites } from './mockData.js';
import { fetchSites } from './services/api.js';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Portfolio from './pages/Portfolio.jsx';
import GridMap from './pages/GridMap.jsx';
import Wizard from './pages/Wizard.jsx';
import Loader from './pages/Loader.jsx';
import Sandbox from './pages/Sandbox.jsx';
import Editor from './pages/Editor.jsx';
import Report from './pages/Report.jsx';

export default function App() {
  const DEFAULT_USER = {
    name: 'Mara Velasquez, PE',
    role: 'Principal EV Siting Director',
    email: 'mara@evgo.com'
  };

  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem('voltshield_user')) || DEFAULT_USER
  );
  const [sites, setSites] = useState(() => {
    const saved = localStorage.getItem('voltshield_sites');
    return saved ? JSON.parse(saved) : initialSites;
  });

  // Load sites live from SQLite backend
  useEffect(() => {
    async function loadData() {
      const backendSites = await fetchSites();
      if (backendSites && backendSites.length > 0) {
        setSites(backendSites);
        localStorage.setItem('voltshield_sites', JSON.stringify(backendSites));
      }
    }
    loadData();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('voltshield_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(DEFAULT_USER);
  };

  const handleAddSite = (newSite) => {
    const updated = [newSite, ...sites];
    setSites(updated);
    localStorage.setItem('voltshield_sites', JSON.stringify(updated));
  };

  const handleUpdateSite = (updatedSite) => {
    const updated = sites.map(s => s.site_id === updatedSite.site_id ? updatedSite : s);
    setSites(updated);
    localStorage.setItem('voltshield_sites', JSON.stringify(updated));
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/portfolio" element={<Portfolio sites={sites} user={user} onLogout={handleLogout} />} />
      <Route path="/grid" element={<GridMap sites={sites} user={user} onLogout={handleLogout} />} />
      <Route path="/wizard" element={<Wizard onAddSite={handleAddSite} />} />
      <Route path="/loader" element={<Loader onAddSite={handleAddSite} />} />
      <Route path="/sandbox" element={<Navigate to={sites[0] ? `/sandbox/${sites[0].site_id}` : '/portfolio'} replace />} />
      <Route path="/sandbox/:id" element={<Sandbox sites={sites} user={user} onLogout={handleLogout} />} />
      <Route path="/editor" element={<Navigate to={sites[0] ? `/editor/${sites[0].site_id}` : '/portfolio'} replace />} />
      <Route path="/editor/:id" element={<Editor sites={sites} onUpdateSite={handleUpdateSite} />} />
      <Route path="/report/:id" element={<Report sites={sites} />} />
      <Route path="*" element={<Navigate to="/portfolio" replace />} />
    </Routes>
  );
}

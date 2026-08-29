import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { initialSites } from './mockData.js';
import Login from './pages/Login.jsx';
import Portfolio from './pages/Portfolio.jsx';
import GridMap from './pages/GridMap.jsx';
import Wizard from './pages/Wizard.jsx';
import Loader from './pages/Loader.jsx';
import Sandbox from './pages/Sandbox.jsx';
import Editor from './pages/Editor.jsx';
import Report from './pages/Report.jsx';

export default function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('voltshield_user')) || null
  );
  const [sites, setSites] = useState(() => {
    const saved = localStorage.getItem('voltshield_sites');
    return saved ? JSON.parse(saved) : initialSites;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('voltshield_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('voltshield_user');
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
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route
        path="/portfolio"
        element={
          user ? (
            <Portfolio sites={sites} user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/grid"
        element={
          user ? (
            <GridMap sites={sites} user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/wizard"
        element={
          user ? (
            <Wizard onAddSite={handleAddSite} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/loader"
        element={
          user ? (
            <Loader onAddSite={handleAddSite} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/sandbox/:id"
        element={
          user ? (
            <Sandbox sites={sites} user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/editor/:id"
        element={
          user ? (
            <Editor sites={sites} onUpdateSite={handleUpdateSite} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/report/:id"
        element={
          user ? (
            <Report sites={sites} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  return (
    <div className="bg-grid-pattern" style={{ minHeight: '100vh', position: 'relative' }}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </div>
  );
}

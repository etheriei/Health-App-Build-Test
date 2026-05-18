import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import FlowPage from './FlowPage'
import ReplayPage from './ReplayPage'
import AnnotatePage from './AnnotatePage'
import './App.css'

function NavBar() {
  const loc = useLocation()
  const links = [
    { to: '/flow', label: 'FLOW' },
    { to: '/replay', label: 'Replay' },
    { to: '/annotate', label: 'Annotate' },
  ]
  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(13,25,41,0.92)', backdropFilter: 'blur(8px)',
      borderRadius: 32, padding: '8px 20px',
      display: 'flex', gap: 4, zIndex: 200,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      {links.map(l => (
        <Link key={l.to} to={l.to} style={{
          padding: '6px 16px', borderRadius: 24,
          fontSize: 13, fontWeight: 500, textDecoration: 'none',
          background: loc.pathname.startsWith(l.to) ? '#22b4cc' : 'transparent',
          color: loc.pathname.startsWith(l.to) ? '#fff' : 'rgba(255,255,255,0.6)',
          transition: 'all 0.15s',
        }}>{l.label}</Link>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/flow" element={<FlowPage />} />
        <Route path="/replay" element={<ReplayPage />} />
        <Route path="/annotate" element={<AnnotatePage />} />
        <Route path="*" element={<Navigate to="/flow" replace />} />
      </Routes>
      <NavBar />
    </>
  )
}

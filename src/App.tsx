import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Positions from './pages/Positions'
import ClosedPositions from './pages/ClosedPositions'
import './App.css'

export default function App() {
  return (
    <HashRouter>
      <header className="app-header">
        <h1>LEAP Dashboard</h1>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/positions">Positions</NavLink>
          <NavLink to="/closed">Closed</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/closed" element={<ClosedPositions />} />
        </Routes>
      </main>
    </HashRouter>
  )
}

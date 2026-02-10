import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import AgentSignup from './pages/AgentSignup'
import Invites from './pages/Invites'
import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import Equipements from './pages/Equipements'
import Affectations from './pages/Affectations'
import Restitutions from './pages/Restitutions'
import Incidents from './pages/Incidents'
import Rapports from './pages/Rapports'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<AgentSignup />} />
          <Route path="/inscription/:token" element={<AgentSignup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="agents" element={<Agents />} />
            <Route path="invites" element={<Invites />} />
            <Route path="equipements" element={<Equipements />} />
            <Route path="affectations" element={<Affectations />} />
            <Route path="restitutions" element={<Restitutions />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="rapports" element={<Rapports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import LandingPage from '@/pages/Landing'
import LoginPage from '@/pages/Auth/Login'
import RegisterPage from '@/pages/Auth/Register'
import WizardPage from '@/pages/Wizard'
import DashboardPage from '@/pages/Dashboard'
import ConversationsPage from '@/pages/Conversations'
import KnowledgePage from '@/pages/Knowledge'
import SettingsPage from '@/pages/Settings'
import BillingPage from '@/pages/Billing'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import GoogleCallbackPage from '@/pages/Auth/GoogleCallback'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/google-callback" element={<GoogleCallbackPage />} />
      <Route
        path="/wizard"
        element={<AuthGuard><WizardPage /></AuthGuard>}
      />
      <Route
        path="/app"
        element={<AuthGuard><DashboardLayout /></AuthGuard>}
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="conversations" element={<ConversationsPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="billing" element={<BillingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

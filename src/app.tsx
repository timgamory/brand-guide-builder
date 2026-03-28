import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { Dashboard } from './pages/Dashboard'
import { WizardShell } from './components/layout/WizardShell'
import { WizardSection } from './pages/WizardSection'
import { GuidePreview } from './pages/GuidePreview'
import { FellowReview } from './pages/FellowReview'
import { PresentationView } from './pages/PresentationView'
import { AuthCallback } from './pages/AuthCallback'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/wizard" element={<WizardShell />}>
        <Route index element={<WizardSection />} />
        <Route path=":sectionId" element={<WizardSection />} />
      </Route>
      <Route path="/preview" element={<GuidePreview />} />
      <Route path="/review/:token" element={<FellowReview />} />
      <Route path="/presentation" element={<PresentationView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

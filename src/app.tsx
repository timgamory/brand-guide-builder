import { Routes, Route, Navigate } from 'react-router-dom'
import { PathSelection } from './pages/PathSelection'
import { ApiKeySetup } from './pages/ApiKeySetup'
import { WizardShell } from './components/layout/WizardShell'
import { WizardSection } from './pages/WizardSection'
import { GuidePreview } from './pages/GuidePreview'
import { InternSetup } from './pages/InternSetup'

function Placeholder({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center h-full font-body text-brand-text-muted p-12">
      {name}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PathSelection />} />
      <Route path="/setup" element={<ApiKeySetup />} />
      <Route path="/intern-setup" element={<InternSetup />} />
      <Route path="/wizard" element={<WizardShell />}>
        <Route index element={<WizardSection />} />
        <Route path=":sectionId" element={<WizardSection />} />
      </Route>
      <Route path="/preview" element={<GuidePreview />} />
      <Route path="/review/:token" element={<Placeholder name="Fellow Review" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

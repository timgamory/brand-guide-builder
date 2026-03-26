import { Routes, Route, Navigate } from 'react-router-dom'
import { PathSelection } from './pages/PathSelection'
import { ApiKeySetup } from './pages/ApiKeySetup'
import { WizardShell } from './components/layout/WizardShell'

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
      <Route path="/wizard" element={<WizardShell />}>
        <Route index element={<Placeholder name="Select a section" />} />
        <Route path=":sectionId" element={<Placeholder name="Section Content" />} />
      </Route>
      <Route path="/review/:token" element={<Placeholder name="Fellow Review" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

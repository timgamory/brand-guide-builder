import { Routes, Route, Navigate } from 'react-router-dom'

function Placeholder({ name }: { name: string }) {
  return <div className="flex items-center justify-center h-screen font-body text-brand-text-muted">{name}</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder name="Path Selection" />} />
      <Route path="/setup" element={<Placeholder name="API Key Setup" />} />
      <Route path="/wizard" element={<Placeholder name="Wizard" />} />
      <Route path="/wizard/:sectionId" element={<Placeholder name="Wizard Section" />} />
      <Route path="/review/:token" element={<Placeholder name="Fellow Review" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

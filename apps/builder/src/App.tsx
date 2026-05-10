import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BuilderLayout } from './components/Builder/BuilderLayout.js'
import { FormListPage } from './pages/FormList.js'
import './styles/globals.css'

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Navigate to="/forms" replace />} />
        <Route path="/forms" element={<FormListPage />} />
        <Route path="/builder" element={<BuilderLayout />} />
        <Route path="/builder/:id" element={<BuilderLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

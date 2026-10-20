import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
// Bundled, so the viewer loads nothing from outside and looks the same offline and in recordings.
import '@fontsource-variable/inter'
import './styles/tokens.css'
import './styles/viewer.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

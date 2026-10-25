import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { resolveTheme } from './lib/theme'
import { isFolderPickerSupported } from './services/fs'
import { readTheme, systemPrefersDark } from './services/prefs'

document.documentElement.dataset.theme = resolveTheme(readTheme(), systemPrefersDark())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App folderPickerSupported={isFolderPickerSupported()} />
  </StrictMode>,
)

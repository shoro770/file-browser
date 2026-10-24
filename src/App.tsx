import UnsupportedBrowser from './components/UnsupportedBrowser'
import type { AppProps } from './types'
import './App.css'

/** App shell: toolbar over a tree pane and a preview pane, or the unsupported-browser screen. */
export default function App({ folderPickerSupported }: AppProps) {
  if (!folderPickerSupported) return <UnsupportedBrowser />

  return (
    <div className="shell">
      <h1 className="visually-hidden">file-browser</h1>
      <header className="shell__toolbar" />
      <div className="shell__tree" />
      <main className="shell__preview" />
    </div>
  )
}

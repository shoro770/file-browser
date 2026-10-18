import { FileRow } from './components/FileRow'
import type { FileItem } from './types'
import './App.css'

/**
 * Sample data until the app reads a real directory. Covers every category.
 * Dates use the local-time constructor (month is 0-based) so they don't shift a
 * day for viewers west of UTC, as `new Date('2026-10-12')` would.
 */
const MOCK_FILES: FileItem[] = [
  {
    id: '1',
    name: 'documents',
    path: '/documents',
    size: 0,
    isDirectory: true,
    updatedAt: new Date(2026, 9, 12),
    category: 'other',
  },
  {
    id: '2',
    name: 'report.pdf',
    path: '/report.pdf',
    size: 1048576,
    isDirectory: false,
    updatedAt: new Date(2026, 9, 15),
    category: 'document',
  },
  {
    id: '3',
    name: 'vacation.jpg',
    path: '/vacation.jpg',
    size: 3460300,
    isDirectory: false,
    updatedAt: new Date(2026, 8, 2),
    category: 'image',
  },
  {
    id: '4',
    name: 'demo-recording.mp4',
    path: '/demo-recording.mp4',
    size: 734003200,
    isDirectory: false,
    updatedAt: new Date(2026, 9, 3),
    category: 'video',
  },
  {
    id: '5',
    name: 'podcast-episode-12.mp3',
    path: '/podcast-episode-12.mp3',
    size: 48234496,
    isDirectory: false,
    updatedAt: new Date(2026, 6, 30),
    category: 'audio',
  },
  {
    id: '6',
    name: 'backup.zip',
    path: '/backup.zip',
    size: 15032385536,
    isDirectory: false,
    updatedAt: new Date(2026, 7, 21),
    category: 'archive',
  },
  {
    id: '7',
    name: 'App.tsx',
    path: '/App.tsx',
    size: 12400,
    isDirectory: false,
    updatedAt: new Date(2026, 9, 18),
    category: 'code',
  },
  {
    id: '8',
    name: 'notes.txt',
    path: '/notes.txt',
    size: 842,
    isDirectory: false,
    updatedAt: new Date(2026, 9, 17),
    category: 'document',
  },
  {
    id: '9',
    name: 'LICENSE',
    path: '/LICENSE',
    size: 1071,
    isDirectory: false,
    updatedAt: new Date(2026, 0, 5),
    category: 'other',
  },
]

function App() {
  return (
    <main className="file-browser">
      <h1>File Browser</h1>
      <ul className="file-list">
        {MOCK_FILES.map((file) => (
          <FileRow key={file.id} item={file} />
        ))}
      </ul>
    </main>
  )
}

export default App

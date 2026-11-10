import { useId, useMemo } from 'react'
import { fileExtensions } from '../lib/files'
import type { FileTypeFilterProps } from '../types'

/** Value of the "All files" option; no extension can be empty, so it never clashes. */
const ALL = ''

/**
 * Toolbar dropdown that limits the tree to one file type. It lists "All files" and the extensions
 * of the files loaded so far (the chosen one stays listed even if it disappears after a Refresh).
 * A native `<select>`, so the keyboard and screen reader behavior come with it.
 */
export default function FileTypeFilter({ items, value, onChange, onAnnounce }: FileTypeFilterProps) {
  const id = useId()
  const options = useMemo(() => {
    const found = fileExtensions(items)
    return value !== null && !found.includes(value) ? [...found, value].sort() : found
  }, [items, value])

  function handleChange(next: string) {
    const choice = next === ALL ? null : next
    onChange(choice)
    onAnnounce(choice === null ? 'Showing all files' : `Showing only .${choice} files`)
  }

  return (
    <div className="file-type">
      <label htmlFor={id} className="file-type__label">
        File type
      </label>
      <select id={id} className="file-type__select" value={value ?? ALL} onChange={(event) => handleChange(event.target.value)}>
        <option value={ALL}>All files</option>
        {options.map((extension) => (
          <option key={extension} value={extension}>
            .{extension}
          </option>
        ))}
      </select>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { SearchBoxProps, SearchOptions } from '../types'
import { Close, MagnifyingGlass } from './Glyph'

/** The match-mode toggles: option key, accessible name, visible mark. */
const TOGGLES: ReadonlyArray<readonly [keyof SearchOptions, string, string]> = [
  ['matchCase', 'Match case', 'Aa'],
  ['wholeWord', 'Whole word', 'ab'],
  ['regex', 'Regex', '.*'],
]

/**
 * Search box for the top of the tree pane: a text field with Match case, Whole word and Regex
 * toggle buttons (`aria-pressed`) and a clear button. Escape clears; ArrowDown or Enter moves focus to the results, and Escape there returns here. Shows "Invalid pattern"
 * inline for a bad regex.
 */
export default function SearchBox({
  query,
  options,
  invalid,
  statusText,
  onQueryChange,
  onOptionsChange,
  onClear,
  onFocusResults,
  focusToken,
}: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focusToken !== 0) inputRef.current?.focus()
  }, [focusToken])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault()
      onFocusResults()
      return
    }
    if (event.key !== 'Escape' || query === '') return
    event.preventDefault()
    onClear()
  }

  return (
    <div className="search" role="search">
      <div className="search__field">
        <MagnifyingGlass />
        <input
          ref={inputRef}
          type="text"
          className="search__input"
          aria-label="Search files and folders"
          aria-invalid={invalid}
          placeholder="Search"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        {query !== '' && (
          <button type="button" className="search__toggle" aria-label="Clear search"
            onClick={() => {
              onClear()
              inputRef.current?.focus()
            }}
          >
            <Close />
          </button>
        )}
        {TOGGLES.map(([key, label, mark]) => (
          <button
            key={key}
            type="button"
            className="search__toggle"
            aria-pressed={options[key]}
            aria-label={label}
            title={label}
            onClick={() => onOptionsChange({ ...options, [key]: !options[key] })}
          >
            <span aria-hidden="true">{mark}</span>
          </button>
        ))}
      </div>
      {invalid && (
        <p className="search__error" role="alert">
          Invalid pattern
        </p>
      )}
      {statusText !== '' && (
        <p className="search__status" aria-hidden="true">
          {statusText}
        </p>
      )}
    </div>
  )
}

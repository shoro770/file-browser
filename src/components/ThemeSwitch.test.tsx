// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '../testHelpers'
import ThemeSwitch from './ThemeSwitch'

const radio = (name: string) => screen.getByRole('radio', { name })

beforeEach(() => {
  delete document.documentElement.dataset.theme
  window.localStorage.clear()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ThemeSwitch', () => {
  it('is a radiogroup named Theme with three labelled radios', () => {
    render(<ThemeSwitch />)
    const group = screen.getByRole('radiogroup', { name: 'Theme' })
    expect(group).toBeInTheDocument()
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('value'))).toEqual(['light', 'dark', 'sand'])
    expect(radio('Light')).toBeChecked()
    expect(radio('Dark')).not.toBeChecked()
    expect(radio('Warm Sand')).not.toBeChecked()
  })

  it('hides every glyph from assistive technology and uses no style attribute', () => {
    const { container } = render(<ThemeSwitch />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(6)
    svgs.forEach((svg) => expect(svg).toHaveAttribute('aria-hidden', 'true'))
    expect(container.querySelector('[style]')).toBeNull()
  })

  // CSS decides which check is visible (jsdom loads no stylesheet), so this pins the structure:
  // every segment reserves a check slot, and exactly one segment is marked active.
  it('reserves a check slot in every segment and marks only the active one', () => {
    const { container } = render(<ThemeSwitch />)
    expect(container.querySelectorAll('.theme-switch__check').length).toBe(3)
    expect(container.querySelectorAll('.is-active').length).toBe(1)
    expect(container.querySelector('.is-active')).toHaveTextContent('Light')
    fireEvent.click(radio('Dark'))
    expect(container.querySelectorAll('.is-active').length).toBe(1)
    expect(container.querySelector('.is-active')).toHaveTextContent('Dark')
  })

  it('applies the choice to <html> at once and remembers it', () => {
    render(<ThemeSwitch />)
    fireEvent.click(radio('Warm Sand'))
    expect(document.documentElement.dataset.theme).toBe('sand')
    expect(window.localStorage.getItem('theme')).toBe('sand')
    expect(radio('Warm Sand')).toBeChecked()
    expect(window.localStorage.length).toBe(1)
  })

  // jsdom does not implement a radio group's Tab and arrow-key behaviour, so this only proves the
  // markup that gives it in a browser: native radios sharing one name. The keys are logged as not run.
  it('is built as native radios in one named group, so the browser makes it one tab stop', () => {
    render(<ThemeSwitch />)
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios.every((r) => r.type === 'radio')).toBe(true)
    expect(new Set(radios.map((r) => r.name)).size).toBe(1)
    expect(radios[0].name).not.toBe('')
  })

  it('does not touch the status region', () => {
    render(
      <>
        <div role="status" />
        <ThemeSwitch />
      </>,
    )
    fireEvent.click(radio('Dark'))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('starts from the stored theme, even when the system prefers dark', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    window.localStorage.setItem('theme', 'sand')
    render(<ThemeSwitch />)
    expect(radio('Warm Sand')).toBeChecked()
  })

  it('starts from the system setting when nothing is stored, never Warm Sand', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<ThemeSwitch />)
    expect(radio('Dark')).toBeChecked()
  })

  it('ignores an invalid stored value', () => {
    window.localStorage.setItem('theme', 'purple')
    render(<ThemeSwitch />)
    expect(radio('Light')).toBeChecked()
  })

  it('prefers the theme already on <html> (set before first paint)', () => {
    document.documentElement.dataset.theme = 'dark'
    render(<ThemeSwitch />)
    expect(radio('Dark')).toBeChecked()
  })

  it('still applies the choice, silently, when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    render(<ThemeSwitch />)
    fireEvent.click(radio('Dark'))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(radio('Dark')).toBeChecked()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

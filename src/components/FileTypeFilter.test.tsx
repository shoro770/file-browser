// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import '../testHelpers'
import type { FileItem } from '../types'
import FileTypeFilter from './FileTypeFilter'

const file = (name: string): FileItem => ({ id: name, name, path: `/${name}`, isDirectory: false })
const items = { 'a.html': file('a.html'), 'b.pdf': file('b.pdf'), Makefile: file('Makefile') }

describe('FileTypeFilter', () => {
  it('is a labelled combobox listing All files and the loaded extensions', () => {
    render(<FileTypeFilter items={items} value={null} onChange={vi.fn()} onAnnounce={vi.fn()} />)
    const box = screen.getByRole('combobox', { name: 'File type' })
    expect([...(box as HTMLSelectElement).options].map((option) => option.text)).toEqual(['All files', '.html', '.pdf'])
    expect(box).toHaveValue('')
  })

  it('reports the choice and announces it', () => {
    const onChange = vi.fn()
    const onAnnounce = vi.fn()
    render(<FileTypeFilter items={items} value={null} onChange={onChange} onAnnounce={onAnnounce} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pdf' } })
    expect(onChange).toHaveBeenCalledWith('pdf')
    expect(onAnnounce).toHaveBeenCalledWith('Showing only .pdf files')
  })

  it('keeps a chosen type listed even when no loaded file has it', () => {
    render(<FileTypeFilter items={items} value="md" onChange={vi.fn()} onAnnounce={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveValue('md')
  })
})

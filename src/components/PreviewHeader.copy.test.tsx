// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NOW, makeSource } from '../testHelpers'
import PreviewHeader from './PreviewHeader'

afterEach(() => vi.unstubAllGlobals())

function setup(name = 'a.txt', kind: 'text' | 'markdown' | 'image' = 'text', file = new File(['whole file'], name)) {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  const onAnnounce = vi.fn()
  const source = makeSource(name, kind)
  render(
    <PreviewHeader
      meta={source.meta}
      titleId="t"
      now={NOW}
      id={`sub/${name}`}
      rootName="myfolder"
      file={file}
      onAnnounce={onAnnounce}
    />,
  )
  return { writeText, onAnnounce }
}

describe('PreviewHeader copy buttons', () => {
  it('copies the name', async () => {
    const { writeText, onAnnounce } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Copy file name' }))
    await waitFor(() => expect(onAnnounce).toHaveBeenCalledWith('Copied name'))
    expect(writeText).toHaveBeenCalledWith('a.txt')
  })

  it('shows each button\'s label as its tip, then "Copied" after a click', async () => {
    setup()
    const button = screen.getByRole('button', { name: 'Copy file name' })
    expect(button).toHaveAttribute('data-tip', 'Copy file name')
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveAttribute('data-tip', 'Copied'))
    expect(button).toHaveClass('is-flashing')
    expect(screen.getByRole('button', { name: 'Copy path' })).toHaveAttribute('data-tip', 'Copy path')
  })

  it('drops a "Copied" tip when the pointer moves to another button', async () => {
    setup()
    const name = screen.getByRole('button', { name: 'Copy file name' })
    fireEvent.click(name)
    await waitFor(() => expect(name).toHaveAttribute('data-tip', 'Copied'))
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Copy path' }))
    expect(name).toHaveAttribute('data-tip', 'Copy file name')
    expect(name).not.toHaveClass('is-flashing')
  })

  it('keeps the buttons after the modified stamp, so their place does not depend on the name', () => {
    setup('a-very-long-name.txt')
    const stamp = screen.getByText(/Modified/)
    const first = screen.getByRole('button', { name: 'Copy file name' })
    expect(stamp.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('copies the opened folder name plus the relative path', async () => {
    const { writeText, onAnnounce } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Copy path' }))
    await waitFor(() => expect(onAnnounce).toHaveBeenCalledWith('Copied path'))
    expect(writeText).toHaveBeenCalledWith('myfolder/sub/a.txt')
  })

  it('copies the whole file for a text file', async () => {
    const { writeText, onAnnounce } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Copy content' }))
    await waitFor(() => expect(onAnnounce).toHaveBeenCalledWith('Copied content'))
    expect(writeText).toHaveBeenCalledWith('whole file')
  })

  it('announces a failure when the clipboard refuses', async () => {
    const { writeText, onAnnounce } = setup()
    writeText.mockRejectedValue(new Error('denied'))
    const button = screen.getByRole('button', { name: 'Copy file name' })
    fireEvent.click(button)
    await waitFor(() => expect(onAnnounce).toHaveBeenCalledWith("Couldn't copy"))
    expect(button).toHaveAttribute('data-tip', "Couldn't copy")
  })

  it('has no content button for an image', () => {
    setup('p.png', 'image')
    expect(screen.queryByRole('button', { name: 'Copy content' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Copy path' })).toBeEnabled()
  })

  it('disables the content button above 10 MB', () => {
    const big = new File(['x'], 'big.txt')
    Object.defineProperty(big, 'size', { value: 10_485_761 })
    setup('big.txt', 'text', big)
    expect(screen.getByRole('button', { name: 'Copy content' })).toBeDisabled()
  })
})

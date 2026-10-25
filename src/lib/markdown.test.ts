import { describe, expect, it } from 'vitest'
import { anchorTarget, headingIds, slugify } from './markdown'

describe('slugify', () => {
  it('lower-cases, drops punctuation and joins words', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
    expect(slugify('  Über uns  ')).toBe('über-uns')
  })

  it('keeps underscores and combining marks', () => {
    expect(slugify('snake_case Name')).toBe('snake_case-name')
    expect(slugify('हिन्दी')).toBe('हिन्दी')
  })

  it('returns an empty string when nothing is left', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('headingIds', () => {
  it('prefixes ids and de-duplicates repeats in order', () => {
    expect(headingIds(['Intro', 'Intro', 'Intro', 'Other'])).toEqual(['md-intro', 'md-intro-1', 'md-intro-2', 'md-other'])
  })

  it('never repeats an id, even when a suffixed id equals another heading', () => {
    const ids = headingIds(['Intro', 'Intro', 'Intro 1', 'Intro 1'])
    expect(new Set(ids).size).toBe(4)
    expect(ids[0]).toBe('md-intro')
  })

  it('never produces an app id', () => {
    expect(headingIds(['root', 'preview-title'])).toEqual(['md-root', 'md-preview-title'])
    expect(headingIds(['***'])).toEqual(['md-section'])
  })
})

describe('anchorTarget', () => {
  it('maps a fragment to the generated id', () => {
    expect(anchorTarget('#My-Heading')).toBe('md-my-heading')
    expect(anchorTarget('#hello%20world')).toBe('md-hello-world')
  })

  it('rejects non-fragments and empty fragments', () => {
    expect(anchorTarget('https://e.com/#x')).toBeNull()
    expect(anchorTarget('#')).toBeNull()
  })

  it('survives a malformed escape', () => {
    expect(anchorTarget('#100%')).toBe('md-100')
  })
})

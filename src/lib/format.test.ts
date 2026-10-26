import { describe, expect, it } from 'vitest'
import { describeContents } from './format'

describe('describeContents', () => {
  it('says Empty at zero', () => expect(describeContents(0, 0)).toBe('Empty'))
  it('uses singular and plural forms', () => {
    expect(describeContents(1, 0)).toBe('1 folder')
    expect(describeContents(0, 1)).toBe('1 file')
    expect(describeContents(2, 3)).toBe('2 folders, 3 files')
    expect(describeContents(1, 2)).toBe('1 folder, 2 files')
  })
})

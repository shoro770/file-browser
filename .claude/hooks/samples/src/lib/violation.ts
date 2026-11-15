// Sample target for post_edit_violation.json. Intentionally breaks the "src/lib/ is pure" rule.
import { useState } from 'react'
import { readFile } from '../services/fs'

export function widthFromStorage(): number {
  return Number(window.localStorage.getItem('width') ?? 0)
}

export const unused = [useState, readFile]

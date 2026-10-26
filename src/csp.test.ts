/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** The production policy (AD-12). Change it only with a recorded reason (SM-C1). */
const EXPECTED =
  "default-src 'self'; connect-src 'none'; img-src 'self' blob: data:; object-src blob:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'"

const html = readFileSync(join(import.meta.dirname, '..', 'index.html'), 'utf8')
const csp = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/.exec(html)?.[1]

describe('index.html CSP', () => {
  it('carries the production policy as a meta tag', () => {
    expect(csp).toBe(EXPECTED)
  })

  it('never allows inline or eval script and style, or network connections', () => {
    expect(csp).not.toMatch(/unsafe-(inline|eval)/)
    expect(csp).toContain("connect-src 'none'")
  })

  it('has no inline script or style in the page, and says it is a second wall', () => {
    expect(html).not.toMatch(/<script(?![^>]*\ssrc=)/)
    expect(html).not.toMatch(/<style|\sstyle=/)
    expect(html).toMatch(/second wall, not a guarantee/i)
    expect(html).toMatch(/frame-ancestors/)
  })
})

import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/**
 * Dev-server only: the React refresh preamble and Vite's injected styles are inline, and HMR
 * uses a WebSocket, so the production policy in index.html would break `npm run dev`. This
 * relaxation never applies to `vite build` or `vite preview` and is not evidence for the CSP.
 */
const devCsp: Plugin = {
  name: 'dev-csp',
  apply: 'serve',
  transformIndexHtml: (html) => {
    const swaps: ReadonlyArray<readonly [string, string]> = [
      ["connect-src 'none'", "connect-src 'self' ws:"],
      [" style-src 'self'", " style-src 'self' 'unsafe-inline'"],
      [" script-src 'self'", " script-src 'self' 'unsafe-inline'"],
    ]
    return swaps.reduce((out, [from, to]) => {
      if (!out.includes(from)) throw new Error(`dev-csp: index.html no longer contains "${from}"`)
      return out.replace(from, to)
    }, html)
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devCsp],
  test: {
    // mammoth swaps its zip reader for a browser one through the package `browser` field, which
    // Vite applies in the app build but not under Vitest's Node resolution. Tests take the
    // prebuilt browser bundle so they exercise the same ArrayBuffer path as the app.
    alias: { mammoth: 'mammoth/mammoth.browser.js' },
  },
})

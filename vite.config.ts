import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // mammoth swaps its zip reader for a browser one through the package `browser` field, which
    // Vite applies in the app build but not under Vitest's Node resolution. Tests take the
    // prebuilt browser bundle so they exercise the same ArrayBuffer path as the app.
    alias: { mammoth: 'mammoth/mammoth.browser.js' },
  },
})

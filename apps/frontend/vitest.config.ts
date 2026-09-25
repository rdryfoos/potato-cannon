import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'jsdom',
    // Refuses the run on a Node whose localStorage is the empty one, and says why.
    // See vitest.setup.ts: one sentence instead of thirty-three zustand traces.
    setupFiles: ['./vitest.setup.ts']
  }
})

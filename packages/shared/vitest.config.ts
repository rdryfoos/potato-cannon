import { defineConfig } from 'vitest/config'

// The shared package has logic of its own now, and logic without a test run is logic
// nobody checks. Node environment: nothing here touches a DOM.
export default defineConfig({
  test: {
    name: '@potato-cannon/shared',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

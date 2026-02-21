import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    include: ['**/*.test.ts'],
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

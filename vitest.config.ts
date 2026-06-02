import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    globals: true
  },
  resolve: {
    alias: {
      '@fgl': resolve(__dirname, 'src/fgl'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
})

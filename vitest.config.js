import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@server': path.resolve(__dirname, './src/index.ts'),
      '@configurations': path.resolve(__dirname, './src/configurations/index.ts')
    },
  },
})

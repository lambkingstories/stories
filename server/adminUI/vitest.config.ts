import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// The admin tests have their own config (with absolute paths: a relative setup file was looked up in the server folder, whose
// setup starts a MongoDB for every test file).
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    root: path.resolve(__dirname),
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.spec.ts'],
    setupFiles: [path.resolve(__dirname, 'tests/setup.ts')]
  }
})

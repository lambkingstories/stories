import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [
    vue({
      // Absolute `src="/images/…"` paths are `public/` assets that Vite
      // serves verbatim. The dev/build config resolves them through the
      // public dir; here there is none, so leave them untransformed instead
      // of failing to resolve `file:///images/…` while mounting a component.
      template: { transformAssetUrls: { includeAbsolute: false } }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // the first mount of a big screen compiles it; on a busy machine that can take longer than 5 s
    testTimeout: 20000,
    // the tests do not depend on a local `.env.local` (the Noah journey is only shown there, see data/adventures/index.ts)
    env: { VITE_SHOW_NOAH: 'false', VITE_SHOW_ADAM: 'false', VITE_SHOW_BABEL: 'false', VITE_SHOW_ABRAHAM: 'false', VITE_SHOW_JAKOB: 'false', VITE_SHOW_JOSUA: 'false', VITE_SHOW_GIDEON: 'false', VITE_SHOW_MOSE: 'false', VITE_SHOW_JONA: 'false' }
  }
})
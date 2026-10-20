import { stripAbrahamFiles, stripAdamFiles, stripBabelFiles, stripGideonFiles, stripJakobFiles, stripJosuaFiles, stripMoseFiles, stripNoahFiles } from './vite.config.noah'
import { fileURLToPath, URL } from 'node:url'
import { resolve, dirname } from 'node:path'
import { rmSync } from 'node:fs'

import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import javascriptObfuscator from 'vite-plugin-javascript-obfuscator'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' loads all env vars regardless of VITE_ prefix.
  const env = loadEnv(mode, process.cwd(), '')

  const isProduction = mode === 'production' || env.VITE_NODE_ENV === 'production'
  const shouldObfuscate = env.VITE_ENABLE_OBFUSCATION === 'true'

  // Initialize plugins array
  const plugins = []

  // Only push the obfuscator if both conditions are met
  if (isProduction && shouldObfuscate) {
    console.log('--- 🛡️  Obfuscating Production Build ---')
    plugins.push(
      javascriptObfuscator({
        // pdfjs-dist and its bundled worker are too large + too dynamically
        // structured to obfuscate without breaking dynamic imports. Skipping
        // them keeps the route-level chunking intact and lets PDFs load.
        exclude: [/node_modules\/pdfjs-dist/, /pdf\.worker/],
        options: {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          numbersToExpressions: true,
          simplify: true,
          stringArray: true,
          stringArrayThreshold: 0.75,
          splitStrings: true,
          unicodeEscapeSequence: true
        }
      })
    )
  }

  // Test-only coloring books (see src/data/localColoringBooks.ts) live in public/, which Vite copies into every
  // build. Unless the build is a test build (VITE_LOCAL_TEST_BOOKS=true) their pictures are taken out again, so a
  // store build never ships them.
  let outDir = 'dist'
  const stripLocalTestBooks: Plugin = {
    name: 'strip-local-test-books',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      if (env.VITE_LOCAL_TEST_BOOKS !== 'true') rmSync(resolve(outDir, 'images/ausmalbuecher'), { recursive: true, force: true })
      // The journey "Noah" is not public yet (see src/data/adventures/index.ts): its pictures are taken out of every build that does
      // not contain it (`VITE_INCLUDE_NOAH=true` is the hidden test build, `vite --mode noah` shows it always).
      if (env.VITE_SHOW_NOAH !== 'true' && env.VITE_INCLUDE_NOAH !== 'true') {
        stripNoahFiles(outDir)
      }
      // The same for "Adam und Eva" (`VITE_INCLUDE_ADAM=true` / `vite --mode adam`).
      if (env.VITE_SHOW_ADAM !== 'true' && env.VITE_INCLUDE_ADAM !== 'true') {
        stripAdamFiles(outDir)
      }
      // The same for "Der Turm von Babel" (`VITE_INCLUDE_BABEL=true` / `vite --mode babel`).
      if (env.VITE_SHOW_BABEL !== 'true' && env.VITE_INCLUDE_BABEL !== 'true') {
        stripBabelFiles(outDir)
      }
      // The same for "Abraham" (`VITE_INCLUDE_ABRAHAM=true` / `vite --mode abraham`).
      if (env.VITE_SHOW_ABRAHAM !== 'true' && env.VITE_INCLUDE_ABRAHAM !== 'true') {
        stripAbrahamFiles(outDir)
      }
      // The same for "Jakob" (`VITE_INCLUDE_JAKOB=true` / `vite --mode jakob`).
      if (env.VITE_SHOW_JAKOB !== 'true' && env.VITE_INCLUDE_JAKOB !== 'true') {
        stripJakobFiles(outDir)
      }
      // The same for "Josua" (`VITE_INCLUDE_JOSUA=true` / `vite --mode josua`).
      if (env.VITE_SHOW_JOSUA !== 'true' && env.VITE_INCLUDE_JOSUA !== 'true') {
        stripJosuaFiles(outDir)
      }
      // The same for "Gideon" (`VITE_INCLUDE_GIDEON=true` / `vite --mode gideon`).
      if (env.VITE_SHOW_GIDEON !== 'true' && env.VITE_INCLUDE_GIDEON !== 'true') {
        stripGideonFiles(outDir)
      }
      // The same for "Mose" (`VITE_INCLUDE_MOSE=true` / `vite --mode mose`).
      if (env.VITE_SHOW_MOSE !== 'true' && env.VITE_INCLUDE_MOSE !== 'true') {
        stripMoseFiles(outDir)
      }
    }
  }
  plugins.push(stripLocalTestBooks)

  return {
    base: '/',
    server: {
      port: 5001
    },
    define: {
      APP_VERSION: JSON.stringify(process.env.npm_package_version)
    },
    plugins: [
      tailwindcss(),
      vue(),
      // vueDevTools(),
      VueI18nPlugin({
        // 1. Tell the plugin where your global translation files are
        include: [resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**'), resolve(dirname(fileURLToPath(import.meta.url)), './src/i18n/**')],

        // 2. This allows you to use YAML in the <i18n> block
        // The plugin usually detects yaml automatically, but you can force
        // strict behavior if needed by ensuring the 'yaml' loader is available.
        defaultSFCLang: 'yaml',
        runtimeOnly: false
      }),
      ...plugins
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@/': fileURLToPath(new URL('./src/', import.meta.url)),
        '#': fileURLToPath(new URL('./src/assets', import.meta.url))
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    build: {
      minify: 'esbuild',
      // Disable source maps in production if you want maximum protection
      sourcemap: !shouldObfuscate
    }
  }
})

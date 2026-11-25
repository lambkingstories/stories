import { stripAbrahamFiles, stripAdamFiles, stripBabelFiles, stripDanielFiles, stripEliaFiles, stripGideonFiles, stripJakobFiles, stripJonaFiles, stripJosuaFiles, stripMoseFiles, stripNoahFiles, stripRutFiles, stripSamuelFiles, stripDavidFiles, stripSalomoFiles, stripElisaFiles, stripEsterFiles, stripNehemiaFiles, stripProphetenFiles, stripWeihnachtenFiles, stripTaufeFiles, stripFreundeFiles, stripWuesteFiles, stripWunderFiles, stripHeilungFiles, stripGleichnisseFiles, stripZachaeusFiles, stripLetztewocheFiles, stripOsternFiles, stripPfingstenFiles, stripPaulusFiles, stripPaulusromFiles, stripOffenbarungFiles, stripSohnFiles, stripIchbinFiles, stripBergpredigtFiles, stripSimsonFiles, stripJohannesFiles, stripHiskiaFiles } from './vite.config.noah'
import { splitMediaFiles } from './vite.config.media'
import { fileURLToPath, URL } from 'node:url'
import { resolve, dirname } from 'node:path'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import javascriptObfuscator from 'vite-plugin-javascript-obfuscator'

/**
 * The "Stand" shown at the bottom of the Me page (`BuildStamp.vue`): the date of the build and the short commit number, read at build time.
 * Without Git (no repository, no `git` program) the commit stays empty and the page says "Entwicklung". A trailing "+" means: files that
 * Git knows were changed and not yet committed when the build was made.
 */
function buildStamp(): { date: string; commit: string } {
  const now = new Date()
  const date = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.`
  try {
    const run = (cmd: string) => execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    const commit = run('git rev-parse --short HEAD')
    const dirty = run('git status --porcelain --untracked-files=no') !== ''
    return { date, commit: commit ? commit + (dirty ? '+' : '') : '' }
  } catch {
    return { date, commit: '' }
  }
}

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
  let projectRoot = ''
  const stripLocalTestBooks: Plugin = {
    name: 'strip-local-test-books',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
      projectRoot = config.root
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
      // The same for "Jona" (`VITE_INCLUDE_JONA=true` / `vite --mode jona`).
      if (env.VITE_SHOW_JONA !== 'true' && env.VITE_INCLUDE_JONA !== 'true') {
        stripJonaFiles(outDir)
      }
      // The same for "Daniel" (`VITE_INCLUDE_DANIEL=true` / `vite --mode daniel`).
      if (env.VITE_SHOW_DANIEL !== 'true' && env.VITE_INCLUDE_DANIEL !== 'true') {
        stripDanielFiles(outDir)
      }
      // The same for "Elia" (`VITE_INCLUDE_ELIA=true` / `vite --mode elia`).
      if (env.VITE_SHOW_ELIA !== 'true' && env.VITE_INCLUDE_ELIA !== 'true') {
        stripEliaFiles(outDir)
      }
      // The same for "Rut" (`VITE_INCLUDE_RUT=true` / `vite --mode rut`).
      if (env.VITE_SHOW_RUT !== 'true' && env.VITE_INCLUDE_RUT !== 'true') {
        stripRutFiles(outDir)
      }
      // The same for "Samuel und Saul" (`VITE_INCLUDE_SAMUEL=true` / `vite --mode samuel`).
      if (env.VITE_SHOW_SAMUEL !== 'true' && env.VITE_INCLUDE_SAMUEL !== 'true') {
        stripSamuelFiles(outDir)
      }
      // The same for "David" (`VITE_INCLUDE_DAVID=true` / `vite --mode david`).
      if (env.VITE_SHOW_DAVID !== 'true' && env.VITE_INCLUDE_DAVID !== 'true') {
        stripDavidFiles(outDir)
      }
      // The same for "Salomo" (`VITE_INCLUDE_SALOMO=true` / `vite --mode david`).
      if (env.VITE_SHOW_SALOMO !== 'true' && env.VITE_INCLUDE_SALOMO !== 'true') {
        stripSalomoFiles(outDir)
      }
      // The same for "Elisa" (`VITE_INCLUDE_ELISA=true` / `vite --mode david`).
      if (env.VITE_SHOW_ELISA !== 'true' && env.VITE_INCLUDE_ELISA !== 'true') {
        stripElisaFiles(outDir)
      }
      // The same for "Ester" (`VITE_INCLUDE_ESTER=true` / `vite --mode ester`).
      if (env.VITE_SHOW_ESTER !== 'true' && env.VITE_INCLUDE_ESTER !== 'true') {
        stripEsterFiles(outDir)
      }
      // The same for "Nehemia" (`VITE_INCLUDE_NEHEMIA=true` / `vite --mode ester`).
      if (env.VITE_SHOW_NEHEMIA !== 'true' && env.VITE_INCLUDE_NEHEMIA !== 'true') {
        stripNehemiaFiles(outDir)
      }
      // The same for "Propheten" (`VITE_INCLUDE_PROPHETEN=true` / `vite --mode propheten`).
      if (env.VITE_SHOW_PROPHETEN !== 'true' && env.VITE_INCLUDE_PROPHETEN !== 'true') {
        stripProphetenFiles(outDir)
      }
      // The same for "Weihnachten" (`VITE_INCLUDE_WEIHNACHTEN=true` / `vite --mode weihnachten`).
      if (env.VITE_SHOW_WEIHNACHTEN !== 'true' && env.VITE_INCLUDE_WEIHNACHTEN !== 'true') {
        stripWeihnachtenFiles(outDir)
      }
      // The same for "Taufe" (`VITE_INCLUDE_TAUFE=true` / `vite --mode taufe`).
      if (env.VITE_SHOW_TAUFE !== 'true' && env.VITE_INCLUDE_TAUFE !== 'true') {
        stripTaufeFiles(outDir)
      }
      // The same for "Freunde" (`VITE_INCLUDE_FREUNDE=true` / `vite --mode freunde`).
      if (env.VITE_SHOW_FREUNDE !== 'true' && env.VITE_INCLUDE_FREUNDE !== 'true') {
        stripFreundeFiles(outDir)
      }
      // The same for "Das Volk in der Wüste" (`VITE_INCLUDE_WUESTE=true` / `vite --mode wueste`).
      if (env.VITE_SHOW_WUESTE !== 'true' && env.VITE_INCLUDE_WUESTE !== 'true') {
        stripWuesteFiles(outDir)
      }
      // The same for "Jesu Wunder am See" (`VITE_INCLUDE_WUNDER=true` / `vite --mode wunder`).
      if (env.VITE_SHOW_WUNDER !== 'true' && env.VITE_INCLUDE_WUNDER !== 'true') {
        stripWunderFiles(outDir)
      }
      // The same for "Jesus heilt" (`VITE_INCLUDE_HEILUNG=true` / `vite --mode heilung`).
      if (env.VITE_SHOW_HEILUNG !== 'true' && env.VITE_INCLUDE_HEILUNG !== 'true') {
        stripHeilungFiles(outDir)
      }
      // The same for "Geschichten von Jesus" (`VITE_INCLUDE_GLEICHNISSE=true` / `vite --mode gleichnisse`).
      if (env.VITE_SHOW_GLEICHNISSE !== 'true' && env.VITE_INCLUDE_GLEICHNISSE !== 'true') {
        stripGleichnisseFiles(outDir)
      }
      // The same for "Zachäus und Lazarus" (`VITE_INCLUDE_ZACHAEUS=true` / `vite --mode zachaeus`).
      if (env.VITE_SHOW_ZACHAEUS !== 'true' && env.VITE_INCLUDE_ZACHAEUS !== 'true') {
        stripZachaeusFiles(outDir)
      }
      // The same for "Die letzte Woche" (`VITE_INCLUDE_LETZTEWOCHE=true` / `vite --mode letztewoche`).
      if (env.VITE_SHOW_LETZTEWOCHE !== 'true' && env.VITE_INCLUDE_LETZTEWOCHE !== 'true') {
        stripLetztewocheFiles(outDir)
      }
      // The same for "Ostern" (`VITE_INCLUDE_OSTERN=true` / `vite --mode ostern`).
      if (env.VITE_SHOW_OSTERN !== 'true' && env.VITE_INCLUDE_OSTERN !== 'true') {
        stripOsternFiles(outDir)
      }
      // The same for "Pfingsten" (`VITE_INCLUDE_PFINGSTEN=true` / `vite --mode pfingsten`).
      if (env.VITE_SHOW_PFINGSTEN !== 'true' && env.VITE_INCLUDE_PFINGSTEN !== 'true') {
        stripPfingstenFiles(outDir)
      }
      // The same for "Paulus" (`VITE_INCLUDE_PAULUS=true` / `vite --mode paulus`).
      if (env.VITE_SHOW_PAULUS !== 'true' && env.VITE_INCLUDE_PAULUS !== 'true') {
        stripPaulusFiles(outDir)
      }
      // The same for "Bis nach Rom" (`VITE_INCLUDE_PAULUSROM=true` / `vite --mode paulusrom`).
      if (env.VITE_SHOW_PAULUSROM !== 'true' && env.VITE_INCLUDE_PAULUSROM !== 'true') {
        stripPaulusromFiles(outDir)
      }
      // The same for "Alles wird neu" (`VITE_INCLUDE_OFFENBARUNG=true` / `vite --mode offenbarung`).
      if (env.VITE_SHOW_OFFENBARUNG !== 'true' && env.VITE_INCLUDE_OFFENBARUNG !== 'true') {
        stripOffenbarungFiles(outDir)
      }
      // The same for "Der verlorene Sohn" (`VITE_INCLUDE_SOHN=true` / `vite --mode sohn`).
      if (env.VITE_SHOW_SOHN !== 'true' && env.VITE_INCLUDE_SOHN !== 'true') {
        stripSohnFiles(outDir)
      }
      // The same for "Jesus erzählt von sich" (`VITE_INCLUDE_ICHBIN=true` / `vite --mode ichbin`).
      if (env.VITE_SHOW_ICHBIN !== 'true' && env.VITE_INCLUDE_ICHBIN !== 'true') {
        stripIchbinFiles(outDir)
      }
      // The same for "Die Bergpredigt" (`VITE_INCLUDE_BERGPREDIGT=true` / `vite --mode bergpredigt`).
      if (env.VITE_SHOW_BERGPREDIGT !== 'true' && env.VITE_INCLUDE_BERGPREDIGT !== 'true') {
        stripBergpredigtFiles(outDir)
      }
      // The same for "Simson" (`VITE_INCLUDE_SIMSON=true` / `vite --mode simson`).
      if (env.VITE_SHOW_SIMSON !== 'true' && env.VITE_INCLUDE_SIMSON !== 'true') {
        stripSimsonFiles(outDir)
      }
      // The same for "Johannes der Täufer" (`VITE_INCLUDE_JOHANNES=true` / `vite --mode johannes`).
      if (env.VITE_SHOW_JOHANNES !== 'true' && env.VITE_INCLUDE_JOHANNES !== 'true') {
        stripJohannesFiles(outDir)
      }
      // The same for "Hiskia: Ein Brief vor Gott" (`VITE_INCLUDE_HISKIA=true` / `vite --mode hiskia`).
      if (env.VITE_SHOW_HISKIA !== 'true' && env.VITE_INCLUDE_HISKIA !== 'true') {
        stripHiskiaFiles(outDir)
      }
      // Media outside the program file (the test for 1.3, see src/utils/mediaSplit.ts): after the strips above, so only media that belong to the build are moved.
      if (env.VITE_MEDIA_SPLIT) {
        const ids = env.VITE_MEDIA_SPLIT.split(',').map((x) => x.trim()).filter(Boolean)
        const r = splitMediaFiles(outDir, projectRoot, ids, env.VITE_MEDIA_SPLIT_WEB === 'true')
        console.log(`[media-split] ${ids.join(',')}: ${r.moved} folders moved to ${r.target}`)
      }
    }
  }
  plugins.push(stripLocalTestBooks)

  // The test site (Cloudflare Pages) answers every picture with `max-age=0, must-revalidate`: each visit asks again for every picture. The apps for the stores
  // (`VITE_APP_NATIVE=true`) read their files from the package and are left as they are. A picture is kept for ten minutes and then shown at once while it is
  // checked in the background (`stale-while-revalidate`), so a picture that was replaced under its old name still arrives with the next visit.
  const testSiteHeaders: Plugin = {
    name: 'test-site-headers',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      if (env.VITE_APP_NATIVE === 'true') return
      const file = resolve(outDir, '_headers')
      const rules = ['', '/images/*', '  Cache-Control: public, max-age=600, stale-while-revalidate=604800', ''].join(String.fromCharCode(10))
      try {
        writeFileSync(file, (existsSync(file) ? readFileSync(file, 'utf8') : '') + rules)
      } catch {
        // without the file the host keeps its own default
      }
    }
  }
  plugins.push(testSiteHeaders)

  return {
    base: '/',
    server: {
      port: 5001
    },
    define: {
      APP_VERSION: JSON.stringify(process.env.npm_package_version),
      __BUILD_STAMP__: JSON.stringify(buildStamp())
    },
    plugins: [
      tailwindcss(),
      vue(),
      // vueDevTools(),
      VueI18nPlugin({
        // 1. Tell the plugin where your global translation files are
        include: [resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**'), resolve(dirname(fileURLToPath(import.meta.url)), './src/i18n/*.ts'), resolve(dirname(fileURLToPath(import.meta.url)), './src/i18n/es/*.ts')],

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
      // Disable source maps in production if you want maximum protection. The apps for the stores (Tauri: `VITE_APP_NATIVE=true`) do not carry
      // them either: nobody reads them there and they are 16 MB of dead weight in the package (the Pages test app keeps them).
      sourcemap: !shouldObfuscate && env.VITE_APP_NATIVE !== 'true',
      // Test site only: the data of all adventures (35 small files, one request each) is one file, so the first screen waits for one answer instead of 35.
      // In the apps for the stores the files lie in the package and stay as they are.
      rollupOptions:
        env.VITE_APP_NATIVE === 'true'
          ? undefined
          : { output: { manualChunks: (id: string) => (/\/src\/data\/adventures\/(?!index\.ts)/.test(id) ? 'adventures' : undefined) } }
    }
  }
})

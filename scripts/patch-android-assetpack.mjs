#!/usr/bin/env node
// Android: the media of the adventures go into Play Asset Delivery packs instead of into the app itself, so the main file stays small
// (decision of Anton, 24.11.2026; research in H:\Claude\research_notes\Wie andere Apps große Medien laden). Run after `tauri android init` and after
// `VITE_MEDIA_SPLIT=* pnpm build-only` (which makes `dist-media`). Idempotent.
//
//  1. packs (modules in src-tauri/gen/android):
//       lkcore       fast-follow  the shared pictures (games of several adventures), the medals, cards and gifts of every adventure, the sentinel picture
//       adv_<id>     on-demand    one per adventure: images/abenteuer/<id>/, images/abenteuer/spiele/<id>/ and audio/abenteuer/<id>/ (loaded when the child opens it)
//  2. includes the modules in settings.gradle(.kts) and lists them as asset packs in app/build.gradle.kts, adds the Play library
//  3. puts LkMedia.kt (the little web server on the phone) next to MainActivity and starts it from MainActivity.onCreate
//  4. allows plain http to 127.0.0.1 (only that) through a network security config

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = process.env.LK_ROOT ?? SCRIPT_ROOT
const ANDROID = join(ROOT, 'src-tauri/gen/android')
const APP = join(ANDROID, 'app')
const MEDIA = join(ROOT, 'dist-media')
const CORE = 'lkcore'
const LIB = 'com.google.android.play:asset-delivery:2.3.0'
const MARK = 'managed by scripts/patch-android-assetpack.mjs'
// files of an adventure folder that every screen of the app needs even when the adventure is not downloaded (the overview, the collection, the gifts)
// (the same list is in LkMedia.kt, `keepInCore`; the test tests/androidCoreFiles.test.ts keeps both in step and checks every adventure against it)
// medaillon-ring = the gold ring of every map station (it lies in the folder of Josef and every adventure uses it), reise = the cover of Josef on the start page
const CORE_FILES = ['medaille', 'karte-vorn', 'karte-hinten', 'geschenk', 'medaillon-ring', 'reise']
const KEEP_IN_CORE = new RegExp('^(' + CORE_FILES.join('|') + ')')

const fail = (msg) => {
  console.error(`[patch-android-assetpack] ${msg}`)
  process.exit(1)
}
const dirsOf = (p) => (existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : [])
const packNameOf = (id) => 'adv_' + id.replace(/-/g, '_')
const sizeOf = (p) => {
  let n = 0
  if (!existsSync(p)) return 0
  for (const e of readdirSync(p, { withFileTypes: true })) n += e.isDirectory() ? sizeOf(join(p, e.name)) : statSync(join(p, e.name)).size
  return n
}

if (!existsSync(join(APP, 'build.gradle.kts'))) fail('no generated Android project (run `tauri android init` first)')
if (!existsSync(MEDIA)) fail('no dist-media (run `VITE_MEDIA_SPLIT=* pnpm build-only` first)')

// ── 1. the packs ─────────────────────────────────────────────────────
// the adventures: every folder below images/abenteuer and audio/abenteuer of the split media (the shared games live in `spiele`, which is no adventure)
const ids = [...new Set([...dirsOf(join(MEDIA, 'images/abenteuer')), ...dirsOf(join(MEDIA, 'audio/abenteuer'))])].filter((d) => d !== 'spiele' && d !== 'ui').sort()

for (const old of dirsOf(ANDROID).filter((d) => d === CORE || d.startsWith('adv_'))) rmSync(join(ANDROID, old), { recursive: true, force: true })

function makePack(name, delivery) {
  const dir = join(ANDROID, name)
  mkdirSync(join(dir, 'src/main/assets'), { recursive: true })
  writeFileSync(
    join(dir, 'build.gradle.kts'),
    `// ${MARK}
plugins {
    id("com.android.asset-pack")
}

assetPack {
    packName.set("${name}")
    dynamicDelivery {
        deliveryType.set("${delivery}")
    }
}
`
  )
  return join(dir, 'src/main/assets')
}

// the core gets everything first, then each adventure takes its own folders out
const coreAssets = makePack(CORE, 'fast-follow')
cpSync(MEDIA, coreAssets, { recursive: true })
const names = [CORE]
for (const id of ids) {
  const assets = makePack(packNameOf(id), 'on-demand')
  names.push(packNameOf(id))
  const moves = [`images/abenteuer/${id}`, `audio/abenteuer/${id}`, `images/abenteuer/spiele/${id}`]
  for (const rel of moves) {
    const from = join(coreAssets, rel)
    if (!existsSync(from)) continue
    const to = join(assets, rel)
    mkdirSync(dirname(to), { recursive: true })
    if (rel === `images/abenteuer/${id}`) {
      // medals, cards and gifts stay in the core
      mkdirSync(to, { recursive: true })
      for (const e of readdirSync(from, { withFileTypes: true })) {
        if (e.isFile() && KEEP_IN_CORE.test(e.name)) continue
        renameSync(join(from, e.name), join(to, e.name))
      }
    } else {
      renameSync(from, to)
    }
  }
}
const mb = (n) => (n / 1048576).toFixed(1)
console.log(`[patch-android-assetpack] ${names.length} packs; ${CORE}: ${mb(sizeOf(coreAssets))} MB`)
for (const n of names.slice(1)) console.log(`  ${n}: ${mb(sizeOf(join(ANDROID, n, 'src/main/assets')))} MB`)

// ── 2. settings + app gradle ─────────────────────────────────────────
const settingsFile = ['settings.gradle.kts', 'settings.gradle'].map((f) => join(ANDROID, f)).find(existsSync)
if (!settingsFile) fail('no settings.gradle(.kts)')
let settings = readFileSync(settingsFile, 'utf8')
if (!settings.includes(MARK)) {
  settings += `\n// ${MARK}\n${names.map((n) => `include(":${n}")`).join('\n')}\n`
  writeFileSync(settingsFile, settings)
}

const gradleFile = join(APP, 'build.gradle.kts')
let gradle = readFileSync(gradleFile, 'utf8')
if (!gradle.includes(MARK)) {
  if (!/^android\s*\{/m.test(gradle)) fail('no `android {` block in app/build.gradle.kts')
  gradle = gradle.replace(/^android\s*\{/m, `android {\n    // ${MARK}\n    assetPacks += listOf(${names.map((n) => `":${n}"`).join(', ')})`)
  if (!/^dependencies\s*\{/m.test(gradle)) fail('no `dependencies {` block in app/build.gradle.kts')
  gradle = gradle.replace(/^dependencies\s*\{/m, `dependencies {\n    // ${MARK}\n    implementation("${LIB}")`)
  writeFileSync(gradleFile, gradle)
}

// ── 3. LkMedia.kt + MainActivity ─────────────────────────────────────
function findFile(dir, name) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      const r = findFile(p, name)
      if (r) return r
    } else if (e.name === name) return p
  }
  return null
}
const mainActivity = findFile(join(APP, 'src/main/java'), 'MainActivity.kt')
if (!mainActivity) fail('MainActivity.kt not found')
let ma = readFileSync(mainActivity, 'utf8')
const pkg = /^package\s+([\w.]+)/m.exec(ma)?.[1]
if (!pkg) fail('no package line in MainActivity.kt')
writeFileSync(
  join(dirname(mainActivity), 'LkMedia.kt'),
  readFileSync(join(SCRIPT_ROOT, 'scripts/android-pack/LkMedia.kt'), 'utf8')
    .replace('__PACKAGE__', pkg)
    .replace('__IDS__', ids.map((i) => `"${i}"`).join(', '))
)
if (!ma.includes('LkMedia.start')) {
  if (/override\s+fun\s+onCreate\s*\([^)]*\)\s*\{/.test(ma)) {
    ma = ma.replace(/(override\s+fun\s+onCreate\s*\([^)]*\)\s*\{)/, `$1\n    LkMedia.start(this) // ${MARK}`)
  } else if (/class\s+MainActivity[^{\n]*\{/.test(ma)) {
    ma = ma.replace(
      /(class\s+MainActivity[^{\n]*\{)/,
      `$1\n  override fun onCreate(savedInstanceState: android.os.Bundle?) {\n    LkMedia.start(this) // ${MARK}\n    super.onCreate(savedInstanceState)\n  }\n`
    )
  } else if (/class\s+MainActivity[^{\n]*$/m.test(ma)) {
    ma = ma.replace(
      /(class\s+MainActivity[^{\n]*)$/m,
      `$1 {\n  override fun onCreate(savedInstanceState: android.os.Bundle?) {\n    LkMedia.start(this) // ${MARK}\n    super.onCreate(savedInstanceState)\n  }\n}`
    )
  } else fail('class MainActivity not recognised')
  if (!ma.includes('LkMedia.start')) fail('MainActivity was not patched')
  writeFileSync(mainActivity, ma)
}
console.log(`[patch-android-assetpack] MainActivity (${pkg}) starts LkMedia`)

// ── 4. plain http to 127.0.0.1 only ──────────────────────────────────
mkdirSync(join(APP, 'src/main/res/xml'), { recursive: true })
writeFileSync(
  join(APP, 'src/main/res/xml/lk_network_security.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<!-- ${MARK}: the media server on the phone itself (127.0.0.1) is the only place that may be asked without TLS -->
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">127.0.0.1</domain>
    </domain-config>
</network-security-config>
`
)
const manifestFile = join(APP, 'src/main/AndroidManifest.xml')
let manifest = readFileSync(manifestFile, 'utf8')
if (!manifest.includes('lk_network_security')) {
  if (!/<application/.test(manifest)) fail('no <application> in AndroidManifest.xml')
  manifest = manifest.replace(/<application/, '<application android:networkSecurityConfig="@xml/lk_network_security"')
  writeFileSync(manifestFile, manifest)
}
console.log('[patch-android-assetpack] done')

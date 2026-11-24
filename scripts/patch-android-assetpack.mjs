#!/usr/bin/env node
// Android: the media of the adventures go into a Play Asset Delivery pack ("lkmedia", fast-follow) instead of into the app itself, so the main file stays small
// (decision of Anton, 24.11.2026; research in H:\Claude\research_notes\Wie andere Apps große Medien laden). Run after `tauri android init` and after
// `VITE_MEDIA_SPLIT=* pnpm build-only` (which makes `dist-media`). Idempotent.
//
//  1. creates the pack module `src-tauri/gen/android/lkmedia` (Gradle plugin com.android.asset-pack) and copies `dist-media` into its assets
//  2. includes the module in settings.gradle(.kts) and lists it as asset pack in app/build.gradle.kts, adds the Play library
//  3. puts LkMedia.kt (the little web server on the phone) next to MainActivity and starts it from MainActivity.onCreate
//  4. allows plain http to 127.0.0.1 (only that) through a network security config

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = process.env.LK_ROOT ?? SCRIPT_ROOT
const ANDROID = join(ROOT, 'src-tauri/gen/android')
const APP = join(ANDROID, 'app')
const MEDIA = join(ROOT, 'dist-media')
const PACK = 'lkmedia'
const LIB = 'com.google.android.play:asset-delivery:2.3.0'
const MARK = 'managed by scripts/patch-android-assetpack.mjs'

const fail = (msg) => {
  console.error(`[patch-android-assetpack] ${msg}`)
  process.exit(1)
}

if (!existsSync(join(APP, 'build.gradle.kts'))) fail('no generated Android project (run `tauri android init` first)')
if (!existsSync(MEDIA)) fail('no dist-media (run `VITE_MEDIA_SPLIT=* pnpm build-only` first)')

// ── 1. the pack module ───────────────────────────────────────────────
const packDir = join(ANDROID, PACK)
rmSync(join(packDir, 'src'), { recursive: true, force: true })
mkdirSync(join(packDir, 'src/main/assets'), { recursive: true })
writeFileSync(
  join(packDir, 'build.gradle.kts'),
  `// ${MARK}
plugins {
    id("com.android.asset-pack")
}

assetPack {
    packName.set("${PACK}")
    dynamicDelivery {
        deliveryType.set("fast-follow")
    }
}
`
)
cpSync(MEDIA, join(packDir, 'src/main/assets'), { recursive: true })
console.log(`[patch-android-assetpack] pack module ${packDir}: media copied`)

// ── 2. settings + app gradle ─────────────────────────────────────────
const settingsFile = ['settings.gradle.kts', 'settings.gradle'].map((f) => join(ANDROID, f)).find(existsSync)
if (!settingsFile) fail('no settings.gradle(.kts)')
let settings = readFileSync(settingsFile, 'utf8')
if (!settings.includes(MARK)) {
  settings += `\n// ${MARK}\ninclude(":${PACK}")\n`
  writeFileSync(settingsFile, settings)
}

const gradleFile = join(APP, 'build.gradle.kts')
let gradle = readFileSync(gradleFile, 'utf8')
if (!gradle.includes(MARK)) {
  // inside `android { ... }`: the list of the asset packs
  if (!/^android\s*\{/m.test(gradle)) fail('no `android {` block in app/build.gradle.kts')
  gradle = gradle.replace(/^android\s*\{/m, `android {\n    // ${MARK}\n    assetPacks += listOf(":${PACK}")`)
  // the Play library: into the first dependencies block
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
writeFileSync(join(dirname(mainActivity), 'LkMedia.kt'), readFileSync(join(SCRIPT_ROOT, 'scripts/android-pack/LkMedia.kt'), 'utf8').replace('__PACKAGE__', pkg))
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

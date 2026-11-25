#!/usr/bin/env node
// Put the native debug symbols into the .aab, so that Google Play can show readable crash reports (the Play Console warns when they are missing).
// The symbols travel in the bundle's metadata only: the app that is installed on the phone does not get bigger, because the Android build tools strip the
// library themselves. For that, two things are needed: the Rust library must not be stripped before (CARGO_PROFILE_RELEASE_STRIP=false in the workflow) and
// Gradle must know the NDK that does the stripping (`ndkVersion`, taken from NDK_HOME). Run after `tauri android init`. Idempotent.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = process.env.LK_ROOT ?? resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GRADLE = resolve(ROOT, 'src-tauri/gen/android/app/build.gradle.kts')
const SENTINEL = '// BEGIN: managed by scripts/patch-android-symbols.mjs'

const fail = (msg) => {
  console.error(`[patch-android-symbols] ${msg}`)
  process.exit(1)
}

if (!existsSync(GRADLE)) fail(`no gradle file at ${GRADLE}`)
let content = readFileSync(GRADLE, 'utf8')
if (content.includes(SENTINEL)) {
  console.log('[patch-android-symbols] already patched — skipping')
  process.exit(0)
}
if (!/^android\s*\{/m.test(content)) fail('no `android {` block in app/build.gradle.kts')

content = content.replace(
  /^android\s*\{/m,
  [
    'android {',
    `    ${SENTINEL}`,
    '    System.getenv("NDK_HOME")?.let { ndkVersion = it.trimEnd(\'/\').substringAfterLast(\'/\') }',
    '    buildTypes.getByName("release") { ndk.debugSymbolLevel = "SYMBOL_TABLE" }',
    '    // END: managed by scripts/patch-android-symbols.mjs'
  ].join('\n')
)
// Tauri's template writes `jniLibs.keepDebugSymbols.add(...)` into the debug build type, but `packaging` is not per build type: it keeps the release
// libraries unstripped too, and then no symbol table is made. Debug builds are not used for the store.
const lines = content.split('\n')
const rest = lines.filter((l) => !l.includes('jniLibs.keepDebugSymbols.add'))
content = rest.join('\n')
console.log(`[patch-android-symbols] removed ${lines.length - rest.length} keepDebugSymbols line(s)`)
writeFileSync(GRADLE, content, 'utf8')
console.log('[patch-android-symbols] patched')

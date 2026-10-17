#!/usr/bin/env node
// Make `versionCode` in `src-tauri/gen/android/app/build.gradle.kts` come from
// the ANDROID_VERSION_CODE environment variable. `src-tauri/gen/` is not in Git,
// so a fresh `tauri android init` (as in .github/workflows/android-build.yml)
// has to get this patch again. Google Play rejects every versionCode that is
// not higher than all earlier ones. Idempotent.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GRADLE = resolve(ROOT, 'src-tauri/gen/android/app/build.gradle.kts')
const SENTINEL = '// BEGIN: managed by scripts/patch-android-versioncode.mjs'

if (!existsSync(GRADLE)) {
  console.error(`[patch-android-versioncode] no gradle file at ${GRADLE}`)
  process.exit(1)
}

let content = readFileSync(GRADLE, 'utf8')
if (content.includes(SENTINEL)) {
  console.log('[patch-android-versioncode] already patched — skipping')
  process.exit(0)
}

const line = /^(\s*)versionCode = tauriProperties\.getProperty\("tauri\.android\.versionCode", "1"\)\.toInt\(\)\s*$/m
if (!line.test(content)) {
  console.error('[patch-android-versioncode] versionCode line not found — Tauri\'s generated build.gradle.kts changed shape')
  process.exit(1)
}

content = content.replace(
  line,
  (_all, indent) =>
    `${indent}${SENTINEL}\n` +
    `${indent}val envVersionCode = System.getenv("ANDROID_VERSION_CODE")?.trim()?.toIntOrNull()\n` +
    `${indent}versionCode = envVersionCode\n` +
    `${indent}    ?: tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()\n` +
    `${indent}// END: managed by scripts/patch-android-versioncode.mjs`
)
writeFileSync(GRADLE, content, 'utf8')
console.log('[patch-android-versioncode] patched')

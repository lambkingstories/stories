#!/usr/bin/env node
// Regenerate every app icon from ONE source image:
// `src-tauri/icons/source/lamb-icon.png` — the crowned lamb with the Bible on
// a flat cream background, square and full-bleed, no text.
//
// Usage:
//   pnpm icons
//
// Three shapes come out of that one image, because the platforms want
// different things:
//
//   * `app-icon.png` — the square itself, opaque 1024x1024. iOS (the OS cuts
//     the rounded corners itself, and App Store Connect rejects transparency)
//     and the master for the Android adaptive layers. `ios-build.yml`
//     regenerates the iOS asset catalog from it, so it is committed.
//   * `logo.png` — the same picture with squircle corners and transparent
//     outside. Desktop (.ico/.icns/Windows Square*Logo) and Android's
//     pre-8.0 `ic_launcher` / `ic_launcher_round` show the image unmasked.
//   * Android adaptive layers — a foreground (the lamb, shrunk into the safe
//     zone: launchers show only the middle 72dp of the 108dp layer, and a
//     circular mask would cut the crown) over a solid cream background, so
//     the layers stay seamless whatever mask the launcher applies.
//
// The in-app loader / PWA logos (`public/images/logo`), `favicon.ico` and the
// Electron icon are refreshed too, so no old artwork is left anywhere.

import { execFileSync } from 'node:child_process'
import { copyFileSync, cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ICONS = join(ROOT, 'src-tauri/icons')
const SOURCE = join(ICONS, 'source/lamb-icon.png')
const LOGO = join(ICONS, 'logo.png')
const MASTER = join(ICONS, 'app-icon.png')
const WEB_LOGOS = join(ROOT, 'public/images/logo')
const ANDROID_RES = join(ROOT, 'src-tauri/gen/android/app/src/main/res')
const TAURI = join(ROOT, 'node_modules/@tauri-apps/cli/tauri.js')

const SIZE = 1024
// The flat cream of the source, used for the Android adaptive background.
const CREAM = { r: 254, g: 246, b: 217 }
// iOS-style squircle radius (22.37% of the edge) for the unmasked variants.
const CORNER = Math.round(SIZE * 0.2237)
// Launcher mask shows 66.7% of the layer; the lamb's box is ~80% x 88% of the
// source, so 0.60 keeps crown and hooves inside even a circular mask.
const ANDROID_FG_SCALE = 0.60

const tauriIcon = (...args) =>
  execFileSync(process.execPath, [TAURI, 'icon', ...args], { cwd: ROOT, stdio: 'inherit' })

async function buildMasters() {
  const square = await sharp(SOURCE)
    .resize(SIZE, SIZE, { kernel: 'lanczos3' })
    .flatten({ background: CREAM })
    .png({ compressionLevel: 9 })
    .toBuffer()
  await sharp(square).toFile(MASTER)
  console.log(`Wrote ${MASTER} (${SIZE}x${SIZE}, opaque)`)

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" rx="${CORNER}" ry="${CORNER}" fill="#fff"/></svg>`
  )
  await sharp(square).composite([{ input: mask, blend: 'dest-in' }]).png({ compressionLevel: 9 }).toFile(LOGO)
  console.log(`Wrote ${LOGO} (squircle, transparent corners)`)

  // In-app loader and PWA manifest.
  await sharp(LOGO).resize(512, 512).png().toFile(join(WEB_LOGOS, 'logo_512x512.png'))
  await sharp(LOGO).resize(512, 512).webp({ quality: 92 }).toFile(join(WEB_LOGOS, 'logo_512x512.webp'))
  await sharp(LOGO).resize(256, 256).webp({ quality: 92 }).toFile(join(WEB_LOGOS, 'logo_256x256.webp'))
  await sharp(LOGO).resize(192, 192).png().toFile(join(WEB_LOGOS, 'logo_192x192.png'))
}

async function buildAndroidLayers(dir) {
  const inner = Math.round(SIZE * ANDROID_FG_SCALE)
  const off = Math.round((SIZE - inner) / 2)
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { ...CREAM, alpha: 0 } } })
    .composite([{ input: await sharp(MASTER).resize(inner, inner).toBuffer(), left: off, top: off }])
    .png()
    .toFile(join(dir, 'android-fg.png'))
  await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: CREAM } })
    .png()
    .toFile(join(dir, 'android-bg.png'))
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({ default: MASTER, android_fg: 'android-fg.png', android_bg: 'android-bg.png', android_fg_scale: 100 })
  )
}

await buildMasters()

console.log('\nPass 1: desktop + legacy Android from logo.png')
tauriIcon(LOGO)

const tmp = mkdtempSync(join(tmpdir(), 'app-icons-'))
try {
  console.log('\nPass 2: iOS + Android adaptive layers from app-icon.png')
  await buildAndroidLayers(tmp)
  const out = join(tmp, 'out')
  tauriIcon(join(tmp, 'manifest.json'), '-o', out)

  cpSync(join(out, 'ios'), join(ICONS, 'ios'), { recursive: true })
  for (const dir of readdirSync(join(out, 'android'))) {
    if (!dir.startsWith('mipmap-')) continue
    for (const file of readdirSync(join(out, 'android', dir))) {
      // Keep pass 1's rounded legacy ic_launcher / ic_launcher_round.
      if (file === 'ic_launcher.png' || file === 'ic_launcher_round.png') continue
      cpSync(join(out, 'android', dir, file), join(ANDROID_RES, dir, file))
    }
  }
  console.log(`\nCopied iOS icons to ${join(ICONS, 'ios')} and adaptive layers to ${ANDROID_RES}`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

// Browser tab and Windows desktop (Electron) use the multi-size .ico from pass 1.
copyFileSync(join(ICONS, 'icon.ico'), join(ROOT, 'public/favicon.ico'))
copyFileSync(join(ICONS, 'icon.ico'), join(ROOT, 'electron/resources/icon.ico'))
copyFileSync(join(ICONS, 'icon.icns'), join(ROOT, 'electron/resources/icon.icns'))
copyFileSync(join(ICONS, 'icon.png'), join(ROOT, 'electron/resources/icon.png'))
console.log('Refreshed favicon and Electron icons')

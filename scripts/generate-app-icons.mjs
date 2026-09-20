#!/usr/bin/env node
// Regenerate every Tauri app icon from `src-tauri/icons/logo.png`.
//
// Usage:
//   pnpm icons
//
// `logo.png` is pre-shaped: a squircle with transparent corners. That is
// right wherever the OS shows the image unmasked — desktop (.ico/.icns/PNGs,
// Windows Square*Logo) and Android's legacy pre-8.0 `ic_launcher` /
// `ic_launcher_round`. iOS and Android adaptive icons are the opposite: a
// full-bleed square the OS cuts its own shape out of. iOS flattens the
// transparent corners (`ios-build.yml` flattens them to black), and Android
// shows only the middle 72dp of a 108dp adaptive layer, which would crop the
// "LambKing" title. So there are two passes:
//
//   1. `tauri icon logo.png` — desktop, Windows, legacy Android.
//   2. `app-icon.png`, derived here — `logo.png` with its corners filled by
//      a blurred zoom of itself — for iOS (`icons/ios`, and the asset
//      catalog CI regenerates from it) and the Android adaptive layers.
//
// `app-icon.png` is committed because CI has no `sharp`; re-run this script
// whenever `logo.png` changes.

import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ICONS = join(ROOT, 'src-tauri/icons')
const LOGO = join(ICONS, 'logo.png')
const MASTER = join(ICONS, 'app-icon.png')
const ANDROID_RES = join(ROOT, 'src-tauri/gen/android/app/src/main/res')
const TAURI = join(ROOT, 'node_modules/@tauri-apps/cli/tauri.js')

const SIZE = 1024
// Both edges of logo.png carry a 1px light seam; drop it.
const TRIM = 2
// The squircle rim is a light pixel plus a dark outline up to ~6px deep.
// Erode the mask past it so the fill meets clean artwork.
const RIM = 8
// Android adaptive icons: the launcher mask shows the middle 72dp of the
// 108dp layer (66.7%). Scale the artwork to just past that so the title
// survives a circular mask and nothing but artwork shows inside it.
const ANDROID_FG_SCALE = 0.68

const tauriIcon = (...args) =>
  execFileSync(process.execPath, [TAURI, 'icon', ...args], { cwd: ROOT, stdio: 'inherit' })

async function buildMaster() {
  const meta = await sharp(LOGO).metadata()
  const W = meta.width - TRIM * 2
  const H = meta.height - TRIM * 2
  const { data } = await sharp(LOGO)
    .ensureAlpha()
    .extract({ left: TRIM, top: TRIM, width: W, height: H })
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Separable min filter; outside the image counts as opaque so the straight
  // edges stay put and only the rounded corners are eroded.
  const erode = (src, horizontal) => {
    const out = new Uint8Array(W * H)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let m = 255
        for (let k = -RIM; k <= RIM; k++) {
          const xx = horizontal ? x + k : x
          const yy = horizontal ? y : y + k
          const v = xx < 0 || yy < 0 || xx >= W || yy >= H ? 255 : src[yy * W + xx]
          if (v < m) m = v
        }
        out[y * W + x] = m
      }
    return out
  }
  const alpha = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) alpha[i] = data[i * 4 + 3]
  const eroded = erode(erode(alpha, true), false)
  const { data: soft, info } = await sharp(Buffer.from(eroded), { raw: { width: W, height: H, channels: 1 } })
    .blur(1.5)
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true })
  if (info.channels !== 1) throw new Error(`expected a 1-channel mask, got ${info.channels}`)
  const art = Buffer.from(data)
  for (let i = 0; i < W * H; i++) art[i * 4 + 3] = soft[i]

  // At 125% the zoomed logo is opaque edge to edge, so blurred it fills the
  // corners with the colours that surround them.
  const Z = Math.round(W * 1.25)
  const off = Math.round((Z - W) / 2)
  const fill = await sharp(LOGO)
    .resize(Z, Z)
    .extract({ left: off, top: off, width: W, height: H })
    .removeAlpha()
    .blur(16)
    .png()
    .toBuffer()
  const full = await sharp(fill)
    .composite([{ input: art, raw: { width: W, height: H, channels: 4 } }])
    .removeAlpha()
    .png()
    .toBuffer()
  await sharp(full).resize(SIZE, SIZE, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(MASTER)
  console.log(`Wrote ${MASTER} (${SIZE}x${SIZE}, opaque)`)
}

async function buildAndroidLayers(dir) {
  const inner = Math.round(SIZE * ANDROID_FG_SCALE)
  const off = Math.round((SIZE - inner) / 2)
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(MASTER).resize(inner, inner).toBuffer(), left: off, top: off }])
    .png()
    .toFile(join(dir, 'android-fg.png'))
  // Only seen where a launcher animation overshoots the mask.
  await sharp(MASTER).blur(24).png().toFile(join(dir, 'android-bg.png'))
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({ default: MASTER, android_fg: 'android-fg.png', android_bg: 'android-bg.png', android_fg_scale: 100 })
  )
}

await buildMaster()

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

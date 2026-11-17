/**
 * "Das verlorene Lamm": simple stand-in shapes for the painted pictures, drawn only while a picture is missing (the painted pictures replace them as soon as they are there).
 * Every shape stands on the point (0, 0) (its feet) and is `h` high, going upwards.
 */
type C = CanvasRenderingContext2D

function blob(c: C, x: number, y: number, rx: number, ry: number, color: string) {
  c.fillStyle = color
  c.beginPath()
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  c.fill()
}

/** A white lamb with a small crown, seen from the side, looking to the right. `pose`: 1 stand, 2 and 3 walk, 4 hop, 5 sniff, 6 bleat. */
export function lambShape(c: C, h: number, pose: number) {
  const bodyY = -h * 0.42
  // legs
  const legs: [number, number][] = pose === 2 ? [[-0.26, 0.04], [-0.1, -0.03], [0.14, 0.04], [0.28, -0.03]] : pose === 3 ? [[-0.26, -0.03], [-0.1, 0.04], [0.14, -0.03], [0.28, 0.04]] : pose === 4 ? [[-0.2, -0.12], [-0.08, -0.12], [0.16, -0.12], [0.28, -0.12]] : [[-0.24, 0], [-0.1, 0], [0.14, 0], [0.28, 0]]
  c.fillStyle = '#5a4a46'
  for (const [lx, lz] of legs) c.fillRect(lx * h - h * 0.035, -h * 0.28 + lz * h, h * 0.07, h * 0.28 - lz * h * 0.2)
  // wool body: a cloud of small circles
  c.fillStyle = '#fffaf0'
  for (const [bx, by, br] of [[-0.3, 0.02, 0.17], [-0.12, -0.08, 0.2], [0.08, -0.1, 0.2], [0.26, -0.02, 0.17], [-0.2, 0.1, 0.17], [0.0, 0.1, 0.2], [0.2, 0.08, 0.16]] as [number, number, number][]) {
    c.beginPath()
    c.arc(bx * h, bodyY + by * h, br * h, 0, Math.PI * 2)
    c.fill()
  }
  // head
  const hx = h * 0.42
  const hy = pose === 5 ? -h * 0.2 : pose === 6 ? -h * 0.72 : -h * 0.58
  blob(c, hx, hy, h * 0.17, h * 0.15, '#fff3e4')
  // ear, eye, nose
  blob(c, hx - h * 0.09, hy - h * 0.02, h * 0.07, h * 0.1, '#f2dcc8')
  c.fillStyle = '#3a2a2a'
  c.beginPath()
  c.arc(hx + h * 0.06, hy - h * 0.03, h * 0.025, 0, Math.PI * 2)
  c.fill()
  blob(c, hx + h * 0.15, hy + h * 0.02, h * 0.035, h * 0.025, '#e8a0a0')
  if (pose === 6) {
    c.fillStyle = '#c05a5a'
    c.fillRect(hx + h * 0.1, hy + h * 0.06, h * 0.07, h * 0.03)
  }
  // crown
  c.fillStyle = '#f2c230'
  c.beginPath()
  const cx = hx - h * 0.01
  const cy = hy - h * 0.15
  c.moveTo(cx - h * 0.06, cy)
  c.lineTo(cx - h * 0.07, cy - h * 0.08)
  c.lineTo(cx - h * 0.03, cy - h * 0.04)
  c.lineTo(cx, cy - h * 0.1)
  c.lineTo(cx + h * 0.03, cy - h * 0.04)
  c.lineTo(cx + h * 0.07, cy - h * 0.08)
  c.lineTo(cx + h * 0.06, cy)
  c.closePath()
  c.fill()
}

/** The shepherd seen from behind with a staff; with `open` he kneels with his arms wide open. */
export function shepherdShape(c: C, h: number, open: boolean) {
  const w = h * 0.34
  // robe
  c.fillStyle = '#e8d8b8'
  c.beginPath()
  c.moveTo(-w * 0.55, 0)
  c.lineTo(-w * 0.35, -h * 0.62)
  c.lineTo(w * 0.35, -h * 0.62)
  c.lineTo(w * 0.55, 0)
  c.closePath()
  c.fill()
  // cloak
  c.fillStyle = '#8a6a4a'
  c.beginPath()
  c.moveTo(-w * 0.4, -h * 0.62)
  c.lineTo(-w * 0.5, -h * 0.18)
  c.lineTo(w * 0.5, -h * 0.18)
  c.lineTo(w * 0.4, -h * 0.62)
  c.closePath()
  c.fill()
  // arms
  c.strokeStyle = '#8a6a4a'
  c.lineWidth = h * 0.07
  c.lineCap = 'round'
  c.beginPath()
  if (open) {
    c.moveTo(-w * 0.3, -h * 0.58)
    c.lineTo(-w * 0.85, -h * 0.72)
    c.moveTo(w * 0.3, -h * 0.58)
    c.lineTo(w * 0.85, -h * 0.72)
  } else {
    c.moveTo(-w * 0.3, -h * 0.58)
    c.lineTo(-w * 0.75, -h * 0.45)
    c.moveTo(w * 0.3, -h * 0.58)
    c.lineTo(w * 0.62, -h * 0.5)
  }
  c.stroke()
  // head with a cloth
  blob(c, 0, -h * 0.72, h * 0.12, h * 0.12, '#f1d6b8')
  c.fillStyle = '#f4efe4'
  c.beginPath()
  c.arc(0, -h * 0.74, h * 0.13, Math.PI, 0)
  c.fill()
  // staff
  c.strokeStyle = '#7a5230'
  c.lineWidth = h * 0.035
  c.beginPath()
  c.moveTo(w * 0.7, 0)
  c.lineTo(w * 0.7, -h * 0.95)
  c.arc(w * 0.7 - h * 0.06, -h * 0.95, h * 0.06, 0, -Math.PI * 0.8, true)
  c.stroke()
}

/** A few sheep standing (or lying) together. */
export function flockShape(c: C, h: number, lying: boolean) {
  const n = lying ? 2 : 3
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * h * 0.95
    const k = lying ? 0.6 : 0.8
    c.save()
    c.translate(x, 0)
    c.scale(k, k)
    lambShape(c, h, 1)
    c.restore()
  }
}

/** A golden bell flower. */
export function flowerShape(c: C, h: number) {
  c.strokeStyle = '#5a8a3a'
  c.lineWidth = h * 0.06
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(0, 0)
  c.quadraticCurveTo(h * 0.05, -h * 0.5, 0, -h * 0.85)
  c.stroke()
  for (const [bx, by, br] of [[-0.18, -0.55, 0.14], [0.16, -0.7, 0.14], [0, -0.92, 0.16]] as [number, number, number][]) {
    c.fillStyle = '#f2c230'
    c.beginPath()
    c.moveTo(bx * h - br * h, by * h - br * h * 0.6)
    c.quadraticCurveTo(bx * h, by * h - br * h * 1.6, bx * h + br * h, by * h - br * h * 0.6)
    c.lineTo(bx * h + br * h * 1.1, by * h + br * h * 0.5)
    c.lineTo(bx * h - br * h * 1.1, by * h + br * h * 0.5)
    c.closePath()
    c.fill()
  }
}

/** A crank (wheel), a slider or a lever on a little stone. */
export function handleShape(c: C, h: number, kind: 'kurbel' | 'schieber' | 'hebel') {
  blob(c, 0, -h * 0.05, h * 0.3, h * 0.1, '#9a9488')
  c.fillStyle = '#7a4c22'
  c.fillRect(-h * 0.05, -h * 0.55, h * 0.1, h * 0.5)
  if (kind === 'kurbel') {
    c.strokeStyle = '#c08a54'
    c.lineWidth = h * 0.06
    c.beginPath()
    c.arc(0, -h * 0.7, h * 0.26, 0, Math.PI * 2)
    c.stroke()
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3
      c.beginPath()
      c.moveTo(0, -h * 0.7)
      c.lineTo(Math.cos(a) * h * 0.26, -h * 0.7 + Math.sin(a) * h * 0.26)
      c.stroke()
      blob(c, Math.cos(a) * h * 0.31, -h * 0.7 + Math.sin(a) * h * 0.31, h * 0.05, h * 0.05, '#e8b64a')
    }
  } else if (kind === 'schieber') {
    c.fillStyle = '#3a2a1a'
    c.fillRect(-h * 0.3, -h * 0.62, h * 0.6, h * 0.1)
    blob(c, h * 0.1, -h * 0.68, h * 0.13, h * 0.13, '#e8b64a')
  } else {
    c.strokeStyle = '#7a4c22'
    c.lineWidth = h * 0.08
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(0, -h * 0.5)
    c.lineTo(h * 0.25, -h * 0.9)
    c.stroke()
    blob(c, h * 0.27, -h * 0.93, h * 0.1, h * 0.1, '#9a9488')
  }
}

/** A gate of wooden bars between two stone posts. */
export function gateShape(c: C, h: number) {
  c.fillStyle = '#9a9488'
  c.fillRect(-h * 0.62, -h, h * 0.16, h)
  c.fillRect(h * 0.46, -h, h * 0.16, h)
  c.fillStyle = '#7a4c22'
  for (let i = -2; i <= 2; i++) c.fillRect(i * h * 0.2 - h * 0.035, -h * 0.9, h * 0.07, h * 0.9)
  c.fillRect(-h * 0.5, -h * 0.6, h, h * 0.07)
}

/** Scenery: bush, rock, fence, reeds, tree, cypress. */
export function decoShape(c: C, h: number, name: string) {
  switch (name) {
    case 'busch':
      for (const [x, y, r] of [[-0.3, -0.35, 0.32], [0.05, -0.5, 0.4], [0.35, -0.32, 0.3]] as [number, number, number][]) blob(c, x * h, y * h, r * h, r * h, '#6f9a45')
      for (const [x, y] of [[-0.2, -0.5], [0.2, -0.6], [0.3, -0.35]] as [number, number][]) blob(c, x * h, y * h, h * 0.06, h * 0.06, '#f6e8a0')
      break
    case 'fels':
      blob(c, 0, -h * 0.35, h * 0.55, h * 0.38, '#9a9a96')
      blob(c, -h * 0.1, -h * 0.5, h * 0.3, h * 0.2, '#b2b2ac')
      break
    case 'zaun':
      c.fillStyle = '#8a5a2a'
      for (const x of [-0.5, 0, 0.5]) c.fillRect(x * h - h * 0.04, -h * 0.7, h * 0.08, h * 0.7)
      c.fillRect(-h * 0.55, -h * 0.55, h * 1.1, h * 0.07)
      c.fillRect(-h * 0.55, -h * 0.3, h * 1.1, h * 0.07)
      break
    case 'schilf':
      c.strokeStyle = '#6a8a3a'
      c.lineWidth = h * 0.04
      for (let i = -3; i <= 3; i++) {
        c.beginPath()
        c.moveTo(i * h * 0.08, 0)
        c.quadraticCurveTo(i * h * 0.1, -h * 0.5, i * h * 0.16, -h * (0.8 + (i % 2) * 0.1))
        c.stroke()
      }
      for (const x of [-0.1, 0.12]) blob(c, x * h, -h * 0.72, h * 0.05, h * 0.12, '#7a4a2a')
      break
    case 'baum':
      c.fillStyle = '#7a5230'
      c.fillRect(-h * 0.06, -h * 0.5, h * 0.12, h * 0.5)
      for (const [x, y, r] of [[-0.22, -0.62, 0.26], [0.2, -0.64, 0.26], [0, -0.82, 0.3]] as [number, number, number][]) blob(c, x * h, y * h, r * h, r * h * 0.8, '#7a9a5a')
      break
    default:
      c.fillStyle = '#7a5230'
      c.fillRect(-h * 0.03, -h * 0.12, h * 0.06, h * 0.12)
      blob(c, 0, -h * 0.5, h * 0.12, h * 0.4, '#3f6a3a')
  }
}

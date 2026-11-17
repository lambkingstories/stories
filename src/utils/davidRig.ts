/**
 * Goliath as a puppet of painted parts, drawn on a canvas (the maths of the stride is in `davidWalk.ts`). The parts: torso with head, two arms
 * (one holds the spear, one the shield), two legs of thigh, shin and foot, the spear. The joint angles come from the distance he has walked, so
 * the feet stand still on the ground while the body moves over them. The parts of the far leg are drawn a little darker.
 */
import { PARTS, RIG_K, walkPose, type LegPose } from '@/utils/davidWalk'

type Img = CanvasImageSource & { width: number; height: number }
export type RigImages = Record<string, Img | undefined>

/** What the rig needs to draw him once. */
export interface RigState {
  /** The place of his hip on the ground line (scene units) and the ground line. */
  x: number
  ground: number
  /** The distance he has walked, and his speed. */
  walked: number
  speed: number
  /** How far he has fallen over (0 to 1, eased) and how far his shield is raised (0 to 1). */
  fall: number
  shield: number
}

/** Where the shoulder sits in the picture of the raised arm. */
const RAISED = { pivot: [398, 252] as [number, number], dx: 120, dy: 0 }

export const RIG_PICTURES = ['gol-torso', 'gol-arm-speer', 'gol-arm-schild', 'gol-arm-hoch', 'gol-bein-ober', 'gol-bein-unter', 'gol-fuss', 'gol-speer', 'gol-rock']
const REQUIRED = ['gol-torso', 'gol-arm-speer', 'gol-arm-schild', 'gol-bein-ober', 'gol-bein-unter', 'gol-speer']

export function createRig(img: RigImages) {
  const dark: Record<string, CanvasImageSource | undefined> = {}

  /** A darker copy of a picture (the far leg), made once. */
  function darker(name: string): CanvasImageSource | undefined {
    const i = img[name]
    if (!i) return undefined
    let d = dark[name]
    if (!d) {
      const cv = document.createElement('canvas')
      cv.width = i.width
      cv.height = i.height
      const x = cv.getContext('2d')
      if (!x) return i
      x.drawImage(i, 0, 0)
      x.globalCompositeOperation = 'source-atop'
      x.fillStyle = 'rgba(40, 20, 60, 0.3)'
      x.fillRect(0, 0, cv.width, cv.height)
      d = cv
      dark[name] = d
    }
    return d
  }

  function drawLeg(c: CanvasRenderingContext2D, leg: LegPose, hx: number, hipY: number, gy: number, far: boolean) {
    const P = PARTS
    const pick = (n: string) => (far ? darker(n) : img[n])
    const shinImg = pick(P.shin.img)
    const thighImg = pick(P.thigh.img)
    if (!shinImg || !thighImg) return
    // the foot (if there is a separate one) first, then the shin over its ankle, then the thigh over the knee
    const footImg = img['gol-fuss'] ? pick('gol-fuss') : undefined
    if (footImg) {
      c.save()
      c.translate(hx - leg.footX, gy - leg.footY)
      c.rotate(leg.foot)
      c.scale(RIG_K, RIG_K)
      c.drawImage(footImg, -P.foot.ankle[0], -P.foot.ankle[1])
      c.restore()
    }
    c.save()
    c.translate(hx - leg.kneeX, gy - leg.kneeY)
    c.rotate(leg.shin - P.shin.rest)
    c.scale(RIG_K * P.shin.kx, RIG_K)
    c.drawImage(shinImg, -P.shin.knee[0], -P.shin.knee[1])
    c.restore()
    c.save()
    c.translate(hx, hipY)
    c.rotate(leg.thigh - P.thigh.rest)
    c.scale(RIG_K * P.thigh.kx, RIG_K)
    c.drawImage(thighImg, -P.thigh.hip[0], -P.thigh.hip[1])
    c.restore()
  }

  return {
    /** All the needed pictures are there. */
    ready(): boolean {
      return REQUIRED.every((n) => img[n])
    },
    draw(c: CanvasRenderingContext2D, s: RigState) {
      if (!REQUIRED.every((n) => img[n])) return
      const P = PARTS
      const pose = walkPose(s.walked, s.speed)
      const hx = s.x
      const gy = s.ground
      const hipY = gy - pose.hipY
      c.save()
      if (s.fall > 0) {
        // when he falls he tips forward, towards David, over his feet
        c.translate(s.x, gy)
        c.rotate(-s.fall * (Math.PI / 2) * 0.96)
        c.translate(-s.x, -gy)
      }
      drawLeg(c, pose.far, hx, hipY, gy, true)
      drawLeg(c, pose.near, hx, hipY, gy, false)

      // the body leans a little, everything on it moves with it (from here on the units are the pixels of the pictures)
      c.save()
      c.translate(hx, hipY)
      c.rotate(-pose.lean)
      c.scale(RIG_K, RIG_K)
      const sx = P.torso.shoulder[0] - P.torso.hip[0]
      const sy = P.torso.shoulder[1] - P.torso.hip[1]
      // the arm with the spear is behind the body: the fist holds the spear in front of him
      const aS = P.armSpear
      const swingS = 0.5 + pose.armSpear
      c.save()
      c.translate(sx, sy)
      c.rotate(swingS)
      c.scale(aS.k, aS.k)
      c.save()
      c.translate(aS.hand[0] - aS.pivot[0], aS.hand[1] - aS.pivot[1])
      c.rotate(-swingS * 0.92 - 0.1)
      c.scale(P.spear.k / aS.k, P.spear.k / aS.k)
      c.drawImage(img[P.spear.img]!, -P.spear.grip[0], -P.spear.grip[1])
      c.restore()
      c.drawImage(img[aS.img]!, -aS.pivot[0], -aS.pivot[1])
      c.restore()
      c.drawImage(img[P.torso.img]!, -P.torso.hip[0], -P.torso.hip[1])
      // the knee-long skirt hangs from the belt over the thighs and swings a little with the legs (the short kilt of the body is behind it)
      const skirt = img[P.rock.img]
      if (skirt) {
        c.save()
        c.translate(P.rock.at[0] - P.torso.hip[0], P.rock.at[1] - P.torso.hip[1])
        c.rotate((pose.near.thigh + pose.far.thigh) * 0.22 + 0.02)
        c.drawImage(skirt, -P.rock.pivot[0], -P.rock.pivot[1])
        c.restore()
      }
      // the near arm with the shield hangs and swings, and goes up in front of the face when he raises the shield
      const aH = P.armShield
      const k = s.shield
      const raised = img['gol-arm-hoch']
      c.save()
      c.translate(sx, sy)
      if (raised && k > 0.02) {
        if (k < 0.98) {
          c.save()
          c.globalAlpha = 1 - k
          c.rotate(pose.armShield * (1 - k))
          c.scale(aH.k, aH.k)
          c.drawImage(img[aH.img]!, -aH.pivot[0], -aH.pivot[1])
          c.restore()
        }
        c.globalAlpha = Math.min(1, k * 1.4)
        c.translate(RAISED.dx * k, RAISED.dy * k)
        c.rotate(-(1 - k) * 0.6)
        c.drawImage(raised, -RAISED.pivot[0], -RAISED.pivot[1])
      } else {
        c.rotate(pose.armShield * (1 - k) + k * 2.4)
        c.scale(aH.k, aH.k)
        c.drawImage(img[aH.img]!, -aH.pivot[0], -aH.pivot[1])
      }
      c.restore()
      c.restore()
      c.restore()
    }
  }
}

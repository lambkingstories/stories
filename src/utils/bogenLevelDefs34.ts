/** "Jonatans Pfeile": the levels of chapter 3 (wind and stones) and chapter 4 (the sign for David); see `bogenLevelDefs.ts`. */
import type { LevelDef } from './bogenGame'
import { bar, bell, box, chain, flag, gallows, gate, hang, hill, hook, jar, lv, rope, slide, sw, swing, target, weight, zone } from './bogenKit'

// ═══ chapter 3: wind and stones ════════════════════════════════════════════════════════════════════════════════════════════
const g34 = gallows(18.5, 10.6, 3.5)
const g35 = gallows(17.5, 10.6, 6)
const g38 = gallows(16.5, 10.8, 4.5)
const g39 = gallows(18, 10.8, 4)
const g311a = gallows(11, 10.6, 6)
const g311b = gallows(19, 10.8, 3)

export const CH3: LevelDef[] = [
  lv(2, 0, { key: 'wind', intro: 'wind', wind: 3.5, items: [target('t', 24, 2.0, 2.0)] }),
  lv(2, 1, { key: 'gegenwind', wind: -3.5, items: [target('t', 27, 2.0, 2.0), flag('f', 14, 5.0, 1.3)] }),
  lv(2, 2, { key: 'turm-im-wind', wind: 4, polys: [box(10, 0, 12, 3.6)], items: [target('a', 11, 5.2, 1.6), target('b', 28, 2.2, 2.4)] }),
  lv(2, 3, {
    key: 'aufwind',
    intro: 'zone',
    zones: [zone(11, 0, 19, 14, 0, 6.5)],
    deco: [g34, chain(g34, hook(g34)[0], hook(g34)[1] - 2.0)],
    items: [bell('b', hook(g34)[0], hook(g34)[1] - 2.0, 1.2), target('t', 27, 2.2, 2.0)]
  }),
  lv(2, 4, {
    key: 'fallwind',
    zones: [zone(19, 0, 28, 14, 0, -8)],
    deco: [g35, chain(g35, hook(g35)[0], hook(g35)[1] - 2.4)],
    items: [target('t', hook(g35)[0], hook(g35)[1] - 2.4, 1.9), jar('j', 29.5, 0.95, 1.0)]
  }),
  lv(2, 5, { key: 'boe', zones: [zone(15, 0, 23, 14, 8, 0)], items: [flag('a', 19, 4, 1.3), flag('b', 30, 6, 1.3)] }),
  lv(2, 6, {
    key: 'stein-und-wind',
    wind: -2,
    polys: [box(12, 5.2, 25, 5.8), box(12, 0, 12.7, 5.2), bar(29, 0.4, 29, 10, 'stone', 0.9)],
    items: [target('t', 24, 2.5, 2.3)]
  }),
  lv(2, 7, {
    key: 'seil-im-wind',
    wind: 3,
    deco: [g38],
    ropes: [rope('r', ...hook(g38), ...hang(g38, 3.5), { holds: 'w' })],
    weights: [weight('w', ...hang(g38, 4.3))],
    items: [jar('j', hook(g38)[0], 0.95, 1.0), flag('f', 29, 6, 1.3)]
  }),
  lv(2, 8, {
    key: 'pendel-im-wind',
    wind: -3,
    deco: [g39],
    items: [bell('b', hook(g39)[0], hook(g39)[1] - 5.2, 1.25, { motion: swing(hook(g39)[0], hook(g39)[1], 5.2, 0.5, 4.6) }), target('t', 28, 2.0, 2.0)]
  }),
  lv(2, 9, {
    key: 'wagen-tor',
    wind: 2,
    polys: [box(19.5, 6.4, 33.5, 7.0), box(32.8, 0, 33.5, 6.4)],
    gates: [gate('g1', 20, 6.4, 1)],
    items: [sw('s', 18.6, 3.6, [{ t: 'open', id: 'g1' }], 1.0), target('t', 23, 1.9, 1.8, { motion: slide(24, 1.9, 31, 1.9, 6), skin: 'cart' })]
  }),
  lv(2, 10, {
    key: 'sturm',
    wind: 2.5,
    deco: [g311a, chain(g311a, hook(g311a)[0], hook(g311a)[1] - 3.0), g311b],
    polys: [box(25, 6.4, 33.5, 7.0), box(32.8, 0, 33.5, 6.4)],
    gates: [gate('g1', 25.4, 6.4)],
    items: [
      sw('s', hook(g311a)[0], hook(g311a)[1] - 3.0, [{ t: 'open', id: 'g1' }], 1.2),
      bell('b', hook(g311b)[0], hook(g311b)[1] - 4.6, 1.25, { motion: swing(hook(g311b)[0], hook(g311b)[1], 4.6, 0.5, 4.0) }),
      flag('f', 30.4, 4.0, 1.3)
    ]
  })
]

// ═══ chapter 4: the sign for David ═══════════════════════════════════════════════════════════════════════════════════════════
const g44a = gallows(8, 10.6, 3.5)
const g44b = gallows(15, 10.6, 3.5)
const g45a = gallows(14, 10.8, 3.5)
const g45b = gallows(23, 10.8, 3.5)
const g48 = gallows(17, 10.8, 4)
const g49 = gallows(9, 10.6, 5)
const g410 = gallows(15, 10.8, 3.5)

export const CH4: LevelDef[] = [
  lv(3, 0, { key: 'drei-pfeile', wind: 1.5, items: [target('a', 14, 1.8, 1.7), target('b', 23, 2.0, 1.9), target('c', 32, 2.2, 2.1)] }),
  lv(3, 1, {
    key: 'huegelkruege',
    wind: -2,
    polys: [hill(14, 24, 5)],
    items: [jar('a', 17.5, 5.95, 1.0), jar('b', 21, 5.95, 1.0), flag('f', 31, 9.2, 1.5)]
  }),
  lv(3, 2, {
    key: 'stadttor',
    deco: [g44a, chain(g44a, hook(g44a)[0], hook(g44a)[1] - 2.6), g44b],
    gates: [gate('g1', 18, 9.5, 1)],
    ropes: [rope('r', ...hook(g44b), ...hang(g44b, 3.5), { holds: 'w' })],
    weights: [weight('w', ...hang(g44b, 4.3))],
    items: [sw('s', hook(g44a)[0], hook(g44a)[1] - 2.6, [{ t: 'open', id: 'g1' }], 1.2), bell('b', 24, 6.4, 1.3), target('t', 30, 2.0, 2.0)]
  }),
  lv(3, 3, {
    key: 'zwei-tore',
    deco: [g45a, g45b],
    gates: [gate('g1', 19, 7.5, 1), gate('g2', 27, 7.5, 1)],
    ropes: [rope('r1', ...hook(g45a), ...hang(g45a, 3.5), { holds: 'w1' })],
    weights: [weight('w1', ...hang(g45a, 4.3))],
    items: [
      { id: 's1', kind: 'switch', x: hook(g45a)[0], y: 0.95, r: 1.0, need: false, then: [{ t: 'open', id: 'g1' }] },
      sw('s2', 22.7, 1.6, [{ t: 'open', id: 'g2' }], 1.1),
      target('t', 31, 2.0, 1.8)
    ]
  }),
  lv(3, 4, {
    key: 'zwei-glocken',
    wind: 2,
    deco: [gallows(14, 10.8, 4), gallows(22, 10.8, 4)],
    items: [
      bell('a', 18, 10.8 - 5.0, 1.25, { motion: swing(18, 10.8, 5.0, 0.5, 4.2) }),
      bell('b', 26, 10.8 - 5.0, 1.25, { motion: swing(26, 10.8, 5.0, 0.5, 4.2, 0.4) })
    ]
  }),
  lv(3, 5, {
    key: 'rollendes-tor',
    wind: -2,
    deco: [g410],
    polys: [box(24, 6.4, 33, 7.0), box(32.4, 0, 33, 6.4)],
    gates: [gate('g1', 24.4, 6.4)],
    ropes: [rope('r', ...hook(g410), ...hang(g410, 3.5), { holds: 'w', then: [{ t: 'open', id: 'g1' }] })],
    weights: [weight('w', ...hang(g410, 4.3))],
    items: [target('t', 27, 2.0, 1.9, { motion: slide(26.6, 2.0, 31.2, 2.0, 5), skin: 'cart' })]
  }),
  lv(3, 6, {
    key: 'schild-und-wind',
    wind: 3,
    polys: [box(12, 5.2, 26, 5.8), box(12, 0, 12.7, 5.2), bar(31, 0.4, 31.8, 10, 'shield', 0.5)],
    items: [target('t', 24, 2.5, 2.4), jar('j', 9, 1.0, 1.0)]
  }),
  lv(3, 7, {
    key: 'aufwind-seil',
    zones: [zone(10, 0, 17, 14, 0, 6.5)],
    deco: [g48],
    polys: [box(25, 6.4, 33.5, 7.0), box(32.8, 0, 33.5, 6.4)],
    gates: [gate('g1', 25.4, 6.4)],
    ropes: [rope('r', ...hook(g48), ...hang(g48, 3.5), { holds: 'w', then: [{ t: 'open', id: 'g1' }] })],
    weights: [weight('w', ...hang(g48, 4.3))],
    items: [flag('f', 30.4, 4.0, 1.3), flag('f2', 28, 8.8, 1.3)]
  }),
  lv(3, 8, {
    key: 'gibea-fest',
    wind: -2,
    deco: [g49, chain(g49, hook(g49)[0], hook(g49)[1] - 2.8)],
    polys: [hill(18, 24, 3.5), box(28.5, 6.4, 33.5, 7.0), box(32.8, 0, 33.5, 6.4)],
    gates: [gate('g1', 28.9, 6.4)],
    items: [
      sw('s', hook(g49)[0], hook(g49)[1] - 2.8, [{ t: 'open', id: 'g1' }], 1.2),
      bell('b', 21, 8.2, 1.3, { motion: swing(21, 11.6, 3.4, 0.45, 4.4) }),
      jar('j', 21, 4.55, 1.0),
      flag('f', 31, 4.0, 1.3)
    ]
  }),
  lv(3, 9, {
    key: 'letzte-pruefung',
    wind: 2,
    deco: [gallows(10, 10.8, 4), gallows(20, 10.8, 3.5)],
    polys: [hill(13, 18, 3), box(26, 6.4, 33.5, 7.0), box(32.8, 0, 33.5, 6.4)],
    gates: [gate('g1', 26.4, 6.4)],
    ropes: [rope('r', 14, 10.8, 14, 7.3, { holds: 'w', then: [{ t: 'open', id: 'g1' }] })],
    weights: [weight('w', 14, 6.5, 1.3, 1.2)],
    items: [
      bell('b', 23.5, 10.8 - 4.8, 1.25, { motion: swing(23.5, 10.8, 4.8, 0.5, 4.2) }),
      target('t', 30, 2.2, 1.9, { motion: slide(28, 2.2, 31.5, 2.2, 4.6), skin: 'cart' }),
      jar('j', 20, 1.0, 1.0)
    ]
  }),
  lv(3, 10, {
    key: 'das-zeichen',
    intro: 'sign',
    w: 46,
    wind: 1.5,
    polys: [hill(24, 30, 3.4, 'stone')],
    deco: [{ kind: 'cairn', x: 27, y: 3.4, w: 3.6, h: 2.6 }],
    items: [flag('a', 35, 3.4, 1.6), flag('b', 40, 3.8, 1.6), flag('c', 44.5, 3.4, 1.6)]
  })
]

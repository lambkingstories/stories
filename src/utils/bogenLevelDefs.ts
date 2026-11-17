/**
 * "Jonatans Pfeile": the levels as data (no solutions here; they are found by the tool `bogen/tools/solve.ts` and kept in `bogenSolutions.ts`).
 * 44 levels in four chapters of eleven (chapters 3 and 4 are in `bogenLevelDefs34.ts`). The world is a side view, the ground is y = 0, the archer
 * stands at the left. Round things are measured from their middle. Every level can be won in several natural ways: the targets are big.
 */
import type { LevelDef } from './bogenGame'
import { bar, bell, box, chain, flag, gallows, gate, hang, hill, hook, jar, lv, rope, slide, sw, swing, target, weight } from './bogenKit'
import { CH3, CH4 } from './bogenLevelDefs34'

// ═══ chapter 1: the practice ground ═══════════════════════════════════════════════════════════════════════════════════════════
const g7 = gallows(17.5, 10.6, 4.5)
const g5 = gallows(17.5, 8.8, 2.5)
const g10 = gallows(21.5, 8.4, 2.5)
const g11a = gallows(8, 10.6, 5.5)
const g11b = gallows(18, 10.8, 3.5)

const CH1: LevelDef[] = [
  lv(0, 0, { key: 'scheibe', intro: 'pull', items: [target('t', 14, 2.0)] }),
  lv(0, 1, { key: 'weit', intro: 'power', items: [target('t', 27, 2.2)] }),
  lv(0, 2, { key: 'turm', intro: 'height', polys: [box(20.8, 0, 23.2, 4.8)], items: [target('t', 22, 6.2)] }),
  lv(0, 3, { key: 'zwei', polys: [box(25, 0, 29, 3.4)], items: [target('a', 12, 1.8), target('b', 27, 4.8)] }),
  lv(0, 4, { key: 'glocke', intro: 'bell', deco: [g5, chain(g5, hook(g5)[0], hook(g5)[1] - 0.3)], items: [bell('b', ...[g5.x + 2.5, g5.h! - 1.4] as [number, number]), target('t', 29, 1.8)] }),
  lv(0, 5, {
    key: 'huette',
    intro: 'switch',
    polys: [box(21, 4.4, 30.5, 5.0), box(29.8, 0, 30.5, 4.4), box(13.7, 0, 14.3, 2.3)],
    gates: [gate('g1', 21.5, 4.4)],
    items: [sw('s', 14, 3.1, [{ t: 'open', id: 'g1' }]), target('t', 26.3, 2.0)]
  }),
  lv(0, 6, {
    key: 'seil',
    intro: 'rope',
    deco: [g7],
    ropes: [rope('r', ...hook(g7), ...[hook(g7)[0], hook(g7)[1] - 2.4] as [number, number], { holds: 'w' })],
    weights: [weight('w', hook(g7)[0], hook(g7)[1] - 3.1)],
    items: [jar('j', hook(g7)[0], 0.85)]
  }),
  lv(0, 7, { key: 'kruege', intro: 'jar', polys: [box(14, 2.6, 28, 3.1)], items: [jar('a', 16.5, 3.95), jar('b', 21, 3.95), jar('c', 25.5, 3.95)] }),
  lv(0, 8, { key: 'fahnen', intro: 'flag', items: [flag('a', 11, 3.4), flag('b', 28, 8.4)] }),
  lv(0, 9, {
    key: 'mauer',
    deco: [g10, chain(g10, hook(g10)[0], hook(g10)[1] - 0.3)],
    gates: [gate('g1', 18, 7.5, 1)],
    items: [sw('s', 16.7, 3.6, [{ t: 'open', id: 'g1' }]), bell('b', ...[g10.x + 2.5, g10.h! - 1.4] as [number, number], 1.15), target('t', 28, 1.9, 1.8)]
  }),
  lv(0, 10, {
    key: 'pruefung',
    deco: [g11a, g11b],
    polys: [box(25.5, 6.4, 33.5, 7.0), box(32.8, 0, 33.5, 6.4)],
    gates: [gate('g1', 25.9, 6.4)],
    ropes: [rope('r', ...hook(g11b), hook(g11b)[0], hook(g11b)[1] - 3.3, { holds: 'w', then: [{ t: 'open', id: 'g1' }] })],
    weights: [weight('w', hook(g11b)[0], hook(g11b)[1] - 4.0, 1.3, 1.2)],
    items: [target('t', hook(g11a)[0], hook(g11a)[1] - 2.0, 1.5), flag('f', 30.4, 4.0, 1.3)]
  })
]

// ═══ chapter 2: the hill at Gibea (hills, bounces, things that move) ══════════════════════════════════════════════════════════
const g25 = gallows(18, 10.8, 4)
const g27 = gallows(14, 10.6, 4)
const g28a = gallows(8.5, 10.6, 4.5)
const g28b = gallows(16.5, 10.6, 4.5)
const g211 = gallows(14.5, 10.8, 5)

const CH2: LevelDef[] = [
  lv(1, 0, { key: 'huegel', intro: 'hill', polys: [hill(12, 21, 4.6)], items: [target('t', 27.5, 2.0, 2.0)] }),
  lv(1, 1, { key: 'tal', polys: [hill(9, 15, 3.6), hill(20, 27, 4.8)], items: [target('a', 17.5, 1.8, 1.7), target('b', 30.5, 2.2, 2.0)] }),
  lv(1, 2, {
    key: 'stein',
    intro: 'stone',
    polys: [box(12, 5.2, 25, 5.8), box(12, 0, 12.7, 5.2), bar(29, 0.4, 29, 10, 'stone', 0.9)],
    items: [target('t', 24, 2.5, 2.3)]
  }),
  lv(1, 3, {
    key: 'schild',
    intro: 'shield',
    polys: [box(12, 5.2, 26, 5.8), box(12, 0, 12.7, 5.2), bar(31, 0.4, 31.8, 10, 'shield', 0.5)],
    items: [target('t', 24, 2.5, 2.4)]
  }),
  lv(1, 4, {
    key: 'pendel',
    intro: 'swing',
    deco: [g25],
    items: [bell('b', hook(g25)[0], hook(g25)[1] - 5.2, 1.25, { motion: swing(hook(g25)[0], hook(g25)[1], 5.2, 0.55, 4.4) }), target('t', 29, 1.9, 1.9)]
  }),
  lv(1, 5, {
    key: 'rad',
    intro: 'slide',
    items: [target('t', 13, 1.7, 1.7, { motion: slide(13, 1.7, 27, 1.7, 7), skin: 'cart' }), flag('f', 24, 7.4, 1.2)]
  }),
  lv(1, 6, {
    key: 'gewicht',
    intro: 'drop',
    deco: [g27],
    polys: [box(24, 6.2, 33, 6.8), box(32.4, 0, 33, 6.2)],
    gates: [gate('g1', 24.4, 6.2)],
    ropes: [rope('r', ...hook(g27), ...hang(g27, 3.3), { holds: 'w' })],
    weights: [weight('w', ...hang(g27, 4.1))],
    items: [{ id: 's', kind: 'switch', x: hook(g27)[0], y: 0.95, r: 1.0, need: false, then: [{ t: 'open', id: 'g1' }] }, target('t', 29, 2.2, 1.9)]
  }),
  lv(1, 7, {
    key: 'doppel',
    deco: [g28a, g28b],
    ropes: [rope('r1', ...hook(g28a), ...hang(g28a, 3.3), { holds: 'w1' }), rope('r2', ...hook(g28b), ...hang(g28b, 3.3), { holds: 'w2' })],
    weights: [weight('w1', ...hang(g28a, 4.1)), weight('w2', ...hang(g28b, 4.1))],
    items: [jar('a', hook(g28a)[0], 0.9, 0.95), jar('b', hook(g28b)[0], 0.9, 0.95)]
  }),
  lv(1, 8, {
    key: 'versteckt',
    polys: [hill(12, 18, 3.2), box(21.7, 0, 22.3, 3.4)],
    gates: [gate('g1', 27, 7.5, 1)],
    items: [sw('s', 22, 4.7, [{ t: 'open', id: 'g1' }], 1.3), target('t', 31, 2.0, 1.9)]
  }),
  lv(1, 9, {
    key: 'treppe',
    polys: [box(13.5, 0, 15.5, 2.4), box(18.5, 0, 20.5, 4.0), box(23.5, 0, 25.5, 5.6)],
    items: [jar('a', 14.5, 3.3, 0.95), jar('b', 19.5, 4.9, 0.95), jar('c', 24.5, 6.5, 0.95)]
  }),
  lv(1, 10, {
    key: 'tor-von-gibea',
    deco: [g211],
    polys: [hill(8, 13, 2.5), box(25, 6.2, 33.5, 6.8), box(32.8, 0, 33.5, 6.2)],
    gates: [gate('g1', 25.4, 6.2)],
    ropes: [rope('r', ...hook(g211), ...hang(g211, 3.3), { holds: 'w', then: [{ t: 'open', id: 'g1' }] })],
    weights: [weight('w', ...hang(g211, 4.0))],
    items: [bell('b', hook(g211)[0] + 4, hook(g211)[1] - 4.6, 1.25, { motion: swing(hook(g211)[0] + 4, hook(g211)[1], 4.6, 0.5, 4.0) }), flag('f', 30.4, 4.0, 1.3)]
  })
]

export const LEVEL_DEFS: LevelDef[] = [...CH1, ...CH2, ...CH3, ...CH4]

export const CHAPTERS = 4
export const PER_CHAPTER = 11

/**
 * The beads of the dotted way on the map of Joshua: one list per stretch between two stations (the last one leads to the exam).
 * PLACEHOLDER until the own painted map is made (panorama 9908 x 1648, 10 stations + exam): for now the way is the one of Josef between its first eleven stations
 * (the ten stations of Joshua are the first ten of Josef's map, the exam is its eleventh), so the rules of the ways hold (into every medal from the left, out of it on the right,
 * curved, at least 10 beads between two medals). When the own map is there, this file is replaced by the generated list (`panorama_weg.py ... --ausgabe josuaPath.ts`).
 */
import { JOSEF_PATH } from './josefPath'

export const JOSUA_PATH: [number, number][][] = JOSEF_PATH.slice(0, 10)

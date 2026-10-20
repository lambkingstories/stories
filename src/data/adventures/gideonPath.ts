/**
 * The beads of the dotted way on the map of Gideon: one list per stretch between two stations (the last one leads to the exam).
 * PLACEHOLDER until the own painted map is made (panorama 9908 x 1648, 12 stations + exam): for now the way is exactly the one of Josef (its twelve stations and the exam),
 * so the rules of the ways hold (into every medal from the left, out of it on the right, curved, at least 10 beads between two medals).
 * When the own map is there, this file is replaced by the generated list (`panorama_weg.py ... --ausgabe gideonPath.ts`).
 */
import { JOSEF_PATH } from './josefPath'

export const GIDEON_PATH: [number, number][][] = JOSEF_PATH

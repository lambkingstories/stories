/**
 * The beads of the dotted way on the map of "Jakob": one list per stretch between two stations (the last one leads to the exam),
 * [x, y] is the middle of a bead as a share of the whole picture, counted from the top left. EMPTY until the map is painted (the way is measured
 * on the finished picture). The rules are the same as for the other journeys: the way comes into every medal from the LEFT and leaves it
 * on the RIGHT, it is always a smooth curve, at least 10 beads lie between two medals, and nothing lies in the lowest 20 % of the picture.
 */
export const JAKOB_PATH: [number, number][][] = []

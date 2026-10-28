/**
 * The games a gold cup gives to the child: the best replayable games of a journey (memory, puzzle, finding, ...) stand in "My game room" (the
 * profile page) once the gold cup of that journey is won, and can be played again and again there, without stars and without touching the
 * progress of the journey. The numbers are stage ids of the journey; the game of the stage is played as it is.
 */
export const REWARD_GAMES: Record<string, number[]> = {
  'adam-eva': [3, 2],
  noah: [4, 1],
  babel: [3, 2],
  abraham: [8, 2],
  jakob: [11, 12],
  josef: [7, 12],
  mose: [7, 12],
  josua: [5, 2],
  gideon: [12, 8],
  rut: [3, 9],
  samuel: [10, 5],
  david: [7, 13],
  elia: [4, 2],
  jona: [6, 9],
  daniel: [5, 4]
}

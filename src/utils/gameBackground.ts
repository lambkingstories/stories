/**
 * A game that lies on a stage picture shows it soft (blurred and a little darker, see `.game-soft`), so that the figures of the game do not run over
 * the faces of the picture. A game with its own painted backdrop (`.../hintergrund-*.webp`, Anton 28.10.2026) shows it sharp: `softOf` gives the value of the
 * CSS variable `--soft` ("none" for a painted backdrop, nothing for any other picture, which keeps the default blur).
 */
/** A painted backdrop of its own lies in a folder `hintergrund/` (Anton 28.10.2026); everything else is the picture of the stage. */
export const isPainted = (background: string): boolean => /\/hintergrund\//.test(background)

export const isStagePicture = (background: string): boolean => !isPainted(background)

export const softOf = (background: string): string | undefined => (isStagePicture(background) ? undefined : 'none')

/** The backdrop of a game whose data may name its own painted one (`.../hintergrund/...`); otherwise the picture of the stage. */
export const backdropOr = (own: string | undefined, stagePicture: string): string => (own && isPainted(own) ? own : stagePicture)

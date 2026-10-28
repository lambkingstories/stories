/**
 * A game that lies on a stage picture shows it soft (blurred and a little darker, see `.game-soft`), so that the figures of the game do not run over
 * the faces of the picture. A game with its own painted backdrop (`.../hintergrund-*.webp`, Anton 28.10.2026) shows it sharp: `softOf` gives the value of the
 * CSS variable `--soft` ("none" for a painted backdrop, nothing for a stage picture, which keeps the default blur).
 */
export const isStagePicture = (background: string): boolean => /etappe-bild/.test(background)

export const softOf = (background: string): string | undefined => (isStagePicture(background) ? undefined : 'none')

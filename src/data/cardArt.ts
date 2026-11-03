/**
 * The painted hero pictures of the adventure cards (paths below `public/`), by the id of the adventure. Every card has two: the front shows
 * the hero at the start of the story, the back the same hero at its end ("before" and "after"). An adventure without pictures shows its
 * medal on the card (and the lamb on its back) until they are painted.
 * (The list is written by `lambking-design/install_karten.py`.)
 */
export interface CardArt {
  front: string
  back: string
}

export const CARD_ART: Record<string, CardArt> = {
  'adam-eva': { front: 'images/abenteuer/adam-eva/karte-vorn.webp', back: 'images/abenteuer/adam-eva/karte-hinten.webp' },
  'babel': { front: 'images/abenteuer/babel/karte-vorn.webp', back: 'images/abenteuer/babel/karte-hinten.webp' },
  'noah': { front: 'images/abenteuer/noah/karte-vorn.webp', back: 'images/abenteuer/noah/karte-hinten.webp' },
  'abraham': { front: 'images/abenteuer/abraham/karte-vorn.webp', back: 'images/abenteuer/abraham/karte-hinten.webp' },
  'jakob': { front: 'images/abenteuer/jakob/karte-vorn.webp', back: 'images/abenteuer/jakob/karte-hinten.webp' },
  'josef': { front: 'images/abenteuer/josef/karte-vorn.webp', back: 'images/abenteuer/josef/karte-hinten.webp' },
  'mose': { front: 'images/abenteuer/mose/karte-vorn.webp', back: 'images/abenteuer/mose/karte-hinten.webp' },
  'wueste': { front: 'images/abenteuer/wueste/karte-vorn.webp', back: 'images/abenteuer/wueste/karte-hinten.webp' },
  'josua': { front: 'images/abenteuer/josua/karte-vorn.webp', back: 'images/abenteuer/josua/karte-hinten.webp' },
  'gideon': { front: 'images/abenteuer/gideon/karte-vorn.webp', back: 'images/abenteuer/gideon/karte-hinten.webp' },
  'rut': { front: 'images/abenteuer/rut/karte-vorn.webp', back: 'images/abenteuer/rut/karte-hinten.webp' },
  'samuel': { front: 'images/abenteuer/samuel/karte-vorn.webp', back: 'images/abenteuer/samuel/karte-hinten.webp' },
  'david': { front: 'images/abenteuer/david/karte-vorn.webp', back: 'images/abenteuer/david/karte-hinten.webp' },
  'salomo': { front: 'images/abenteuer/salomo/karte-vorn.webp', back: 'images/abenteuer/salomo/karte-hinten.webp' },
  'elia': { front: 'images/abenteuer/elia/karte-vorn.webp', back: 'images/abenteuer/elia/karte-hinten.webp' },
  'elisa': { front: 'images/abenteuer/elisa/karte-vorn.webp', back: 'images/abenteuer/elisa/karte-hinten.webp' },
  'jona': { front: 'images/abenteuer/jona/karte-vorn.webp', back: 'images/abenteuer/jona/karte-hinten.webp' },
  'daniel': { front: 'images/abenteuer/daniel/karte-vorn.webp', back: 'images/abenteuer/daniel/karte-hinten.webp' },
  'ester': { front: 'images/abenteuer/ester/karte-vorn.webp', back: 'images/abenteuer/ester/karte-hinten.webp' },
  'nehemia': { front: 'images/abenteuer/nehemia/karte-vorn.webp', back: 'images/abenteuer/nehemia/karte-hinten.webp' },
  'propheten': { front: 'images/abenteuer/propheten/karte-vorn.webp', back: 'images/abenteuer/propheten/karte-hinten.webp' },
  'weihnachten': { front: 'images/abenteuer/weihnachten/karte-vorn.webp', back: 'images/abenteuer/weihnachten/karte-hinten.webp' },
  'taufe': { front: 'images/abenteuer/taufe/karte-vorn.webp', back: 'images/abenteuer/taufe/karte-hinten.webp' },
  'freunde': { front: 'images/abenteuer/freunde/karte-vorn.webp', back: 'images/abenteuer/freunde/karte-hinten.webp' },
  'wunder': { front: 'images/abenteuer/wunder/karte-vorn.webp', back: 'images/abenteuer/wunder/karte-hinten.webp' }
}

/**
 * The pictures of the memory game: big painted scenes of well-known Bible stories (the files are `public/images/spiele-memory/NN.webp`,
 * numbered like this list). The name is shown as a small ribbon on the card. No god, no angels, no faces in front.
 */
import type { ActivityLocale } from '@/data/activityWords'

export type MemoryScene = Record<ActivityLocale, string>

const s = (de: string, en: string, es: string): MemoryScene => ({ de, en, es })

export const MEMORY_SCENES: MemoryScene[] = [
  s('Die Arche', 'The ark', 'El arca'),
  s('Der brennende Dornbusch', 'The burning bush', 'La zarza ardiente'),
  s('Das Rote Meer', 'The Red Sea', 'El Mar Rojo'),
  s('Der Turm von Babel', 'The Tower of Babel', 'La Torre de Babel'),
  s('Josef in Ägypten', 'Joseph in Egypt', 'José en Egipto'),
  s('Davids Harfe', "David's harp", 'El arpa de David'),
  s('Daniel in der Löwengrube', "Daniel in the lions' den", 'Daniel en el foso de los leones'),
  s('Jona und der Fisch', 'Jonah and the fish', 'Jonás y el pez'),
  s('Die Mauern von Jericho', 'The walls of Jericho', 'Las murallas de Jericó'),
  s('Die zehn Gebote', 'The Ten Commandments', 'Los Diez Mandamientos'),
  s('Brot vom Himmel', 'Bread from heaven', 'Pan del cielo'),
  s('Die Himmelsleiter', 'The ladder to heaven', 'La escalera al cielo'),
  s('Gideons Fackeln', "Gideon's torches", 'Las antorchas de Gedeón'),
  s('Der Stern von Bethlehem', 'The star of Bethlehem', 'La estrella de Belén'),
  s('Das Netz voller Fische', 'The net full of fish', 'La red llena de peces'),
  s('Elias Feuerwagen', "Elijah's chariot of fire", 'El carro de fuego de Elías'),
  s('Esters Palast', "Esther's palace", 'El palacio de Ester'),
  s('Die Taube', 'The dove', 'La paloma')
]

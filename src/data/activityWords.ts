/**
 * The words of the family activity (explain, draw or act out a word, the others guess). Only names of people, places and things that
 * appear in the adventures of the app. The words of "things" are told as a child would say them. God and angels are left out on purpose.
 */
export type ActivityLocale = 'de' | 'en' | 'es'
export interface ActivityWord {
  kind: 'person' | 'thing'
  de: string
  en: string
  es: string
}

const person = (de: string, en: string, es: string): ActivityWord => ({ kind: 'person', de, en, es })
const thing = (de: string, en: string, es: string): ActivityWord => ({ kind: 'thing', de, en, es })

export const ACTIVITY_WORDS: ActivityWord[] = [
  person('Adam', 'Adam', 'Adán'),
  person('Eva', 'Eve', 'Eva'),
  person('Noah', 'Noah', 'Noé'),
  person('Abraham', 'Abraham', 'Abraham'),
  person('Sara', 'Sarah', 'Sara'),
  person('Isaak', 'Isaac', 'Isaac'),
  person('Jakob', 'Jacob', 'Jacob'),
  person('Josef', 'Joseph', 'José'),
  person('Mose', 'Moses', 'Moisés'),
  person('Aaron', 'Aaron', 'Aarón'),
  person('Mirjam', 'Miriam', 'Miriam'),
  person('Josua', 'Joshua', 'Josué'),
  person('Gideon', 'Gideon', 'Gedeón'),
  person('Rut', 'Ruth', 'Rut'),
  person('Samuel', 'Samuel', 'Samuel'),
  person('David', 'David', 'David'),
  person('Goliat', 'Goliath', 'Goliat'),
  person('Salomo', 'Solomon', 'Salomón'),
  person('Elia', 'Elijah', 'Elías'),
  person('Elisa', 'Elisha', 'Eliseo'),
  person('Jona', 'Jonah', 'Jonás'),
  person('Daniel', 'Daniel', 'Daniel'),
  person('Ester', 'Esther', 'Ester'),
  person('Nehemia', 'Nehemiah', 'Nehemías'),
  person('Maria', 'Mary', 'María'),
  person('Johannes der Täufer', 'John the Baptist', 'Juan el Bautista'),
  person('Petrus', 'Peter', 'Pedro'),
  person('Paulus', 'Paul', 'Pablo'),

  thing('Arche', 'Ark', 'Arca'),
  thing('Regenbogen', 'Rainbow', 'Arcoíris'),
  thing('Taube', 'Dove', 'Paloma'),
  thing('Ölzweig', 'Olive branch', 'Rama de olivo'),
  thing('Turm zu Babel', 'Tower of Babel', 'Torre de Babel'),
  thing('Kamel', 'Camel', 'Camello'),
  thing('Brunnen', 'Well', 'Pozo'),
  thing('Himmelsleiter', 'Ladder to heaven', 'Escalera al cielo'),
  thing('Bunter Mantel', 'Coat of many colors', 'Túnica de colores'),
  thing('Kornspeicher', 'Granary', 'Granero'),
  thing('Brennender Dornbusch', 'Burning bush', 'Zarza ardiente'),
  thing('Rotes Meer', 'Red Sea', 'Mar Rojo'),
  thing('Manna', 'Manna', 'Maná'),
  thing('Zehn Gebote', 'Ten Commandments', 'Diez Mandamientos'),
  thing('Stiftshütte', 'Tabernacle', 'Tabernáculo'),
  thing('Berg Sinai', 'Mount Sinai', 'Monte Sinaí'),
  thing('Wüste', 'Desert', 'Desierto'),
  thing('Mauern von Jericho', 'Walls of Jericho', 'Murallas de Jericó'),
  thing('Posaune', 'Trumpet', 'Trompeta'),
  thing('Schleuder', 'Sling', 'Honda'),
  thing('Schaf', 'Sheep', 'Oveja'),
  thing('Harfe', 'Harp', 'Arpa'),
  thing('Krone', 'Crown', 'Corona'),
  thing('Tempel', 'Temple', 'Templo'),
  thing('Mauer', 'Wall', 'Muro'),
  thing('Feuerwagen', 'Chariot of fire', 'Carro de fuego'),
  thing('Pflug', 'Plow', 'Arado'),
  thing('Löwengrube', "Lions' den", 'Foso de los leones'),
  thing('Großer Fisch', 'Big fish', 'Gran pez'),
  thing('Krippe', 'Manger', 'Pesebre'),
  thing('Stern von Bethlehem', 'Star of Bethlehem', 'Estrella de Belén'),
  thing('Hirten', 'Shepherds', 'Pastores'),
  thing('Jordan', 'Jordan River', 'Río Jordán'),
  thing('Boot', 'Boat', 'Barca'),
  thing('Netz', 'Net', 'Red'),
  thing('Sturm', 'Storm', 'Tormenta'),
  thing('Fünf Brote und zwei Fische', 'Five loaves and two fish', 'Cinco panes y dos peces')
]

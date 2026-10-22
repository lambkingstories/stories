/**
 * The order of all adventures on the adventure page: the time line of the Bible, from Adam and Eve to Paul (31 adventures, see
 * `PLAN-Abenteuer-Gesamtreise-2026-10-15.md`). The adventures that are not built (or not shown in this build) stand closed in their place,
 * so the child sees where the next ones will come. The number is the place on the time line.
 */
import { adventureLanguage } from '@/use/adventureLanguage'

export interface Epoch {
  id: string
  de: string
  en: string
  subDe: string
  subEn: string
}

export const EPOCHS: Epoch[] = [
  { id: 'anfang', de: 'Am Anfang', en: 'In the beginning', subDe: 'Schöpfung, Flut, Turm', subEn: 'Creation, flood, tower' },
  { id: 'erzvaeter', de: 'Die Erzväter', en: 'The patriarchs', subDe: 'Die Familie Abrahams', subEn: "Abraham's family" },
  { id: 'auszug', de: 'Auszug und Land', en: 'Exodus and the land', subDe: 'Aus Ägypten nach Kanaan', subEn: 'From Egypt to Canaan' },
  { id: 'koenige', de: 'Richter und Könige', en: 'Judges and kings', subDe: 'Helden und ein Hirtenjunge', subEn: 'Heroes and a shepherd boy' },
  { id: 'propheten', de: 'Propheten und Exil', en: 'Prophets and exile', subDe: "Gottes Boten und die Heimkehr", subEn: "God's messengers and the return" },
  { id: 'jesus', de: 'Jesus', en: 'Jesus', subDe: 'Von der Geburt bis zur Auferstehung', subEn: 'From his birth to the resurrection' },
  { id: 'gemeinde', de: 'Die erste Gemeinde', en: 'The first church', subDe: 'Pfingsten und Paulus', subEn: 'Pentecost and Paul' }
]

export interface TimelineEntry {
  id: string
  de: string
  en: string
  epoch: string
}

export const TIMELINE: TimelineEntry[] = [
  { id: 'adam-eva', de: 'Adam und Eva', en: 'Adam and Eve', epoch: 'anfang' },
  { id: 'noah', de: 'Noah', en: 'Noah', epoch: 'anfang' },
  { id: 'babel', de: 'Der Turm von Babel', en: 'The Tower of Babel', epoch: 'anfang' },
  { id: 'abraham', de: 'Abraham', en: 'Abraham', epoch: 'erzvaeter' },
  { id: 'jakob', de: 'Isaak und Jakob', en: 'Isaac and Jacob', epoch: 'erzvaeter' },
  { id: 'josef', de: 'Josef', en: 'Joseph', epoch: 'erzvaeter' },
  { id: 'mose', de: 'Mose', en: 'Moses', epoch: 'auszug' },
  { id: 'josua', de: 'Josua und Jericho', en: 'Joshua and Jericho', epoch: 'auszug' },
  { id: 'gideon', de: 'Gideon', en: 'Gideon', epoch: 'koenige' },
  { id: 'rut', de: 'Rut', en: 'Ruth', epoch: 'koenige' },
  { id: 'samuel', de: 'Samuel und Saul', en: 'Samuel and Saul', epoch: 'koenige' },
  { id: 'david', de: 'David', en: 'David', epoch: 'koenige' },
  { id: 'salomo', de: 'Salomo', en: 'Solomon', epoch: 'koenige' },
  { id: 'elia', de: 'Elia', en: 'Elijah', epoch: 'propheten' },
  { id: 'elisa', de: 'Elisa und Naaman', en: 'Elisha and Naaman', epoch: 'propheten' },
  { id: 'jona', de: 'Jona', en: 'Jonah', epoch: 'propheten' },
  { id: 'daniel', de: 'Daniel', en: 'Daniel', epoch: 'propheten' },
  { id: 'ester', de: 'Ester', en: 'Esther', epoch: 'propheten' },
  { id: 'nehemia', de: 'Nehemia baut die Mauer', en: 'Nehemiah builds the wall', epoch: 'propheten' },
  { id: 'propheten', de: 'Die Propheten kündigen den König an', en: 'The prophets announce the king', epoch: 'propheten' },
  { id: 'weihnachten', de: 'Weihnachten', en: 'Christmas', epoch: 'jesus' },
  { id: 'jesus-jung', de: 'Der junge Jesus und die Taufe', en: 'The young Jesus and his baptism', epoch: 'jesus' },
  { id: 'jesus-freunde', de: 'Jesus ruft seine Freunde', en: 'Jesus calls his friends', epoch: 'jesus' },
  { id: 'wunder', de: 'Jesu Wunder am See', en: 'The miracles at the lake', epoch: 'jesus' },
  { id: 'jesus-heilt', de: 'Jesus heilt', en: 'Jesus heals', epoch: 'jesus' },
  { id: 'gleichnisse', de: 'Geschichten von Jesus', en: 'Stories of Jesus', epoch: 'jesus' },
  { id: 'zachaeus', de: 'Zachäus und Lazarus', en: 'Zacchaeus and Lazarus', epoch: 'jesus' },
  { id: 'letzte-woche', de: 'Die letzte Woche', en: 'The last week', epoch: 'jesus' },
  { id: 'ostern', de: 'Ostern', en: 'Easter', epoch: 'jesus' },
  { id: 'pfingsten', de: 'Pfingsten', en: 'Pentecost', epoch: 'gemeinde' },
  { id: 'paulus', de: 'Paulus', en: 'Paul', epoch: 'gemeinde' }
]

/** The place of an adventure on the time line (1 to 31), 0 when it is not on the list. */
export function timelineNumber(id: string): number {
  return TIMELINE.findIndex((e) => e.id === id) + 1
}

export interface EpochGroup<T> {
  epoch: Epoch
  title: string
  sub: string
  entries: { nr: number; id: string; title: string; item: T | null }[]
}

/**
 * Lays the adventures of this build over the time line: one group per epoch, in the order of the Bible; an adventure that is not in the
 * build stands closed (`item` is null) in its place. An adventure that is not on the list at all goes to the end of the last group.
 */
export function groupByEpoch<T extends { journey: { id: string; title: string } }>(items: T[]): EpochGroup<T>[] {
  const en = adventureLanguage.value === 'en'
  const byId = new Map(items.map((i) => [i.journey.id, i]))
  const groups: EpochGroup<T>[] = EPOCHS.map((e) => ({ epoch: e, title: en ? e.en : e.de, sub: en ? e.subEn : e.subDe, entries: [] }))
  TIMELINE.forEach((t, i) => {
    const g = groups.find((x) => x.epoch.id === t.epoch)
    if (!g) return
    const item = byId.get(t.id) ?? null
    g.entries.push({ nr: i + 1, id: t.id, title: item ? item.journey.title : en ? t.en : t.de, item })
  })
  const last = groups[groups.length - 1]!
  items.filter((i) => timelineNumber(i.journey.id) === 0).forEach((item, k) => {
    last.entries.push({ nr: TIMELINE.length + k + 1, id: item.journey.id, title: item.journey.title, item })
  })
  return groups
}

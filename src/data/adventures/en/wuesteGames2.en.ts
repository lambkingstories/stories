/**
 * English texts of the seven new games of "The People in the Desert" (see `../wuesteGames2.ts`): the same shape as the German data, only the words (hints, messages, labels).
 * Laid over the German data by `localize()` in `wueste.en.ts`. Words as in the World English Bible where a verse is told (Jethro, Joshua, Eleazar, Balaam).
 */
import type { TextOverlay } from '../localize'
import type { CommissionGame, DonkeyGame, EnoughGame, JugsGame, QuailsGame, SerpentGame, StaffsGame } from '@/types/wuesteGames2'

export const KRUG_EN: TextOverlay<JugsGame> = {
  people: [{ label: 'The old woman' }, { label: 'The father' }, { label: 'The mother with the child' }, { label: 'The boy' }, { label: 'The elder' }],
  rounds: [
    { hint: 'Get water at the rock and bring it to the thirsty: drag the jug to the rock and then to a person. Tapping works too.' },
    { hint: 'Now everybody is thirsty. Fill the jug again, as often as it takes.' }
  ],
  texts: {
    field: 'The rock with the cleft and the thirsty people in the camp',
    empty: 'The jug is empty. Get water at the rock first.',
    full: 'The jug is full already. Bring it to a person.',
    filled: 'The jug is full.',
    served: 'That feels good! He drinks the fresh water.',
    thirsty: '{name}: thirsty',
    drank: '{name}: has had a drink',
    jug: 'The jug',
    spring: 'The rock with the water',
    count: 'People with water: {n} of {total}',
    done: 'Moses struck the rock, and water came out. The people could drink.'
  }
}

export const GENUG_EN: TextOverlay<EnoughGame> = {
  rounds: [
    { hint: 'The people bring gifts for the tent. Tap Moses as soon as the heap reaches the dashed line.' },
    { hint: 'Once more, and now they come faster. When is it enough?' }
  ],
  texts: {
    field: 'The building site of the tent with the heap of gifts and Moses',
    early: 'It is not enough yet. Wait until the heap reaches the line.',
    ok: 'Enough! The people stop giving.',
    late: 'Far too much came. Now Moses calls by himself: Enough!',
    count: 'Gifts on the heap: {n}',
    moses: 'Moses: call "Enough"',
    done: 'The people brought more than the craftsmen needed. So Moses had it called out: Nobody shall bring anything more!'
  }
}

export const WACHTELN_EN: TextOverlay<QuailsGame> = {
  rounds: [
    { hint: 'A wind brings quails into the camp. Tap each quail, and it hops into the basket.' },
    { hint: 'More are coming. Catch as many as you can.' }
  ],
  texts: {
    field: 'The camp in the morning, quails coming down around the tents',
    caught: 'A quail in the basket.',
    gone: 'A quail has walked on.',
    count: 'Quails in the basket: {n} of {total}',
    basket: 'The basket',
    quail: 'A quail',
    done: 'A wind brought quails from the sea. They fell all around the camp, and the people gathered them.'
  }
}

export const STAB_EN: TextOverlay<StaffsGame> = {
  rounds: [
    { hint: 'Lay the twelve staffs down before God: tap each staff, and it stands in the row.' },
    { hint: 'The next morning: which staff has blossomed? Tap it and see what grew on it.' }
  ],
  texts: {
    field: 'The inside of the tent with the golden chest and twelve staffs',
    staff: 'Staff {n} of {total}',
    aaron: "Aaron's staff",
    wrong: 'This staff is dry and bare. Look for the one that has blossomed.',
    night: 'Moses lays the staffs down before God for the night.',
    found: "That is Aaron's staff! Tap it and see what grew on it.",
    stage: 'This is how the staff grows: step {n} of 3.',
    count: 'Progress: {n} of {total}',
    done: "Aaron's staff had sprouted leaves and blossoms, and almonds hung on it."
  }
}

export const SCHLANGE_EN: TextOverlay<SerpentGame> = {
  people: [{ label: 'The old man' }, { label: 'The mother' }, { label: 'The young man' }, { label: 'The girl' }, { label: 'The bearded man' }, { label: 'The older woman' }],
  rounds: [
    { hint: 'Raise the pole: drag it up from the top, or tap it until it stands straight.' },
    { hint: 'Whoever looks up at the sign stays alive. Tap the people in the camp.' }
  ],
  texts: {
    field: 'The camp ground with the pole and the people',
    pole: 'The pole with the sign of bronze',
    weak: '{name}: tired and weak',
    well: '{name} looks up at the sign.',
    lean: 'The pole is not straight yet. Try once more.',
    stands: 'The pole stands. The sign shines.',
    count: 'Progress: {n} of {total}',
    done: 'Moses made a snake of bronze and set it on a pole. Whoever looked at it stayed alive.'
  }
}

export const ESELIN_EN: TextOverlay<DonkeyGame> = {
  steps: [
    { hint: 'The donkey sees a light on the road. Where does she turn aside? Tap there.', label: 'The field on the right', ok: 'The donkey turns into the field.' },
    { hint: 'Here the road has walls. Where does the donkey press herself?', label: 'The wall', ok: 'The donkey presses against the wall.' },
    { hint: 'Now there is no room at all. What does the donkey do? Tap her.', label: 'The donkey', ok: 'The donkey lies down under Balaam.' }
  ],
  texts: {
    field: 'The road in the vineyard with the donkey and the light',
    donkey: 'The donkey with Balaam',
    light: 'A quiet light on the road',
    wrong: 'The donkey does not go there. Look where the light stands.',
    eyes: 'Then God opened Balaam’s eyes, and he bowed down.',
    count: 'Places done: {n} of {total}',
    done: 'The donkey saw the angel of God first. Balaam did not see him until God opened his eyes.'
  }
}

export const EINSETZEN_EN: TextOverlay<CommissionGame> = {
  rounds: [
    { hint: 'Lead Joshua to the place in front of Eleazar and the people: drag him there, or tap Joshua first and then the place.' },
    { hint: 'Moses lays his hands on Joshua: keep your finger on Joshua until the bar is full.' }
  ],
  texts: {
    field: 'The place in front of the tent with Moses, Eleazar, Joshua and the people',
    joshua: 'Joshua',
    spot: 'The place in front of Eleazar and the people',
    wrong: 'This is not the place. Put Joshua in front of Eleazar and in front of the people.',
    placed: 'Joshua stands in front of Eleazar and in front of the whole community.',
    hold: 'Keep your finger on Joshua until the bar is full.',
    laid: 'Moses lays his hands on Joshua.',
    count: 'Progress: {n} of {total}',
    done: 'Moses laid his hands on Joshua and set him before the priest Eleazar and before the whole community.'
  }
}

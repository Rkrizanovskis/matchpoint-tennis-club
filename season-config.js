// Matchpoint Tennis Club — season configuration.
// This is the ONE place to edit when the schedule changes between seasons:
// which days run, the time slots, who coaches, and the default roster/template.
// app.js and the seed tool both read from here.
//
// Currently active: SUMMER 2026 (Tue = Justīne, Wed = Paša, Thu = Paša)

export const TIME_SLOTS = ['19:00-20:00', '20:00-21:00'];

// offset = days after Monday (Mon 0, Tue 1, Wed 2, Thu 3).
export const DAYS = {
  monday:    { offset: 0, available: false, instructor: null,      show: false },
  tuesday:   { offset: 1, available: true,  instructor: 'Justīne', show: true },
  wednesday: { offset: 2, available: true,  instructor: 'Paša',    show: true },
  thursday:  { offset: 3, available: true,  instructor: 'Paša',    show: true }
};

// Days rendered in the grid, left-to-right.
export const RENDER_DAYS = Object.keys(DAYS).filter((d) => DAYS[d].show);

// Days that can hold bookings (used for seeding + listeners).
export const BOOKABLE_DAYS = Object.keys(DAYS).filter((d) => DAYS[d].available);

export const MAX_CAPACITY = 5;

// Informational, non-bookable slots: `${day}|${time}` -> note text.
// Thursday 20:00 is individual / reserve lessons with Paša, booked ahead.
export const SLOT_NOTES = {
  'thursday|20:00-21:00': 'Individuālās vai rezervistu nodarbības ar Pašu (jāpiesaka vismaz pāris dienas pirms).'
};

// Default roster — one entry per real person. Players who train twice a week
// (e.g. Karīna, Liza, Viktorija, Nikola, Kristīna Š.) appear once here and are
// placed into both of their slots in DEFAULT_TEMPLATE below.
// skillLevel defaults to 'regular' (the club sheet doesn't distinguish levels).
export const DEFAULT_PLAYERS = [
  // — Tuesday 19:00 —
  { id: 'eduards',    name: 'Eduards',     skillLevel: 'regular' },
  { id: 'klavs',      name: 'Klāvs',       skillLevel: 'regular' },
  { id: 'ricards',    name: 'Ričards',     skillLevel: 'regular' },
  { id: 'julija',     name: 'Jūlija',      skillLevel: 'regular' },
  { id: 'karina',     name: 'Karīna',      skillLevel: 'regular' }, // Tue 19:00 + Thu 19:00
  // — Wednesday 19:00 —
  { id: 'aivars',     name: 'Aivars',      skillLevel: 'regular' },
  { id: 'edgars',     name: 'Edgars',      skillLevel: 'regular' },
  { id: 'mazens',     name: 'Mazens',      skillLevel: 'regular' },
  { id: 'agnese',     name: 'Agnese',      skillLevel: 'regular' },
  { id: 'arta',       name: 'Arta',        skillLevel: 'regular' },
  // — Thursday 19:00 —
  { id: 'sintija',    name: 'Sintija',     skillLevel: 'regular' },
  { id: 'elvi',       name: 'Elvi',        skillLevel: 'regular' },
  { id: 'rita',       name: 'Rita',        skillLevel: 'regular' },
  // — 20:00 group (Tue / Wed) —
  { id: 'liza',       name: 'Liza',        skillLevel: 'regular' }, // Tue 20:00 + Wed 20:00
  { id: 'viktorija',  name: 'Viktorija',   skillLevel: 'regular' }, // Tue 20:00 + Wed 20:00
  { id: 'nikola',     name: 'Nikola',      skillLevel: 'regular' }, // Tue 20:00 + Thu 19:00
  { id: 'kristina_s', name: 'Kristīna Š.', skillLevel: 'regular' }, // Tue 20:00 + Wed 20:00
  { id: 'elza_p',     name: 'Elza P.',     skillLevel: 'regular' },
  { id: 'darta',      name: 'Dārta',       skillLevel: 'regular' },
  { id: 'simona',     name: 'Simona',      skillLevel: 'regular' },
  // — reservists (bookable into open slots, not placed by default) —
  { id: 'kristine',   name: 'Kristīne',    skillLevel: 'regular' },
  { id: 'liva',       name: 'Līva',        skillLevel: 'regular' },
  { id: 'rihards',    name: 'Rihards',     skillLevel: 'regular' },
  { id: 'oto',        name: 'Oto',         skillLevel: 'regular' },
  { id: 'diana',      name: 'Diāna',       skillLevel: 'regular' },
  { id: 'loreta',     name: 'Loreta',      skillLevel: 'regular' },
  { id: 'zelma',      name: 'Zelma',       skillLevel: 'regular' },
  { id: 'janis',      name: 'Jānis',       skillLevel: 'regular' },
  { id: 'valdis',     name: 'Valdis',      skillLevel: 'regular' },
  { id: 'mikelis',    name: 'Miķelis',     skillLevel: 'regular' },
  { id: 'evija',      name: 'Evija',       skillLevel: 'regular' }
];

// Default weekly template — which player IDs sit in each bookable slot.
// (Thursday 20:00 is a note slot, so it has no roster.)
export const DEFAULT_TEMPLATE = {
  tuesday: {
    '19:00-20:00': { players: ['eduards', 'klavs', 'ricards', 'julija', 'karina'] },
    '20:00-21:00': { players: ['liza', 'viktorija', 'nikola', 'kristina_s', 'elza_p'] }
  },
  wednesday: {
    '19:00-20:00': { players: ['aivars', 'edgars', 'mazens', 'agnese', 'arta'] },
    '20:00-21:00': { players: ['darta', 'liza', 'simona', 'kristina_s', 'viktorija'] }
  },
  thursday: {
    '19:00-20:00': { players: ['sintija', 'elvi', 'karina', 'rita', 'nikola'] }
  }
};

export function slotNote(day, time) {
  return SLOT_NOTES[`${day}|${time}`] || null;
}

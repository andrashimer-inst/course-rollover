import { addDays, daysBetween } from './rolloverData'

// Sample data for the "Fix dates" step. Everything here is made up.
// Fall 2026 dates are all weekdays, because nothing was taught on a weekend. The items, their Fall 2026 dates and the Spring 2027 dates follow the screens of the dates flow:
// each item keeps its week of the term and its weekday, and spring break is skipped.

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day)

// `skew` is the number of days the item sits off its weekday in the new term, because it was set by hand or comes from
// the college calendar. It is what makes two dates land on a closed day in each option (a weekend or spring break).
export type DateItem = { id: string; title: string; kind: string; module: string; old: Date; skew?: number; time?: string }

export const DATE_ITEMS: DateItem[] = [
  { id: 'quiz1', title: 'Quiz 1', kind: 'Quiz', module: 'Module 2: Cells', old: d(2026, 9, 4) },
  { id: 'quiz3', title: 'Quiz 3: Membranes', kind: 'Quiz', module: 'Module 3: Membranes', old: d(2026, 9, 11) },
  { id: 'lab1', title: 'Lab report 1', kind: 'Assignment', module: 'Module 3: Membranes', old: d(2026, 9, 18) },
  // A group discussion can have a different date for each group, so every group has a row of its own. Group B was set by hand
  // to a day that is a Saturday in the new term.
  { id: 'debate-a', title: 'Case study debate', kind: 'Group discussion · Group A', module: 'Module 3: Membranes', old: d(2026, 9, 24) },
  { id: 'debate-b', title: 'Case study debate', kind: 'Group discussion · Group B', module: 'Module 3: Membranes', old: d(2026, 10, 1), skew: 2 },
  { id: 'debate-c', title: 'Case study debate', kind: 'Group discussion · Group C', module: 'Module 3: Membranes', old: d(2026, 10, 8) },
  { id: 'energy', title: 'Energy essay', kind: 'Assignment', module: 'Module 4: Energy', old: d(2026, 9, 25), skew: 2 },
  { id: 'lab3', title: 'Lab session 3', kind: 'Event', module: 'Module 4: Energy', old: d(2026, 9, 21), time: '14:00' },
  { id: 'midterm', title: 'Midterm exam', kind: 'Quiz', module: 'Module 5: Genetics basics', old: d(2026, 10, 13), skew: -6, time: '15:00' },
  { id: 'practice', title: 'Practice quiz', kind: 'Quiz', module: 'Module 6: Review week', old: d(2026, 10, 26) },
  { id: 'brief', title: 'Final project brief', kind: 'Assignment', module: 'Module 7: Final project', old: d(2026, 12, 4) },
  { id: 'present', title: 'Final presentation', kind: 'Event', module: 'Module 7: Final project', old: d(2026, 12, 3), time: '16:30' },
]

// Items that have no due date in the old course. They stay empty, or the teacher sets them to the last day of the course.
export type NoDateItem = { id: string; title: string; kind: string; module: string }
export const NO_DATE_ITEMS: NoDateItem[] = [
  { id: 'reflection', title: 'Reading reflection', kind: 'Assignment', module: 'Module 2: Cells' },
  { id: 'checkin', title: 'Weekly check-in', kind: 'Discussion', module: 'Module 4: Energy' },
  { id: 'survey', title: 'Extra credit survey', kind: 'Quiz', module: 'Module 6: Review week' },
]
// 'empty' keeps the item without a date, 'last' gives it the last day of the course, and a date (YYYY-MM-DD) is one picked by hand.
export type NoDateChoice = string
// The last day of the course: the last Friday of the old term, placed in the new term like the other dates.
export const lastDayOf = (state: { mode: DateMode; startText: string }) => placed(d(2026, 12, 11), startFor(state.mode, state.startText))

// The time of day an item is due, in UTC. Most items are due at the end of the day.
export const DEFAULT_TIME = '23:59'
// The moment a date and a UTC time stand for, so it can be shown in UTC and in the viewer's own time zone.
const instantOf = (date: Date, time: string) => {
  const [h, m] = time.split(':').map(Number)
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m))
}
export const utcLabel = (date: Date, time: string) =>
  `${instantOf(date, time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })} UTC`
export const localLabel = (date: Date, time: string) =>
  instantOf(date, time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
export const timeOf = (item: { time?: string }) => item.time ?? DEFAULT_TIME

export const FALL_START = d(2026, 8, 31)
export const SPRING_START = d(2027, 1, 25)
const SPRING_BREAK = { from: d(2027, 3, 15), to: d(2027, 3, 19) }
const CLOSED = [{ date: d(2027, 2, 15), name: "Presidents' Day" }]

export type DateMode = 'calendar' | 'clear'

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
export const mondayOf = (date: Date) => addDays(date, -((date.getDay() + 6) % 7))

// The first day typed in, as a date. Not valid when it is empty or not a date.
export function parseStart(text: string): Date | null {
  const parsed = new Date(text)
  return text.trim() === '' || Number.isNaN(parsed.getTime()) ? null : parsed
}

// The first day of the course sets where week 1 lands. It starts on the first day of the Spring 2027 term.
export const startFor = (_mode: DateMode, startText: string) => mondayOf(parseStart(startText) ?? SPRING_START)

// Where an item lands when each one keeps its week of the term and weekday. Later weeks move a week on.
export function placed(old: Date, start: Date): Date {
  const moved = addDays(old, daysBetween(FALL_START, start))
  return moved >= SPRING_BREAK.from ? addDays(moved, 7) : moved
}

// The name of the closed day a date falls on, if any.
export function closedName(date: Date): string | null {
  const hit = CLOSED.find((c) => sameDay(c.date, date))
  if (hit) return hit.name
  // Saturdays and Sundays are not teaching days.
  if (date.getDay() === 6) return 'a Saturday'
  if (date.getDay() === 0) return 'a Sunday'
  return date >= SPRING_BREAK.from && date <= SPRING_BREAK.to ? 'Spring break' : null
}

// A teaching day is not a weekend day, a holiday or spring break.
const isTeaching = (date: Date) => closedName(date) === null
export function nextTeaching(date: Date, step: 1 | -1): Date {
  let next = addDays(date, step)
  while (!isTeaching(next)) next = addDays(next, step)
  return next
}

export const fmtShort = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

// ---- What the teacher chose for each item ----
export type DateChoice = 'keep' | 'before' | 'after' | 'custom'
export type RowChoice = { choice: DateChoice; custom: string }

export type FixDatesState = {
  mode: DateMode
  startText: string
  // What the "Fix non-teaching days" choice is set to. Empty when none is selected.
  fixAll: '' | 'before' | 'after'
  rows: Record<string, RowChoice>
  // What the items with no due date get. Missing means they stay empty.
  noDate: Record<string, NoDateChoice>
  // Last term's calendar entries stay out of the copy. Missing means they are left out (the default).
  keepOldEvents?: boolean
}
export const INITIAL_DATES: FixDatesState = { mode: 'calendar', startText: '2027-01-25', fixAll: '', rows: {}, noDate: {} }

export type DateRowInfo = {
  item: DateItem
  base: Date
  closed: string | null
  // The date the item ends up on with the current choice. Null when the dates are cleared.
  final: Date | null
  before: Date
  after: Date
  choice: RowChoice | undefined
  // The closed day the item still sits on after the choice, if any. Null once it has moved to a teaching day.
  finalClosed: string | null
  // Rows that sit on a closed day need a decision. The others are done from the start.
  needsDecision: boolean
  done: boolean
  customProblem: string | null
}

export function rowInfo(item: DateItem, state: FixDatesState): DateRowInfo {
  const start = startFor(state.mode, state.startText)
  // Each item keeps its week and weekday, except the few that sit off their weekday (see `skew`).
  const base = addDays(placed(item.old, start), item.skew ?? 0)
  const closed = closedName(base)
  const before = nextTeaching(base, -1)
  const after = nextTeaching(base, 1)
  const choice = state.rows[item.id]
  const customDate = choice?.choice === 'custom' ? parseStart(choice.custom) : null
  const customProblem =
    choice?.choice === 'custom'
      ? customDate === null
        ? 'Enter a date'
        : closedName(customDate)
          ? `${closedName(customDate)} is a non-teaching day`.replace(/^a /, 'A ')
          : null
      : null
  const picked = choice?.choice ?? 'keep'
  const final =
    state.mode === 'clear'
      ? null
      : picked === 'before'
        ? before
        : picked === 'after'
          ? after
          : picked === 'custom'
            ? (customDate ?? base)
            : base
  const needsDecision = state.mode !== 'clear' && closed !== null
  return { item, base, closed, final, before, after, choice, finalClosed: final ? closedName(final) : closed, needsDecision, done: state.mode === 'clear' || !needsDecision || choice !== undefined, customProblem }
}

// For the summary: how many dates moved to the new term as placed, and how many the teacher changed.
export function dateCounts(state: FixDatesState): { shifted: number; edited: number } {
  if (state.mode === 'clear') return { shifted: 0, edited: 0 }
  const infos = DATE_ITEMS.map((item) => rowInfo(item, state))
  const edited = infos.filter((r) => r.final && r.final.toDateString() !== r.base.toDateString()).length
  return { shifted: infos.length - edited, edited }
}

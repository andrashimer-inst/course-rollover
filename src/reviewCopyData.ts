import { DESIGN_RULES, DIMENSIONS } from './designCheckData'
import type { DesignRule, Dimension } from './designCheckData'
import { EXTRA_RULES, choiceOf } from './reviewData'
import type { Choice, ReviewRow } from './reviewData'
import { DATE_ITEMS, NO_DATE_ITEMS, rowInfo, fmtShort } from './fixDatesData'
import type { FixDatesState } from './fixDatesData'
import type { EducatorComment, TodoItem } from './rolloverData'

// Sample logic for the "Review and copy" step. Everything here is made up.
// The readiness check goes through the rules of the "Course Design Rule definitions" sheet and looks at what
// was decided in the learning object review. The to-do list gathers what is left for the teacher to do by hand.

export type ReadyStatus = 'pass' | 'fixed' | 'later' | 'manual'

export type ReadyRule = { rule: DesignRule; status: ReadyStatus; note: string }

export const STATUS_LABEL: Record<ReadyStatus, string> = {
  pass: 'Ready',
  fixed: 'Fixed in the copy',
  later: 'Fix after the copy',
  manual: 'Action required',
}

const ALL_RULES = [...DESIGN_RULES, ...EXTRA_RULES]
const FIXED: Choice[] = ['aifix', 'aicheck', 'leave']

// How each rule stands with the choices made so far. The rules are the sheet's, plus the accessibility checks.
// `off` lists the rules the educator switched off. They are left out of the check.
export function readiness(rows: ReviewRow[], choices: Record<string, Choice>, off: string[] = []): ReadyRule[] {
  const out: ReadyRule[] = []
  for (const rule of ALL_RULES) {
    if (off.includes(rule.id)) continue
    if (rule.severity === 'pass') {
      out.push({ rule, status: 'pass', note: 'Nothing to change.' })
      continue
    }
    // Due dates are set in the dates step, so they are not a finding of the review.
    if (rule.id === 'due-dates') {
      out.push({ rule, status: 'fixed', note: 'Set in the Fix dates step.' })
      continue
    }
    const hit = rows.filter((r) => r.findings.some((f) => f.rule.id === rule.id))
    if (hit.length === 0) {
      // Rules that none of the review rows cover can only be fixed by hand, after the copy.
      const where = rule.references?.length ? ` (${rule.references.join(', ')})` : ''
      out.push({ rule, status: 'manual', note: `${rule.reason ?? rule.resources?.[0]?.reason ?? 'Needs a change in the course.'}${where}` })
      continue
    }
    const open = hit.filter((r) => !FIXED.includes(choiceOf(r, choices) as Choice))
    out.push(
      open.length === 0
        ? { rule, status: 'fixed', note: `${hit.length === 1 ? hit[0].title : `${hit.length} items`} fixed or left out in the review.` }
        : { rule, status: 'later', note: `${open.map((r) => r.title).join(', ')} to fix after the copy.` },
    )
  }
  return out
}

export const dimensionsOf = (list: ReadyRule[]) =>
  DIMENSIONS.map((d: Dimension) => ({ dimension: d, rules: list.filter((x) => x.rule.dimension === d) })).filter((d) => d.rules.length > 0)

// ---- The to-do list ----

export const TODO_GROUPS = [
  'Fix after the copy',
  'Read the AI fixes',
  'Do it yourself',
  'Set the dates',
  'Check after the copy',
] as const

// When students see the course.
// `date` is YYYY-MM-DD and `time` is HH:MM in the viewer's own time zone, the day and time the course publishes.
export type Opening = { mode: 'open' | 'self'; hold: boolean; date: string; time: string }
export const INITIAL_OPENING: Opening = { mode: 'open', hold: true, date: '2027-01-19', time: '08:00' }
// The publish day and time as text, like "Tue, Jan 19 at 8:00 AM".
export function openingLabel(o: Opening): string {
  const [y, m, d] = o.date.split('-').map(Number)
  const [h, min] = o.time.split(':').map(Number)
  const day = new Date(y, m - 1, d, h, min)
  if (Number.isNaN(day.getTime())) return 'the chosen date'
  return `${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${day.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

export function buildTodo(args: {
  rows: ReviewRow[]
  choices: Record<string, Choice>
  ready: ReadyRule[]
  dates: FixDatesState
  comments: EducatorComment[]
  opening: Opening
}): TodoItem[] {
  const { rows, choices, ready, dates, comments, opening } = args
  const todo: TodoItem[] = []

  // The to-do list follows the readiness check: every check that is not ready or fixed in the copy is on the list.
  // "Later" checks are the problems still in the course after the copy (kept, fix later, or not decided yet).
  for (const x of ready.filter((r) => r.status === 'later')) {
    todo.push({ group: 'Fix after the copy', title: x.rule.title.replace(/\.$/, ''), detail: x.note })
  }
  for (const r of rows) {
    const c = choiceOf(r, choices)
    // Items chosen to fix later that no design check covers, like a note from the team.
    if (c === 'fix' && r.findings.length === 0) {
      todo.push({ group: 'Fix after the copy', title: `${r.title} (${r.kindLabel})`, detail: r.note?.text ?? 'Chosen to fix after the copy.' })
    }
    // An AI fix that was chosen with a review later.
    if (c === 'aicheck' && r.aiFix) todo.push({ group: 'Read the AI fixes', title: r.title, detail: `${r.aiFix.what}. Check that it still fits.` })
  }

  for (const x of ready.filter((r) => r.status === 'manual')) {
    todo.push({ group: 'Do it yourself', title: x.rule.title.replace(/\.$/, ''), detail: x.note })
  }

  // Comments about parts of the course the review does not list, like the gradebook.
  for (const c of comments.filter((c) => c.area === 'Gradebook')) {
    todo.push({ group: 'Do it yourself', title: c.item, detail: c.text })
  }

  if (dates.mode === 'clear') {
    todo.push({ group: 'Set the dates', title: 'Set the dates of all items', detail: `${DATE_ITEMS.length} items are copied with no date. They are listed on the course Settings page.` })
  } else {
    for (const item of DATE_ITEMS) {
      const info = rowInfo(item, dates)
      if (info.finalClosed) todo.push({ group: 'Set the dates', title: item.title, detail: `Still on ${fmtShort(info.final ?? info.base)}, a non-teaching day. Choose a new date.` })
    }
    // Items with no due date that were left empty are for the teacher to date later.
    for (const item of NO_DATE_ITEMS) {
      if ((dates.noDate[item.id] ?? 'empty') === 'empty') todo.push({ group: 'Set the dates', title: item.title, detail: 'It has no due date. Set one when you are ready.' })
    }
  }

  if (opening.mode === 'self') {
    todo.push({ group: 'Check after the copy', title: 'Publish the course', detail: 'You chose to publish it manually. The course stays unpublished until you do.' })
  }
  todo.push(
    { group: 'Check after the copy', title: 'Quiz settings, gradebook and publish state', detail: 'Copying does not publish anything. Check them before students arrive.' },
    { group: 'Check after the copy', title: 'Enrollments and groups', detail: 'Canvas never copies people. Add them to the new course.' },
    { group: 'Check after the copy', title: 'Feature options', detail: 'Turn them on again in Settings.' },
  )
  return todo
}

// Download the to-do list as a file the teacher keeps.
export function exportTodo(todo: TodoItem[], course: string) {
  const rows = [['Group', 'To do', 'Details'], ...todo.map((t) => [t.group, t.title, t.detail])]
  const csv = rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `to-do-after-copying-${course.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Send the to-do list to the teacher's own email. It opens their mail app with the list filled in.
export function emailTodo(todo: TodoItem[], course: string) {
  const body = todo.map((t) => `- ${t.title}: ${t.detail}`).join('\n')
  window.location.href = `mailto:?subject=${encodeURIComponent(`To do after copying ${course}`)}&body=${encodeURIComponent(body)}`
}

// Download the to-do list as calendar entries (.ics), one all-day entry for each item, starting tomorrow.
export function calendarTodo(todo: TodoItem[], course: string) {
  const day = new Date()
  day.setDate(day.getDate() + 1)
  const stamp = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const esc = (x: string) => x.replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
  const events = todo.map((t, i) => ['BEGIN:VEVENT', `UID:todo-${i}@course-rollover`, `DTSTAMP:${stamp(new Date())}T000000Z`, `DTSTART;VALUE=DATE:${stamp(day)}`, `SUMMARY:${esc(t.title)}`, `DESCRIPTION:${esc(t.detail)}`, 'END:VEVENT'].join('\r\n'))
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Course Rollover//EN', ...events, 'END:VCALENDAR'].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `to-do-${course.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

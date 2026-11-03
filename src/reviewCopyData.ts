import { DESIGN_RULES, DIMENSIONS } from './designCheckData'
import type { DesignRule, Dimension } from './designCheckData'
import { EXTRA_RULES, choiceOf } from './reviewData'
import type { Choice, ReviewRow } from './reviewData'
import { DATE_ITEMS, rowInfo, fmtShort } from './fixDatesData'
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
  manual: 'Do it yourself',
}

const ALL_RULES = [...DESIGN_RULES, ...EXTRA_RULES]
const FIXED: Choice[] = ['aifix', 'leave']

// How each rule stands with the choices made so far. The rules are the sheet's, plus the accessibility checks.
export function readiness(rows: ReviewRow[], choices: Record<string, Choice>): ReadyRule[] {
  const out: ReadyRule[] = []
  for (const rule of ALL_RULES) {
    if (rule.severity === 'pass') {
      out.push({ rule, status: 'pass', note: 'Nothing to change.' })
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
        : { rule, status: 'later', note: `${open.map((r) => r.title).join(', ')} still to fix after the copy.` },
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
export type Opening = { mode: 'open' | 'self'; hold: boolean }
export const INITIAL_OPENING: Opening = { mode: 'open', hold: false }
export const OPENING_TIME = 'Tue, Jan 19 at 8:00 AM'

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

  for (const r of rows) {
    const c = choiceOf(r, choices)
    const why = r.findings[0]?.detail ?? r.note?.text ?? 'Chosen to fix after the copy.'
    if (c === 'fix') todo.push({ group: 'Fix after the copy', title: `${r.title} (${r.kindLabel})`, detail: why })
    if (c === 'aifix' && r.aiFix) todo.push({ group: 'Read the AI fixes', title: r.title, detail: `${r.aiFix.what}. Read it and check it still fits.` })
    // A whole-course issue kept as it is stays a problem, and only the teacher can change it later.
    if (r.courseWide && c === 'bring') todo.push({ group: 'Do it yourself', title: r.title, detail: `You kept this as it is. ${r.findings[0]?.detail ?? ''}`.trim() })
  }

  for (const x of ready.filter((r) => r.status === 'manual')) {
    todo.push({ group: 'Do it yourself', title: x.rule.title.replace(/\.$/, ''), detail: x.note })
  }

  // Comments about parts of the course the review does not list, like the gradebook.
  for (const c of comments.filter((c) => c.area === 'Gradebook')) {
    todo.push({ group: 'Do it yourself', title: c.item, detail: c.text })
  }

  if (dates.mode === 'clear') {
    todo.push({ group: 'Set the dates', title: 'Set the dates of all items', detail: `${DATE_ITEMS.length} items come over with no date. They are listed on the course Settings page.` })
  } else {
    for (const item of DATE_ITEMS) {
      const info = rowInfo(item, dates)
      if (info.finalClosed) todo.push({ group: 'Set the dates', title: item.title, detail: `Still on ${fmtShort(info.final ?? info.base)}, a non-teaching day. Choose a new date.` })
    }
  }

  if (opening.mode === 'self') {
    todo.push({ group: 'Check after the copy', title: 'Open the course for students', detail: 'You chose to open it yourself. The course stays unpublished until you publish it.' })
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

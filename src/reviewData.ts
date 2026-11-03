import { CONTENT_TYPES, CURRENT_MODULES, MODULE_ENTRIES } from './courseContentData'
import type { TypeId } from './courseContentData'
import { DESIGN_RULES } from './designCheckData'
import type { DesignRule } from './designCheckData'
import { withPulledIn } from './contentHelpers'
import type { Picked, Scope } from './contentHelpers'
import type { EducatorComment } from './rolloverData'

// Sample data for the "Learning object review" step. Everything here is made up.
// Each learning object that comes over is checked against the course design rules (the same rules as the
// "Course Design Rule definitions" sheet) and against the comments the teaching team left. Where something is
// found, the row gets a suggestion with the reason from the sheet, plus an AI suggestion to bring it or not.

export type Choice = 'bring' | 'fix' | 'aifix' | 'leave'

export const CHOICE_LABEL: Record<Choice, string> = {
  bring: 'Bring it',
  fix: 'Bring, fix later',
  aifix: 'Use AI fix',
  leave: 'Leave it out',
}
export const CHOICES: Choice[] = ['bring', 'fix', 'aifix', 'leave']

// What each choice is called on a row, when the usual wording does not fit.
export type ChoiceLabels = Partial<Record<Choice, string>>

export type Finding = { rule: DesignRule; detail: string }

export type ReviewRow = {
  id: string
  title: string
  kindLabel: string
  typeId: TypeId | 'course'
  group: string
  // Issues that touch the whole course, not one learning object. They are always listed.
  courseWide?: boolean
  // Choices that make sense for this row, and their wording. The usual four when not set.
  options?: Choice[]
  labels?: ChoiceLabels
  findings: Finding[]
  note?: EducatorComment
  // What the AI suggests, with a reason. Rows without a suggestion have neither.
  ai?: { choice: Choice; reason: string }
  // A quick fix the AI can apply while copying: what it changes, and the text it would use.
  aiFix?: { what: string; after: string }
  // Rows with no suggestion are done from the start and bring the item.
  hasSuggestion: boolean
}

const KIND_LABEL: Record<TypeId, string> = {
  settings: 'Settings',
  syllabus: 'Syllabus',
  modules: 'Module',
  assignments: 'Assignment',
  quizzes: 'Quiz',
  banks: 'Question bank',
  discussions: 'Discussion',
  pages: 'Page',
  announcements: 'Announcement',
  rubrics: 'Rubric',
  files: 'File',
  events: 'Calendar event',
}

// Where the design check found something, by item id. The detail is why this item was flagged.
const HITS: Record<string, { rule: string; detail: string }[]> = {
  'assignments:5': [{ rule: 'deliverables', detail: "No clear deliverable is specified. The text 'Show us what you built' does not say what students need to submit." }],
  'assignments:4': [
    { rule: 'deliverables', detail: 'The description names no format, length or number of reviews, so students cannot tell what a finished peer review looks like.' },
    { rule: 'due-dates', detail: 'This assignment has no due date.' },
  ],
  'assignments:2': [{ rule: 'deliverables-2', detail: 'The description gives a length but not a file format or a submission type.' }],
  'discussions:1': [{ rule: 'due-dates', detail: 'This discussion has no due date.' }],
  'pages:1': [{ rule: 'summary', detail: 'The page has an introduction and office hours, but no policies on late work or academic integrity.' }],
  'pages:4': [{ rule: 'links', detail: 'A link to the case study video points to the previous course and will not open for students in the new term.' }],
  'announcements:1': [{ rule: 'communication', detail: 'This is one of two announcements, both from the start of the term.' }],
  'files:7': [{ rule: 'captions', detail: 'This 4 minute video has no captions or transcript.' }],
  syllabus: [
    { rule: 'feedback-timeline', detail: 'The syllabus does not say when students can expect feedback on their work.' },
    { rule: 'syllabus-objectives', detail: 'No course-level learning objectives are stated. They appear only on the welcome page.' },
  ],
}

// Quick fixes the AI offers, by item id. The text is made up.
const FIXES: Record<string, { what: string; after: string }> = {
  'assignments:5': { what: 'Adds a clear deliverable to the description', after: 'Upload one PDF with your four portfolio projects. Add a note of 100 words or less for each project.' },
  'assignments:4': { what: 'A shorter description with the format and length', after: 'Review two classmates’ outlines. Write 150 words for each and post them as replies by Friday.' },
  'assignments:2': { what: 'Adds the file format to the description', after: 'Upload a one-page PDF with your audience, your main goal and the tools you expect to use.' },
  'discussions:1': { what: 'A clearer, shorter prompt', after: 'Share your name, your goal for this course and one design you admire. Reply to two classmates.' },
  'pages:1': { what: 'Adds a short policy section', after: 'Late work loses 10% a day. Cite your sources and hand in your own work.' },
  'pages:4': { what: 'Swaps the old video link for the current one', after: 'Case study video (this term)' },
  'announcements:1': { what: 'A shorter version of the announcement', after: 'Welcome! The first module is open. Start with the welcome page.' },
  'files:7': { what: 'Generates English captions for the video', after: 'Captions for all 4 minutes, ready to read through after the copy.' },
  syllabus: { what: 'Adds the feedback timeline and course objectives', after: 'You get feedback on every assignment within 7 days. By the end of the course you can present a project to a client.' },
}

// Checks that affect accessibility and outcomes. They are not in the sheet: the prototype adds them next to its rules.
export const EXTRA_RULES: DesignRule[] = [
  {
    id: 'captions',
    dimension: 'Course Technology',
    severity: 'critical',
    title: 'Videos should have captions.',
    why: 'Captions let students who are deaf, hard of hearing or in a noisy room follow the video.',
  },
  {
    id: 'alt-text',
    dimension: 'Course Technology',
    severity: 'critical',
    title: 'Images should have alt text.',
    why: 'Alt text lets students who use a screen reader know what an image shows.',
  },
  {
    id: 'contrast',
    dimension: 'Course Technology',
    severity: 'warning',
    title: 'Text should be easy to read on its background.',
    why: 'Enough contrast between text and background helps every student read the page, especially in bright light.',
  },
  {
    id: 'rubric-outcomes',
    dimension: 'Assessment and Feedback',
    severity: 'warning',
    title: 'Rubrics should be linked to learning outcomes.',
    why: 'Linked outcomes let you and your students see progress toward the course objectives.',
  },
]

const rule = (id: string) => [...DESIGN_RULES, ...EXTRA_RULES].find((r) => r.id === id)!

const sameItem = (comment: string, title: string) => comment === title || comment.endsWith(` ${title}`)

function aiFor(findings: Finding[], note?: EducatorComment): ReviewRow['ai'] {
  if (note?.decision === 'leave-out') {
    return { choice: 'leave', reason: 'Your team says it was not used or is replaced, so there is little reason to bring it.' }
  }
  if (findings.some((f) => f.rule.severity === 'critical')) {
    return { choice: 'fix', reason: 'Students will run into this early in the term. It is quicker to bring it and fix the detail than to write it again.' }
  }
  if (note?.decision === 'fix-later' || findings.length > 0) {
    return { choice: 'fix', reason: 'The issue is small and easy to fix after the copy, so bringing it saves you the setup.' }
  }
  if (note?.decision === 'copy') {
    return { choice: 'bring', reason: 'Your team says it worked well last term.' }
  }
  return undefined
}

// The rows that come over, in the order of the course. Items in a module sit under that module.
export function buildRows(scope: Scope, picked: Picked, comments: EducatorComment[]): ReviewRow[] {
  const eff = withPulledIn(picked)
  const moduleOf: Record<string, string> = {}
  const modules = CONTENT_TYPES.find((c) => c.id === 'modules')!.items
  for (const m of modules) for (const e of MODULE_ENTRIES[m.id] ?? []) moduleOf[e.itemId] ??= m.label

  const rows: ReviewRow[] = []
  for (const type of CONTENT_TYPES) {
    if (type.id === 'modules') continue
    const items = type.items.length ? type.items : [{ id: type.id, label: type.label }]
    for (const item of items) {
      if (scope === 'part' && !eff[item.id]) continue
      const findings = (HITS[item.id] ?? []).map((h) => ({ rule: rule(h.rule), detail: h.detail }))
      const note = comments.find((c) => sameItem(c.item, item.label))
      const ai = aiFor(findings, note)
      rows.push({
        id: item.id,
        title: item.label,
        kindLabel: KIND_LABEL[type.id],
        typeId: type.id,
        group: moduleOf[item.id] ?? (type.id === 'settings' || type.id === 'syllabus' ? 'Course' : type.label),
        findings,
        note,
        ai,
        aiFix: ai ? FIXES[item.id] : undefined,
        hasSuggestion: !!ai,
      })
    }
  }
  rows.push(...COURSE_ROWS.map((c) => courseRow(c)))
  // Group order: the whole course first, then modules in course order, then the rest in the order they were found.
  const order = ['Whole course', ...modules.map((m) => m.label), 'Course']
  const rank = (g: string) => (order.includes(g) ? order.indexOf(g) : order.length)
  return rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => rank(a.r.group) - rank(b.r.group) || a.i - b.i)
    .map((x) => x.r)
}

// Issues that affect the whole course. Each one is a row with a fix, like a learning object.
const COURSE_ROWS: { id: string; title: string; rule: string; detail: string; fix: { what: string; after: string }; reason: string }[] = [
  {
    id: 'course:menu',
    title: 'Course menu',
    rule: 'navigation',
    detail: 'The course menu shows 19 items. Students use about nine of them.',
    fix: { what: 'Hides the five items students do not use', after: 'Rubrics, Grade Sync, Course Analytics, Lucid (Whiteboard) and BigBlueButton are hidden from students.' },
    reason: 'A short menu helps students find the course areas quickly, and you can show the items again at any time.',
  },
  {
    id: 'course:alt',
    title: 'Images without alt text',
    rule: 'alt-text',
    detail: '14 images on 6 pages have no alt text.',
    fix: { what: 'Writes alt text for 14 images', after: 'Each image gets a short description of what it shows, ready to read through after the copy.' },
    reason: 'Screen reader users cannot use these images now, and the written descriptions are quick to check.',
  },
  {
    id: 'course:links',
    title: 'Broken links',
    rule: 'links',
    detail: '2 links point to the previous course or return a not found error.',
    fix: { what: 'Swaps both links for this term’s versions', after: 'Case study video (this term) and Design Studio guest talk (2026 recording).' },
    reason: 'Students would hit a dead end in week 1, so fix them before the copy.',
  },
  {
    id: 'course:outcomes',
    title: 'Rubrics and outcomes',
    rule: 'rubric-outcomes',
    detail: '2 rubrics have no learning outcomes linked, so they cannot show progress.',
    fix: { what: 'Links each rubric row to a course outcome', after: 'Reflection rubric to Outcome 2, Presentation rubric to Outcome 3.' },
    reason: 'The matches follow the wording of each rubric row. Check them once after the copy.',
  },
  {
    id: 'course:contrast',
    title: 'Text that is hard to read',
    rule: 'contrast',
    detail: '8 pages use text colors that are hard to read on the page background.',
    fix: { what: 'Replaces the text colors on 8 pages', after: 'Dark text on light backgrounds, with the same headings and layout.' },
    reason: 'It is a small change that makes every page easier to read.',
  },
  {
    id: 'course:naming',
    title: 'Module names',
    rule: 'naming',
    detail: '2 of 7 modules do not follow the Week number: topic pattern.',
    fix: { what: 'Renames 2 modules to follow the pattern', after: 'Resources becomes Week 6: Resources. Optional readings (archive) becomes Week 7: Optional readings.' },
    reason: 'Consistent names help students tell the modules apart.',
  },
]

function courseRow(c: (typeof COURSE_ROWS)[number]): ReviewRow {
  return {
    id: c.id,
    title: c.title,
    kindLabel: 'Whole course',
    typeId: 'course',
    group: 'Whole course',
    courseWide: true,
    options: ['bring', 'fix', 'aifix'],
    labels: { bring: 'Keep it as it is', fix: 'Fix it after the copy' },
    findings: [{ rule: rule(c.rule), detail: c.detail }],
    ai: { choice: 'aifix', reason: c.reason },
    aiFix: c.fix,
    hasSuggestion: true,
  }
}

export const choiceLabel = (row: ReviewRow, c: Choice) => row.labels?.[c] ?? CHOICE_LABEL[c]

export const choiceOf = (row: ReviewRow, choices: Record<string, Choice>): Choice | undefined =>
  choices[row.id] ?? (row.hasSuggestion ? undefined : 'bring')

// ---- Modules that exist in both courses --------------------------------------------------------------
// Merging brings modules next to the ones already in the course. These pairs look like the same module twice.
export type DupeChoice = 'both' | 'current' | 'new'
export type DupePair = { id: string; current: string; incoming: string; why: string }

export const DUPE_LABEL: Record<DupeChoice, string> = {
  both: 'Keep both',
  current: 'Keep the current one',
  new: 'Keep the new one',
}

export const DUPES: DupePair[] = [
  {
    id: 'week2',
    current: 'current:2',
    incoming: 'modules:3',
    why: 'Both courses have a module named “Week 2: Project proposal”.',
  },
  {
    id: 'welcome',
    current: 'current:1',
    incoming: 'modules:1',
    why: '“Getting started” and “Welcome to the course” both open the course with a welcome page and tools.',
  },
]

// The modules to leave out of the preview, from the choices made on the pairs.
export function hiddenModules(dupes: Record<string, DupeChoice>): Set<string> {
  const hide = new Set<string>()
  for (const d of DUPES) {
    if (dupes[d.id] === 'current') hide.add(d.incoming)
    if (dupes[d.id] === 'new') hide.add(d.current)
  }
  return hide
}

export const CURRENT_LABEL = (id: string) => CURRENT_MODULES.find((m) => m.id === id)?.label ?? ''

// What the pill says for each rule of the sheet: the problem in a few words, not how serious it is.
export const RULE_LABEL: Record<string, string> = {
  deliverables: 'Missing deliverable',
  'deliverables-2': 'Unclear format',
  'module-assessment': 'No activity in module',
  'module-content': 'Module has no materials',
  navigation: 'Crowded menu',
  'feedback-timeline': 'No feedback timeline',
  'syllabus-objectives': 'No objectives',
  'due-dates': 'No due date',
  interaction: 'No peer interaction',
  summary: 'Missing policies',
  links: 'Broken link',
  communication: 'Too few updates',
  naming: 'Inconsistent name',
  captions: 'Missing captions',
  'alt-text': 'Missing alt text',
  contrast: 'Hard to read',
  'rubric-outcomes': 'No linked outcomes',
}

// The same for what the teaching team wrote, by comment id.
export const NOTE_LABEL: Record<string, string> = {
  c1: 'Outdated rubric',
  c2: 'Wrong answer key',
  c3: 'Outdated mention',
  c4: 'Never opened last term',
  c5: 'Replaced by a newer file',
  c6: 'Worked well last term',
}

import type { CopySummary, HistoryEvent } from './rolloverData'

// Earlier imports of the course, for the Content imports table. Everything here is made up.
// `published`: the course was already open to students after the copy, and Canvas cannot undo a copy then.

export type ImportRow = {
  id: string
  type: string
  source: string
  date: string
  status: 'Completed' | 'Failed' | 'Undone'
  published: boolean
  summary?: CopySummary
}

const history = (who: string[], when: string): HistoryEvent[] => [
  { when, tag: 'Session', text: 'Copy finished. The course opened to students afterwards.', who: 'Canvas, Automatic' },
  { when, tag: 'Created', text: 'Course welcome (Page) created in Welcome to the course', who: 'Canvas, Automatic', link: 'Open' },
  { when, tag: 'Created', text: 'Quiz 1 (Quiz) created in Week 1: Reading and responses', who: 'Canvas, Automatic', link: 'Open' },
  { when, tag: 'Decision', text: 'Peer review: Leave it out', who: who[0] },
  { when, tag: 'Decision', text: 'Syllabus: Use AI fix', who: who[1] },
  { when, tag: 'Session', text: 'Copy started', who: who[1] },
]

function summaryOf(course: string, when: string, created: number, published: boolean): CopySummary {
  return {
    course,
    target: 'Rollover',
    when,
    opens: published ? `It opened to students on ${when}.` : 'It opens on Tue, Jan 19 at 8:00 AM.',
    stats: { created, relinked: 2, sentToAdmin: 0, datesPlaced: 9 },
    came: [],
    failed: [],
    notCame: [
      { item: 'Old syllabus 2024', reason: 'unused last term', kind: 'left-out' },
      { item: 'Student submissions and grades', reason: 'Canvas never copies these.', kind: 'canvas' },
    ],
    todo: [
      { group: 'Check after the copy', title: 'Enrollments and groups', detail: 'Canvas never copies people. Add them to the new course.' },
      { group: 'Check after the copy', title: 'Feature options', detail: 'Turn them on again in Settings.' },
    ],
    history: history(['A. Rivera', 'M. Chen'], when),
    datesShifted: 9,
    datesEdited: 0,
  }
}

export const PREVIOUS_IMPORTS: ImportRow[] = [
  // The newest earlier copy: the course has not opened to students yet, so it can still be undone.
  { id: 'i1', type: 'Course Copy', source: 'Portfolio Test', date: 'Sep 30 at 4:58am', status: 'Completed', published: false, summary: summaryOf('Portfolio Test', 'Sep 30 at 4:58am', 33, false) },
  { id: 'i2', type: 'Canvas Course Export Package', source: 'biology-101-export.imscc', date: 'Sep 12 at 9:14am', status: 'Completed', published: true },
  { id: 'i3', type: 'Course Copy', source: 'Intro to Design', date: 'Aug 14 at 2:31pm', status: 'Completed', published: true, summary: summaryOf('Intro to Design', 'Aug 14 at 2:31pm', 28, true) },
  { id: 'i4', type: 'Zip file', source: 'week-3-materials.zip', date: 'Aug 2 at 11:06am', status: 'Completed', published: true },
  { id: 'i5', type: 'QTI .zip file', source: 'quiz-bank-2025.zip', date: 'Jul 21 at 10:40am', status: 'Failed', published: false },
]

export const newImport = (summary: CopySummary): ImportRow => ({
  id: `new-${summary.when}-${summary.course}`,
  type: 'Course Copy',
  source: summary.course,
  date: 'Just now',
  status: 'Completed',
  // A copy made just now has not opened to students yet, so it can still be undone.
  published: false,
  summary,
})

export const UNDO_BLOCKED = 'The course is published, so this copy cannot be undone.'

// Sample courses the educator can copy from in the wizard's first step. Everything here is made up.

export type TimeKind = 'Last used' | 'Concluded' | 'Last updated'

export type SourceCourse = {
  name: string
  code: string
  // "You" for the signed-in educator, otherwise the names of the other teachers.
  teachers: string[]
  students: number
  timeKind: TimeKind
  date: string
}

export const TIME_KINDS: TimeKind[] = ['Last used', 'Concluded', 'Last updated']

export const SOURCE_COURSES: SourceCourse[] = [
  { name: 'Portfolio Test', code: 'PT', teachers: ['You'], students: 28, timeKind: 'Last used', date: 'Oct 6, 2025' },
  { name: 'Biology 101', code: 'BIO 101', teachers: ['Maria Okafor'], students: 112, timeKind: 'Concluded', date: 'Dec 19, 2025' },
  { name: 'Intro to Design', code: 'DES 110', teachers: ['You', 'Dana Reyes'], students: 36, timeKind: 'Last updated', date: 'Nov 2, 2025' },
  { name: 'World History', code: 'HIS 120', teachers: ['Tomas Lindgren'], students: 64, timeKind: 'Concluded', date: 'May 15, 2025' },
  { name: 'Statistics for Designers', code: 'STA 210', teachers: ['You'], students: 19, timeKind: 'Concluded', date: 'May 16, 2025' },
  { name: 'Typography Studio', code: 'DES 220', teachers: ['Dana Reyes', 'Sam Tran'], students: 24, timeKind: 'Last used', date: 'Sep 28, 2025' },
  { name: 'Research Methods', code: 'RES 301', teachers: ['Priya Nair'], students: 47, timeKind: 'Last updated', date: 'Aug 30, 2025' },
  { name: 'Creative Writing Workshop', code: 'ENG 240', teachers: ['You'], students: 15, timeKind: 'Last used', date: 'Oct 20, 2025' },
  { name: 'Organic Chemistry I', code: 'CHE 201', teachers: ['Maria Okafor', 'Ben Hartley'], students: 138, timeKind: 'Concluded', date: 'Dec 12, 2024' },
  { name: 'Introduction to Python', code: 'CS 101', teachers: ['You'], students: 92, timeKind: 'Last used', date: 'Oct 14, 2025' },
  { name: 'Art History Survey', code: 'ART 150', teachers: ['Priya Nair'], students: 53, timeKind: 'Last updated', date: 'Jul 8, 2025' },
  { name: 'Microeconomics', code: 'ECO 210', teachers: ['Tomas Lindgren'], students: 71, timeKind: 'Concluded', date: 'May 14, 2025' },
  { name: 'User Research Lab', code: 'DES 330', teachers: ['You', 'Sam Tran'], students: 21, timeKind: 'Last used', date: 'Oct 3, 2025' },
  { name: 'Environmental Science', code: 'ENV 105', teachers: ['Ben Hartley'], students: 84, timeKind: 'Last updated', date: 'Sep 2, 2025' },
]

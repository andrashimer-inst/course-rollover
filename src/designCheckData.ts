// Sample data for the Course design check step of the copy wizard. Everything here is made up.
// The rules come from the "Course Design Rule definitions" sheet (six dimensions: Course Overview and
// Navigation, Learning Objectives and Alignment, Assessment and Feedback, Instructional Materials,
// Learning Activities and Interaction, Course Technology). Each rule below is one criterion of that sheet.
// The sheet names three kinds of criteria (structural, pedagogical, experiential). The prototype
// shows the structural ones and a few pedagogical ones, in the wording students would read.

export type Dimension =
  | 'Course Overview and Navigation'
  | 'Learning Objectives and Alignment'
  | 'Assessment and Feedback'
  | 'Instructional Materials'
  | 'Learning Activities and Interaction'
  | 'Course Technology'

export const DIMENSIONS: Dimension[] = [
  'Course Overview and Navigation',
  'Learning Objectives and Alignment',
  'Assessment and Feedback',
  'Instructional Materials',
  'Learning Activities and Interaction',
  'Course Technology',
]

// critical: red, should be fixed. warning: orange, worth a look. pass: green.
export type Severity = 'critical' | 'warning' | 'pass'
export type ResourceKind = 'assignment' | 'module' | 'page' | 'link' | 'syllabus'

export type DesignResource = {
  id: string
  kind: ResourceKind
  title: string
  // Why this item was flagged. Passed items have no reason.
  reason?: string
}

export type DesignRule = {
  id: string
  dimension: Dimension
  severity: Severity
  title: string
  // Why it matters to students, shown as help text (from the sheet's student context column).
  why: string
  // Resource rules list the items they found. Course-level rules have a reason and references instead.
  resources?: DesignResource[]
  reason?: string
  references?: string[]
}

export const DESIGN_RULES: DesignRule[] = [
  {
    id: 'deliverables',
    dimension: 'Learning Objectives and Alignment',
    severity: 'critical',
    title: 'Assignment should specify deliverables.',
    why: 'Well-defined assignment descriptions make it easier for students to understand what they are expected to submit.',
    resources: [
      {
        id: 'r1',
        kind: 'assignment',
        title: 'Final project',
        reason:
          "No clear deliverable is specified. The text 'Show us what you built' is vague and does not say what students need to submit or demonstrate.",
      },
      {
        id: 'r2',
        kind: 'assignment',
        title: 'Peer review',
        reason:
          'The description names no format, length or number of reviews, so students cannot tell what a finished peer review looks like.',
      },
      {
        id: 'r3',
        kind: 'assignment',
        title: 'Welcome discussion',
        reason:
          "The prompt says 'introduce yourself' but gives no instructions about what to share or how many replies are expected.",
      },
    ],
  },
  {
    id: 'module-assessment',
    dimension: 'Learning Activities and Interaction',
    severity: 'critical',
    title: 'Module should have at least one assignment or quiz.',
    why: 'Regular activities give students clear opportunities to engage with the material and show what they learned.',
    resources: [
      {
        id: 'r4',
        kind: 'module',
        title: 'Optional readings (archive)',
        reason: 'The module holds only files and links. It has no assignment, quiz or discussion.',
      },
      {
        id: 'r5',
        kind: 'module',
        title: 'Week 5: Reviews',
        reason: 'The module has no graded or ungraded activity for students.',
      },
    ],
  },
  {
    id: 'module-content',
    dimension: 'Instructional Materials',
    severity: 'critical',
    title: 'Modules should have instructional content.',
    why: 'Instructional materials grouped inside each module help students know where to find what they need.',
    resources: [
      {
        id: 'r6',
        kind: 'module',
        title: 'Resources',
        reason: 'The module has no readings, videos, slides or other instructional content.',
      },
      {
        id: 'r7',
        kind: 'module',
        title: 'Week 4: Portfolio outline',
        reason: 'The module has only an assignment. Add the reading or video that prepares students for it.',
      },
    ],
  },
  {
    id: 'navigation',
    dimension: 'Course Overview and Navigation',
    severity: 'critical',
    title: 'Navigation menu should have ten or fewer items with unused features hidden.',
    why: 'A short navigation menu helps students find the key areas of the course quickly.',
    reason: 'The course menu shows 19 items. Hide the ones students do not use.',
    references: ['Rubrics', 'Grade Sync', 'Course Analytics', 'Lucid (Whiteboard)', 'BigBlueButton'],
  },
  {
    id: 'feedback-timeline',
    dimension: 'Assessment and Feedback',
    severity: 'critical',
    title: 'Syllabus should define feedback timeline.',
    why: 'Knowing when to expect feedback helps students plan their next steps.',
    resources: [
      {
        id: 'r8',
        kind: 'syllabus',
        title: 'Syllabus',
        reason: 'The syllabus does not say when students can expect feedback on their work.',
      },
    ],
  },
  {
    id: 'syllabus-objectives',
    dimension: 'Learning Objectives and Alignment',
    severity: 'critical',
    title: 'Syllabus should have course-level learning objectives.',
    why: 'Stated objectives help students understand what the course is designed to help them do.',
    resources: [
      {
        id: 'r9',
        kind: 'syllabus',
        title: 'Syllabus',
        reason: 'No course-level learning objectives are stated in the syllabus. They appear only on the welcome page.',
      },
    ],
  },
  {
    id: 'deliverables-2',
    dimension: 'Learning Objectives and Alignment',
    severity: 'warning',
    title: 'Assignment descriptions should include clear parameters.',
    why: 'Clear parameters such as format and length help students judge the scope of the work.',
    resources: [
      {
        id: 'r10',
        kind: 'assignment',
        title: 'PT Project proposal',
        reason: 'The description gives a length but not a file format or a submission type.',
      },
    ],
  },
  {
    id: 'due-dates',
    dimension: 'Assessment and Feedback',
    severity: 'warning',
    title: 'Assignments should have due dates configured.',
    why: 'Visible due dates help students plan their time and keep track of work.',
    reason: '3 of 9 assignments do not have due dates configured.',
    references: ['Welcome discussion', 'Peer review', 'Course evaluation'],
  },
  {
    id: 'interaction',
    dimension: 'Learning Activities and Interaction',
    severity: 'warning',
    title: 'Course should include student-to-student interaction.',
    why: 'Talking with peers lets students exchange ideas and learn from one another.',
    reason: 'Only one discussion in the course invites students to respond to each other.',
    references: ['Welcome discussion', 'Week 3 discussion'],
  },
  {
    id: 'summary',
    dimension: 'Course Overview and Navigation',
    severity: 'warning',
    title: 'Course summary should have introduction, expectations and policies.',
    why: 'A clear starting point reduces confusion and helps students feel confident as they begin.',
    resources: [
      {
        id: 'r11',
        kind: 'page',
        title: 'Course welcome',
        reason: 'The page has an introduction and office hours, but no policies on late work or academic integrity.',
      },
    ],
  },
  {
    id: 'links',
    dimension: 'Course Technology',
    severity: 'warning',
    title: 'External links and media should be functional.',
    why: 'Working links and media let students reach course materials without interruption.',
    resources: [
      {
        id: 'r12',
        kind: 'link',
        title: 'Case study video (old course)',
        reason: 'The link points to the previous course and will not open for students in the new term.',
      },
      {
        id: 'r13',
        kind: 'link',
        title: 'Design Studio guest talk recording',
        reason: 'The media link returns a not found error.',
      },
    ],
  },
  {
    id: 'communication',
    dimension: 'Learning Activities and Interaction',
    severity: 'warning',
    title: 'Instructor communication should be regular.',
    why: 'Regular messages keep students informed about expectations and what comes next.',
    reason: 'The course has two announcements, both from the start of the term.',
    references: ['Welcome to the course', 'Midterm reminder'],
  },
  {
    id: 'naming',
    dimension: 'Course Overview and Navigation',
    severity: 'warning',
    title: 'Module naming should be consistent.',
    why: 'Consistent module names help students recognize what each module contains.',
    reason: '2 of 7 modules do not follow the Week number: topic pattern.',
    references: ['Optional readings (archive)', 'Resources'],
  },
  {
    id: 'pass-deliverables',
    dimension: 'Learning Objectives and Alignment',
    severity: 'pass',
    title: 'Assignment specifies deliverables.',
    why: 'Well-defined assignment descriptions make it easier for students to understand what they are expected to submit.',
    resources: [
      { id: 'p1', kind: 'assignment', title: 'PT Assignment 1: Reading response' },
      { id: 'p2', kind: 'assignment', title: 'PT Project proposal' },
      { id: 'p3', kind: 'assignment', title: 'PT Assignment 3: Reflection' },
      { id: 'p4', kind: 'assignment', title: 'PT Quiz 2' },
    ],
  },
  {
    id: 'pass-links',
    dimension: 'Course Technology',
    severity: 'pass',
    title: 'External links and media are functional.',
    why: 'Working links and media let students reach course materials without interruption.',
    resources: [
      { id: 'p5', kind: 'link', title: 'Reading list' },
      { id: 'p6', kind: 'link', title: 'Portfolio examples' },
      { id: 'p7', kind: 'link', title: 'Style guide' },
      { id: 'p8', kind: 'link', title: 'Feedback form' },
      { id: 'p9', kind: 'link', title: 'Library guide' },
    ],
  },
  {
    id: 'pass-module-assessment',
    dimension: 'Learning Activities and Interaction',
    severity: 'pass',
    title: 'Module has at least one assignment or quiz.',
    why: 'Regular activities give students clear opportunities to engage with the material.',
    resources: [
      { id: 'p10', kind: 'module', title: 'Week 1: Getting started' },
      { id: 'p11', kind: 'module', title: 'Week 2: Case studies' },
      { id: 'p12', kind: 'module', title: 'Week 3: Client presentations' },
    ],
  },
  {
    id: 'pass-module-content',
    dimension: 'Instructional Materials',
    severity: 'pass',
    title: 'Modules have instructional content.',
    why: 'Instructional materials grouped inside each module help students know where to find what they need.',
    resources: [
      { id: 'p13', kind: 'module', title: 'Week 1: Getting started' },
      { id: 'p14', kind: 'module', title: 'Week 2: Case studies' },
      { id: 'p15', kind: 'module', title: 'Week 3: Client presentations' },
    ],
  },
]

// What the check found in the course summary (the welcome page): course and module objectives.
export const SUMMARY_PAGE = 'Course welcome'

export const COURSE_OBJECTIVES: { objective: string; source: string }[] = [
  { objective: 'Describe how designers present their work to a client and a review panel.', source: SUMMARY_PAGE },
  { objective: 'Build a portfolio of four projects that share one consistent visual system.', source: SUMMARY_PAGE },
]

export const MODULE_OBJECTIVES: { module: string; objective?: string; source?: string }[] = [
  { module: 'Week 1: Getting started' },
  {
    module: 'Week 2: Case studies',
    objective: 'Analyze two case studies and explain what made each presentation persuasive.',
    source: 'Week 2 overview',
  },
  {
    module: 'Week 3: Client presentations',
    objective: 'Present a project to a client using a clear structure and plain language.',
    source: 'Week 3 overview',
  },
  { module: 'Week 4: Portfolio outline' },
  {
    module: 'Week 5: Reviews',
    objective: 'Give specific, kind feedback on a peer’s portfolio outline.',
    source: 'Week 5 overview',
  },
]

export const dimensionCount = (rules: DesignRule[], dimension: Dimension) =>
  rules.filter((r) => r.dimension === dimension).length

export const resourceCount = (rule: DesignRule) => rule.resources?.length ?? 0

// ---- State of the check, kept by the wizard so the summary can use it ----
export type DesignState = {
  analyzed: boolean
  enabled: Dimension[] // the rubrics that are switched on
  removed: string[] // ids of rules or resources the educator removed from the results
}

export const INITIAL_DESIGN: DesignState = { analyzed: false, enabled: DIMENSIONS, removed: [] }

// The rules to show: only enabled dimensions, with removed resources and removed rules taken out.
// A resource rule that has no resources left counts as dealt with.
export function visibleRules(state: DesignState): DesignRule[] {
  return DESIGN_RULES.filter((r) => state.enabled.includes(r.dimension) && !state.removed.includes(r.id))
    .map((r) => (r.resources ? { ...r, resources: r.resources.filter((x) => !state.removed.includes(x.id)) } : r))
    .filter((r) => !r.resources || r.resources.length > 0)
}

export const openRules = (state: DesignState) =>
  state.analyzed ? visibleRules(state).filter((r) => r.severity !== 'pass') : []


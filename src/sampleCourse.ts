import type { CourseNav } from './GlobalNav'

// Sample course menu (Home, Announcements, ...). Unpublished items get an eye icon, like in Canvas.
// Sample data only. A design passes its own `course` to DesktopWrapper.
export const SAMPLE_COURSE: CourseNav = {
  name: 'Rollover',
  items: [
    { label: 'Home', current: true }, { label: 'Announcements', unpublished: true },
    { label: 'Assignments' }, { label: 'Discussions' }, { label: 'Grades' }, { label: 'People' },
    { label: 'Pages', unpublished: true }, { label: 'Files', unpublished: true },
    { label: 'Syllabus' }, { label: 'Outcomes', unpublished: true },
    { label: 'Rubrics', unpublished: true }, { label: 'Quizzes', unpublished: true },
    { label: 'Modules', unpublished: true }, { label: 'BigBlueButton' }, { label: 'Collaborations' },
    { label: 'Grade Sync', unpublished: true }, { label: 'Course Analytics' },
    { label: 'Lucid (Whiteboard)' }, { label: 'Settings' },
  ],
}

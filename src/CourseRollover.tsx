import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  Flex,
  Heading,
  Link,
  SimpleSelect,
  Table,
  Text,
  View,
} from '@instructure/ui/v11_7'
import DesktopWrapper from './DesktopWrapper'
import FigmaAlert from './FigmaAlert'
import RolloverWizard from './RolloverWizard'
import type { WizardDraft } from './RolloverWizard'
import { SummaryView } from './CopySummaryView'
import StatusPill from './StatusPill'
import { useAppThemeKey } from './appTheme'
import type { CopySummary } from './rolloverData'
import { PREVIOUS_IMPORTS, newImport } from './sampleImports'
import type { ImportRow } from './sampleImports'
import { commentsForCopy } from './notebookData'
import type { Note } from './notebookData'

// Course Rollover: "Import Content" page, built on the template. Figma decides the design, the package
// decides what exists, new-theme (v2) components only, spacing from docs/spacing.md.
// Changes from the customer discovery (top 10 priorities):
//   starting a copy opens a review wizard first (comments, dates, links), then a summary of what came over
//   copying over an existing copy asks for confirmation first
// Sample data only.

// Course menu (sample). Unpublished items are marked like in Canvas. Import Content lives under Settings.
const COURSE_NAV = [
  { label: 'Home' }, { label: 'Announcements', unpublished: true }, { label: 'Assignments' },
  { label: 'Discussions' }, { label: 'Grades' }, { label: 'People' },
  { label: 'Pages', unpublished: true }, { label: 'Files', unpublished: true }, { label: 'Syllabus' },
  { label: 'Outcomes', unpublished: true }, { label: 'Rubrics', unpublished: true },
  { label: 'Quizzes', unpublished: true }, { label: 'Modules', unpublished: true },
  { label: 'BigBlueButton' }, { label: 'Collaborations' }, { label: 'Grade Sync', unpublished: true },
  { label: 'Course Analytics' }, { label: 'Lucid (Whiteboard)' }, { label: 'Settings', current: true },
]
const COURSE = { name: 'Rollover', items: COURSE_NAV }
const DESCRIPTION = 'Use the Import Content tool to migrate course materials from other sources into this course.'

const CONTENT_TYPES = ['Copy a Canvas course or learning objects', 'Canvas Course Export Package', 'Zip file', 'QTI .zip file']

// Tables sit directly on the page background, so every table part gets a transparent fill.
const noFill = { background: 'transparent' }

export default function CourseRollover({
  notes = [],
  onNavigate,
}: {
  // The educator's notebook notes. They show up in the wizard's Review comments step.
  notes?: Note[]
  // A global nav item was chosen (for example Notebook in the Account menu or tray).
  onNavigate?: (label: string) => void
}) {
  const [contentType, setContentType] = useState(CONTENT_TYPES[0])
  const adjustDates = true
  const [imports, setImports] = useState<ImportRow[]>(() => [...PREVIOUS_IMPORTS])
  const [wizardOpen, setWizardOpen] = useState(false)
  // A copy saved with "Save and continue later". It is picked up again on the step it was left on.
  const [draft, setDraft] = useState<WizardDraft | null>(null)
  const [resume, setResume] = useState(false)
  // The import whose summary is open as a page. A copy is undone from its summary.
  const [viewing, setViewing] = useState<ImportRow | null>(null)
  const undo = (id: string) => setImports((list) => list.map((r) => (r.id === id ? { ...r, status: 'Undone' as const } : r)))

  const isCourseCopy = contentType === CONTENT_TYPES[0]

  const commentsFor = useCallback((c: string) => commentsForCopy(c, notes), [notes])
  const handleDone = useCallback((summary: CopySummary) => {
    const row = newImport(summary)
    setImports((list) => [row, ...list])
    // When the copy is done the wizard closes and the summary opens as a page.
    setWizardOpen(false)
    setViewing(row)
  }, [])

  // The review and copy steps are a page of their own (a new level in the breadcrumb), not a dialog.
  if (wizardOpen) {
    return (
      <RolloverWizard
        courseNav={COURSE}
        onNavigate={onNavigate}
        commentsFor={commentsFor}
        adjustDates={adjustDates}
        onCancel={() => {
          // Abandoning the session also drops a saved copy it was started from.
          setWizardOpen(false)
          setResume(false)
          setDraft(null)
        }}
        onDone={(summary) => {
          setDraft(null)
          setResume(false)
          handleDone(summary)
        }}
        draft={resume ? draft : null}
        onSaveLater={(d) => {
          setDraft(d)
          setResume(false)
          setWizardOpen(false)
        }}
      />
    )
  }

  // The summary of an earlier copy is a page of its own too, like the summary step of the wizard.
  if (viewing) {
    return (
      <DesktopWrapper
        pageTitle="Summary"
        breadcrumb={['Courses', COURSE.name, 'Import Content']}
        onBreadcrumb={(crumb) => crumb === 'Import Content' && setViewing(null)}
        activeNav="Courses"
        course={COURSE}
        onNavigate={onNavigate}
        description={`What came over from ${viewing.source} on ${viewing.summary?.when ?? viewing.date}.`}
        fullWidth
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {viewing.summary && (
            <SummaryView
              summary={viewing.summary}
              published={viewing.published}
              undone={viewing.status === 'Undone'}
              onUndo={() => undo(viewing.id)}
            />
          )}
          <div>
            <Button color="primary" onClick={() => setViewing(null)}>Done</Button>
          </div>
        </div>
      </DesktopWrapper>
    )
  }

  return (
    <DesktopWrapper
      pageTitle="Import Content"
      breadcrumb={['Courses', 'Rollover']}
      activeNav="Courses"
      // The wrapper draws the course menu: in the Courses sub navigation (Light and Dark) or as a
      // column beside the content (Legacy).
      course={COURSE}
      onNavigate={onNavigate}
      description={DESCRIPTION}
      fullWidth
    >
      <Flex alignItems="start" gap="gap.sections">
        <View as="div" maxWidth="47.5rem" display="block">
          <Flex direction="column" gap="gap.sections">
            <Flex direction="column" gap="gap.inputs.vertical">
              {/* Light and Dark show the description in the wrapper header. Legacy has no such line. */}
              <LegacyOnly>
                <Text as="p">{DESCRIPTION}</Text>
              </LegacyOnly>

              <SimpleSelect
                renderLabel="Select Content Type"
                value={contentType}
                onChange={(_e, { value }) => setContentType(String(value))}
              >
                {CONTENT_TYPES.map((t) => (
                  <SimpleSelect.Option key={t} id={t} value={t}>{t}</SimpleSelect.Option>
                ))}
              </SimpleSelect>

              {isCourseCopy && draft && (
                <FigmaAlert variant="info" type="inline">
                  You saved a copy {draft.course ? `from ${draft.course} ` : ''}on step {draft.step + 1} of 5. Nothing has been copied yet.
                </FigmaAlert>
              )}

              {isCourseCopy && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <Button color="primary" onClick={() => { setResume(draft !== null); setWizardOpen(true) }}>
                    {draft ? 'Continue copy' : 'Course copy wizard'}
                  </Button>
                  {draft && <Button onClick={() => setDraft(null)}>Discard saved copy</Button>}
                </div>
              )}
            </Flex>

            <View as="section" aria-labelledby="content-imports" borderWidth="small 0 0 0" padding="gap.inputs.vertical 0 0 0">
              <Flex direction="column" gap="general.spaceSm">
                <Heading level="h2" id="content-imports">Content imports</Heading>
                <Text as="p">Content import files cannot be downloaded after 500 days.</Text>
                <Table caption={() => 'Content imports'} themeOverride={noFill}>
                  <Table.Head themeOverride={noFill}>
                    <Table.Row themeOverride={noFill}>
                      <Table.ColHeader themeOverride={noFill} id="type">Content Type</Table.ColHeader>
                      <Table.ColHeader themeOverride={noFill} id="source">Source Link</Table.ColHeader>
                      <Table.ColHeader themeOverride={noFill} id="date">Date Imported</Table.ColHeader>
                      <Table.ColHeader themeOverride={noFill} id="status">Status</Table.ColHeader>
                      <Table.ColHeader themeOverride={noFill} id="progress">Progress</Table.ColHeader>
                      <Table.ColHeader themeOverride={noFill} id="action">Action</Table.ColHeader>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body themeOverride={noFill}>
                    {imports.map((row) => (
                      <Table.Row themeOverride={noFill} key={row.id}>
                        <Table.Cell themeOverride={noFill}>{row.type}</Table.Cell>
                        <Table.Cell themeOverride={noFill}>
                          <Link href="#" onClick={(e: { preventDefault: () => void }) => e.preventDefault()}>{row.source}</Link>
                        </Table.Cell>
                        <Table.Cell themeOverride={noFill}>{row.date}</Table.Cell>
                        <Table.Cell themeOverride={noFill}>
                          <StatusPill color={row.status === 'Completed' ? 'success' : row.status === 'Failed' ? 'error' : 'neutral'}>{row.status}</StatusPill>
                        </Table.Cell>
                        <Table.Cell themeOverride={noFill} />
                        <Table.Cell themeOverride={noFill}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                            {row.summary && (
                              <Link href="#" onClick={(e: { preventDefault: () => void }) => { e.preventDefault(); setViewing(row) }}>
                                View summary
                              </Link>
                            )}
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Flex>
            </View>
          </Flex>
        </View>
      </Flex>

    </DesktopWrapper>
  )
}

// Content that only shows in the Legacy theme (it has no description line in its header).
function LegacyOnly({ children }: { children: ReactNode }) {
  return useAppThemeKey() === 'legacy' ? <>{children}</> : null
}

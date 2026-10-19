import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  Checkbox,
  CloseButton,
  Flex,
  Heading,
  Link,
  Modal,
  RadioInput,
  RadioInputGroup,
  SimpleSelect,
  IconSearchLine,
  Table,
  Text,
  View,
} from '@instructure/ui/v11_7'
import DesktopWrapper from './DesktopWrapper'
import FigmaAlert from './FigmaAlert'
import RolloverWizard, { ReplaceConfirm, SummaryView } from './RolloverWizard'
import StatusPill from './StatusPill'
import { useAppThemeKey } from './appTheme'
import type { CopySummary } from './rolloverData'

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

const CONTENT_TYPES = ['Copy a Canvas Course', 'Canvas Course Export Package', 'Zip file', 'QTI .zip file']
const COURSES = ['Portfolio Test', 'Biology 101', 'Intro to Design', 'World History']

type ImportRow = { type: string; source: string; date: string; status: string; summary?: CopySummary }

// A copy already exists in this course, so a second copy has to ask before it replaces it.
const FIRST_IMPORTS: ImportRow[] = [{ type: 'Course Copy', source: 'Portfolio Test', date: 'Sep 30 at 4:58am', status: 'Completed' }]

// Tables sit directly on the page background, so every table part gets a transparent fill.
const noFill = { background: 'transparent' }

export default function CourseRollover() {
  const [contentType, setContentType] = useState(CONTENT_TYPES[0])
  const [course, setCourse] = useState(COURSES[0])
  const [includeCompleted, setIncludeCompleted] = useState(true)
  const [content, setContent] = useState('all')
  const [adjustDates, setAdjustDates] = useState(true)
  const [imports, setImports] = useState<ImportRow[]>(FIRST_IMPORTS)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [wizardCourse, setWizardCourse] = useState<string | null>(null)
  const [viewing, setViewing] = useState<CopySummary | null>(null)

  const isCourseCopy = contentType === CONTENT_TYPES[0]
  const existingCopy = imports.find((i) => i.type === 'Course Copy')

  const clearAll = () => {
    setContentType(CONTENT_TYPES[0])
    setCourse('')
    setIncludeCompleted(false)
    setContent('all')
    setAdjustDates(false)
  }

  // Starting a copy: ask first when it would replace an earlier copy, then open the review wizard.
  const startCopy = () => {
    if (!course) return
    if (existingCopy) setConfirmOpen(true)
    else setWizardCourse(course)
  }
  const confirmReplace = () => {
    setConfirmOpen(false)
    setWizardCourse(course)
  }
  const handleDone = useCallback((summary: CopySummary) => {
    setImports([{ type: 'Course Copy', source: summary.course, date: `Just now`, status: 'Completed', summary }])
  }, [])

  return (
    <DesktopWrapper
      pageTitle="Import Content"
      breadcrumb={['Courses', 'Rollover']}
      activeNav="Courses"
      // The wrapper draws the course menu: in the Courses sub navigation (Light and Dark) or as a
      // column beside the content (Legacy).
      course={COURSE}
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

              <FigmaAlert variant="warning" type="floating">
                Previously imported content from the same course will be replaced. Manually added
                content will remain.
              </FigmaAlert>

              <SimpleSelect
                renderLabel="Select Content Type"
                value={contentType}
                onChange={(_e, { value }) => setContentType(String(value))}
              >
                {CONTENT_TYPES.map((t) => (
                  <SimpleSelect.Option key={t} id={t} value={t}>{t}</SimpleSelect.Option>
                ))}
              </SimpleSelect>

              <SimpleSelect
                renderLabel="Search for a course"
                placeholder="Search..."
                renderBeforeInput={<IconSearchLine />}
                value={course}
                onChange={(_e, { value }) => setCourse(String(value))}
              >
                {COURSES.map((c) => (
                  <SimpleSelect.Option key={c} id={c} value={c}>{c}</SimpleSelect.Option>
                ))}
              </SimpleSelect>
              <Checkbox
                label="Include completed courses"
                checked={includeCompleted}
                onChange={() => setIncludeCompleted((v) => !v)}
              />

              <RadioInputGroup
                name="content"
                description="Content"
                isRequired
                value={content}
                onChange={(_e, value) => setContent(value)}
              >
                <RadioInput
                  value="all"
                  label={
                    <div>
                      <Text>All content</Text>
                      <Text as="p" variant="contentSmall">
                        The following content types will be imported: Course Settings, Syllabus
                        Body, Modules, Assignments, Quizzes, Question Banks, Discussion Topics,
                        Pages, Announcements, Rubrics, Files, and Calendar Events.
                      </Text>
                      <Text as="p" variant="contentSmall">
                        Feature Options aren't imported and must be enabled manually in the new
                        course's Settings.
                      </Text>
                    </div>
                  }
                />
                <RadioInput value="specific" label="Select specific content" />
              </RadioInputGroup>

              <Heading level="h3" variant="label">Options</Heading>
              <Checkbox
                label="Adjust events and due dates"
                checked={adjustDates}
                onChange={() => setAdjustDates((v) => !v)}
              />
              {isCourseCopy && (
                <Text size="small" color="secondary">
                  Before the copy you review the comments from last term{adjustDates ? ', fix the dates' : ''} and fix the broken
                  links. After it you get a summary of what came over.
                </Text>
              )}

              <Flex gap="gap.buttons">
                <Button onClick={clearAll}>Clear</Button>
                <Button color="primary" onClick={startCopy} interaction={isCourseCopy && !course ? 'disabled' : 'enabled'}>
                  {isCourseCopy ? 'Review and copy' : 'Add to Import Queue'}
                </Button>
              </Flex>
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
                      <Table.Row themeOverride={noFill} key={row.source + row.date}>
                        <Table.Cell themeOverride={noFill}>{row.type}</Table.Cell>
                        <Table.Cell themeOverride={noFill}>
                          <Link href="#" onClick={(e: { preventDefault: () => void }) => e.preventDefault()}>{row.source}</Link>
                        </Table.Cell>
                        <Table.Cell themeOverride={noFill}>{row.date}</Table.Cell>
                        <Table.Cell themeOverride={noFill}><StatusPill color="success">{row.status}</StatusPill></Table.Cell>
                        <Table.Cell themeOverride={noFill} />
                        <Table.Cell themeOverride={noFill}>
                          {row.summary && (
                            <Link href="#" onClick={(e: { preventDefault: () => void }) => { e.preventDefault(); setViewing(row.summary!) }}>
                              View summary
                            </Link>
                          )}
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

      <ReplaceConfirm
        open={confirmOpen}
        source={existingCopy?.source ?? ''}
        copiedOn={existingCopy?.date ?? ''}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmReplace}
      />
      {wizardCourse && (
        <RolloverWizard
          key={wizardCourse}
          course={wizardCourse}
          adjustDates={adjustDates}
          onCancel={() => setWizardCourse(null)}
          onDone={handleDone}
        />
      )}
      <Modal open={viewing !== null} onDismiss={() => setViewing(null)} size="large" label="Copy summary">
        <Modal.Header>
          <CloseButton placement="end" offset="small" onClick={() => setViewing(null)} screenReaderLabel="Close" />
          <Heading level="h2">Summary of the copy from {viewing?.course}</Heading>
        </Modal.Header>
        <Modal.Body>{viewing && <SummaryView summary={viewing} />}</Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={() => setViewing(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </DesktopWrapper>
  )
}

// Content that only shows in the Legacy theme (it has no description line in its header).
function LegacyOnly({ children }: { children: ReactNode }) {
  return useAppThemeKey() === 'legacy' ? <>{children}</> : null
}

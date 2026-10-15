import { useState } from 'react'
import {
  Button,
  Checkbox,
  DateInput,
  Flex,
  Heading,
  IconAddLine,
  IconSearchLine,
  Link,
  Pill,
  RadioInput,
  RadioInputGroup,
  SimpleSelect,
  Table,
  Text,
  View,
} from '@instructure/ui/v11_7'
import DesktopWrapper from './DesktopWrapper'
import FigmaAlert from './FigmaAlert'
import { useAppThemeKey } from './appTheme'

// Course Rollover: "Import Content" page, rebuilt on the template with the rules in
// docs/compare.md: Figma decides the design, the package decides what exists, new-theme (v2)
// components only, spacing from docs/spacing.md through the `gap` and `margin` token props.
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

const IMPORTS = [
  { type: 'Course Copy', source: 'Portfolio Test', date: 'Sep 30 at 4:58am', status: 'Completed' },
]

// Tables sit directly on the page background, so every table part gets a transparent fill.
const noFill = { background: 'transparent' }

const dateFieldProps = {
  screenReaderLabels: {
    calendarIcon: 'Open calendar',
    prevMonthButton: 'Previous month',
    nextMonthButton: 'Next month',
    datePickerDialog: 'Date picker',
    selectedLabel: 'Selected',
  },
  placeholder: 'Select a date',
  width: '16rem',
  invalidDateErrorMessage: 'Enter a valid date',
}

function DateChange({ label }: { label: string }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  return (
    <Flex alignItems="end" wrap="wrap" gap="gap.inputs.horizontal">
      <DateInput
        {...dateFieldProps}
        renderLabel={label}
        value={from}
        onChange={(_e, inputValue) => setFrom(inputValue)}
      />
      <View as="div" padding="0 0 general.spaceSm 0">
        <Text>change to</Text>
      </View>
      <DateInput
        {...dateFieldProps}
        renderLabel={<span style={{ visibility: 'hidden' }}>{label} new date</span>}
        value={to}
        onChange={(_e, inputValue) => setTo(inputValue)}
      />
    </Flex>
  )
}

export default function CourseRollover() {
  const themeKey = useAppThemeKey()
  const [contentType, setContentType] = useState(CONTENT_TYPES[0])
  const [course, setCourse] = useState(COURSES[0])
  const [includeCompleted, setIncludeCompleted] = useState(true)
  const [content, setContent] = useState('all')
  const [adjustDates, setAdjustDates] = useState(true)
  const [adjustment, setAdjustment] = useState('shift')

  const clearAll = () => {
    setContentType(CONTENT_TYPES[0])
    setCourse('')
    setIncludeCompleted(false)
    setContent('all')
    setAdjustDates(false)
    setAdjustment('shift')
  }

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
              {themeKey === 'legacy' && <Text as="p">{DESCRIPTION}</Text>}

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
              {adjustDates && (
                <>
                  <RadioInputGroup
                    name="adjustment"
                    description="Date adjustments"
                    value={adjustment}
                    onChange={(_e, value) => setAdjustment(value)}
                  >
                    <RadioInput value="shift" label="Shift dates" />
                    <RadioInput value="remove" label="Remove dates" />
                  </RadioInputGroup>
                  {adjustment === 'shift' && (
                    <>
                      <DateChange label="Beginning date:" />
                      <DateChange label="Ending date:" />
                      <div>
                        <Button renderIcon={<IconAddLine />}>Substitution</Button>
                      </div>
                    </>
                  )}
                </>
              )}

              <Flex gap="gap.buttons">
                <Button onClick={clearAll}>Clear</Button>
                <Button color="primary" renderIcon={<IconAddLine />}>Add to Import Queue</Button>
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
                    {IMPORTS.map((row) => (
                      <Table.Row themeOverride={noFill} key={row.source}>
                        <Table.Cell themeOverride={noFill}>{row.type}</Table.Cell>
                        <Table.Cell themeOverride={noFill}><Link href="#">{row.source}</Link></Table.Cell>
                        <Table.Cell themeOverride={noFill}>{row.date}</Table.Cell>
                        <Table.Cell themeOverride={noFill}><Pill color="success">{row.status}</Pill></Table.Cell>
                        <Table.Cell themeOverride={noFill} />
                        <Table.Cell themeOverride={noFill} />
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

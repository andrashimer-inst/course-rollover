import { useMemo, useState } from 'react'
import { IconSearchLine, Pagination, RadioInput, ScreenReaderContent, SimpleSelect, Table, Text, TextInput } from '@instructure/ui/v11_7'
import { SOURCE_COURSES, TIME_KINDS } from './courseListData'
import type { SourceCourse } from './courseListData'
import { useAppThemeKey, useSurfaceTokens } from './appTheme'

// Step 1 of the copy wizard: pick the course to copy from. One course can be chosen, so each row has a radio button.
// The list shows 20 courses a page. It can be searched and filtered by who taught it and the kind of time shown. Clicking a column title sorts the list.

const noFill = { background: 'transparent' }

type SortKey = 'name' | 'teacher' | 'students' | 'time'

const PAGE_SIZE = 20
// Only the real courses fill the first page. The pages after it repeat the list as placeholders, to show the paging.
const DUMMY_PAGES = 12
const ANY = 'any'
const TAUGHT_BY = [
  { id: ANY, label: 'Anyone' },
  { id: 'me', label: 'You' },
  { id: 'others', label: 'Other teachers' },
]

const taughtByYou = (c: SourceCourse) => c.teachers.includes('You')

export default function SelectCourseStep({ selected, onSelect }: { selected: string; onSelect: (name: string) => void }) {
  const t = useSurfaceTokens()
  // Light and Dark put the table on a card. Legacy stays flat on the page.
  const card = useAppThemeKey() !== 'legacy'
  const [query, setQuery] = useState('')
  const [taught, setTaught] = useState(ANY)
  const [time, setTime] = useState(ANY)
  const [sortBy, setSortBy] = useState<SortKey | null>(null)
  const [ascending, setAscending] = useState(true)
  const [page, setPage] = useState(1)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SOURCE_COURSES.filter((c) => {
      if (q && !`${c.name} ${c.code} ${c.teachers.join(' ')}`.toLowerCase().includes(q)) return false
      if (taught === 'me' && !taughtByYou(c)) return false
      if (taught === 'others' && c.teachers.every((n) => n === 'You')) return false
      if (time !== ANY && c.timeKind !== time) return false
      return true
    })
  }, [query, taught, time])

  const rows = useMemo(() => {
    if (!sortBy) return shown
    const value = (c: SourceCourse) =>
      sortBy === 'name' ? c.name.toLowerCase() : sortBy === 'teacher' ? c.teachers.join(', ').toLowerCase() : sortBy === 'students' ? c.students : Date.parse(c.date)
    const sorted = [...shown].sort((a, b) => (value(a) > value(b) ? 1 : value(a) < value(b) ? -1 : 0))
    return ascending ? sorted : sorted.reverse()
  }, [shown, sortBy, ascending])

  const pageCount = rows.length > PAGE_SIZE ? DUMMY_PAGES : 1
  const total = pageCount > 1 ? pageCount * PAGE_SIZE : rows.length
  const current = Math.min(page, pageCount)
  const first = (current - 1) * PAGE_SIZE
  const pageRows = pageCount === 1
    ? rows
    : Array.from({ length: PAGE_SIZE }, (_, i) => rows[(first + i) % rows.length])

  const sortProps = (key: SortKey) => ({
    onRequestSort: () => {
      setPage(1)
      if (sortBy === key) setAscending(!ascending)
      else {
        setSortBy(key)
        setAscending(true)
      }
    },
    sortDirection: sortBy === key ? (ascending ? ('ascending' as const) : ('descending' as const)) : ('none' as const),
  })

  const filter = (label: string, value: string, set: (v: string) => void, options: { id: string; label: string }[]) => (
    <div style={{ flex: '1 1 12rem', minWidth: 0 }}>
      <SimpleSelect renderLabel={label} value={value} onChange={(_e, { value: v }) => set(String(v))}>
        {options.map((o) => (
          <SimpleSelect.Option key={o.id} id={`${label}-${o.id}`} value={o.id}>{o.label}</SimpleSelect.Option>
        ))}
      </SimpleSelect>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 16rem', minWidth: 0 }}>
          <TextInput
            renderLabel="Search courses"
            placeholder="Course name, code or teacher"
            renderBeforeInput={<IconSearchLine />}
            value={query}
            onChange={(_e, value) => { setQuery(value); setPage(1) }}
          />
        </div>
        {filter('Taught by', taught, (v) => { setTaught(v); setPage(1) }, TAUGHT_BY)}
        {filter('Time', time, (v) => { setTime(v); setPage(1) }, [{ id: ANY, label: 'Any time' }, ...TIME_KINDS.map((k) => ({ id: k, label: k }))])}
      </div>

      <Text color="secondary" aria-live="polite">
        {shown.length === 0 ? '0' : `${first + 1} to ${first + pageRows.length}`} of {total} courses
      </Text>

      {shown.length === 0 ? (
        <Text as="p">No course matches. Clear the search or a filter to see more.</Text>
      ) : (
        <div
          role="radiogroup"
          aria-label="Course to copy from"
          style={
            card
              ? {
                  background: t.containerColor,
                  borderRadius: t.radiusCardMd,
                  boxShadow: t.shadowResting,
                  padding: t.space.lg,
                }
              : undefined
          }
        >
          {/* The list scrolls inside the card. The header row stays in view while it does. */}
          <style>{`
            .course-scroll thead th { position: sticky; top: 0; z-index: 10; background: ${card ? t.containerColor : t.pageColor}; box-shadow: inset 0 -${t.borderWidth} 0 ${t.borderColor}; }
            .course-scroll table { table-layout: fixed; width: 100%; }
            .course-scroll th:first-child, .course-scroll td:first-child { width: 2.75rem; padding-inline-end: 0; }
            .course-scroll tbody tr { cursor: pointer; }
            .course-scroll tbody tr:hover td { background: color-mix(in srgb, ${t.textColor} 6%, transparent); }
            .course-scroll tbody tr[data-selected="true"] td { background: color-mix(in srgb, ${t.linkColor} 12%, transparent); }
            .course-scroll tbody tr[data-selected="true"] td:first-child { box-shadow: inset 0.25rem 0 0 ${t.linkColor}; }
          `}</style>
          <div
            className="course-scroll"
          >
          <Table caption={() => 'Courses you can copy from'} themeOverride={noFill}>
            <Table.Head themeOverride={noFill}>
              <Table.Row themeOverride={noFill}>
                <Table.ColHeader themeOverride={noFill} id="pick"><ScreenReaderContent>Select</ScreenReaderContent></Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="name" {...sortProps('name')}>Course</Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="teacher" {...sortProps('teacher')}>Taught by</Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="students" {...sortProps('students')}>Students</Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="time" {...sortProps('time')}>Time</Table.ColHeader>
              </Table.Row>
            </Table.Head>
            <Table.Body themeOverride={noFill}>
              {pageRows.map((c, i) => (
                <Table.Row
                  themeOverride={noFill}
                  key={`${current}-${i}`}
                  data-selected={selected === c.name}
                  onClick={() => onSelect(c.name)}
                >
                  <Table.Cell themeOverride={noFill}>
                    <RadioInput
                      name="source-course"
                      size="small"
                      value={c.name}
                      checked={selected === c.name}
                      onChange={() => onSelect(c.name)}
                      label={<ScreenReaderContent>{`Copy from ${c.name}`}</ScreenReaderContent>}
                    />
                  </Table.Cell>
                  <Table.Cell themeOverride={noFill}>
                    <Text weight="bold">{c.name}</Text>
                    <Text as="div" size="small" color="secondary">{c.code}</Text>
                  </Table.Cell>
                  <Table.Cell themeOverride={noFill}>{c.teachers.join(', ')}</Table.Cell>
                  <Table.Cell themeOverride={noFill}>{c.students}</Table.Cell>
                  <Table.Cell themeOverride={noFill}>
                    <Text as="div">{c.timeKind}</Text>
                    <Text as="div" size="small" color="secondary">{c.date}</Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          </div>
          {pageCount > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingBlockStart: t.space.lg }}>
              <Pagination
                as="nav"
                variant="compact"
                showDisabledButtons
                siblingCount={3}
                boundaryCount={1}
                labelNext="Next page"
                labelPrev="Previous page"
                screenReaderLabelPageButton={(c, total) => `Page ${c} of ${total}`}
                totalPageNumber={pageCount}
                currentPage={current}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Button, IconArrowOpenEndSolid, IconArrowOpenStartSolid, IconButton, IconExportLine, IconSearchLine, Link, Metric, ScreenReaderContent, SimpleSelect, Table, Tabs, Text, TextInput } from '@instructure/ui/v11_7'
import AutoSelect from './AutoSelect'
import FigmaAlert from './FigmaAlert'
import StatusPill from './StatusPill'
import { PEOPLE } from './copyHistory'
import { TODO_GROUPS, exportTodo } from './reviewCopyData'
import type { CopySummary, HistoryEvent } from './rolloverData'
import { useAppThemeKey, useSurfaceTokens } from './appTheme'

// The summary after the copy: how it went (items created, dates placed, what was not copied), what the teacher can
// still do (bring an item now, undo the whole copy), the copy history and the to-do list to keep.

const noFill = { background: 'transparent' }

const TAG_COLOR: Record<HistoryEvent['tag'], 'neutral' | 'info' | 'success' | 'ai'> = {
  Session: 'neutral',
  Created: 'success',
  Decision: 'info',
  Automatic: 'neutral',
}

// The history can be filtered by the kind of entry or by the person who did it.
const TYPE_FILTERS = [['all', 'All types'], ['Decision', 'Decisions'], ['Created', 'Created'], ['Automatic', 'Automatic'], ['Session', 'Session']] as const
const PERSON_FILTERS = [['all', 'All users'], ...PEOPLE.map((p) => [p, p] as const)] as const

function exportHistory(list: HistoryEvent[], course: string) {
  const rows = [['Date and time', 'Type', 'Activity', 'User'], ...list.map((h) => [h.when, h.tag, h.text, h.who])]
  const csv = rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `copy-history-${course.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function SummaryView({
  summary, undone: wasUndone = false,
}: {
  summary: CopySummary
  undone?: boolean
}) {
  const t = useSurfaceTokens()
  const card = useAppThemeKey() !== 'legacy'
  const cardStyle = card
    ? { background: t.containerColor, borderRadius: t.radiusCardMd, boxShadow: t.shadowResting, padding: t.space.lg }
    : { borderTop: `${t.borderWidth} solid ${t.borderColor}`, paddingTop: t.space.lg }

  // Bringing an item now is shown here: the item leaves the list and counts as created.
  const [brought, setBrought] = useState<string[]>([])
  const undone = wasUndone
  // The history is filtered by the type of entry and by the person, separately.
  const [typeFilter, setTypeFilter] = useState('all')
  const [personFilter, setPersonFilter] = useState('all')
  const [tab, setTab] = useState(0)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  // What was not copied. A failure is an error, not a decision, so it has a red pill and is on the to-do list.
  type NotCopied = { item: string; reason: string; kind: 'failed' | 'left-out' | 'canvas' | 'attention'; canBring: boolean }
  const notCopied: NotCopied[] = [
    ...summary.failed.map((f) => ({ item: f.item, reason: f.reason, kind: 'failed' as const, canBring: false })),
    ...summary.notCame.map((n) => ({ item: n.item, reason: n.reason, kind: n.kind, canBring: n.kind === 'left-out' })),
  ].filter((n) => !brought.includes(n.item))
  const NOT_COPIED_PILL: Record<NotCopied['kind'], { label: string; color: 'error' | 'info' | 'neutral' | 'warning' }> = {
    failed: { label: 'Failed', color: 'error' },
    'left-out': { label: 'Left out', color: 'info' },
    canvas: { label: 'Not copied by Canvas', color: 'neutral' },
    attention: { label: 'Needs attention', color: 'warning' },
  }
  // Every failure is on the to-do list, also on copies where the list did not have it yet.
  const todoAll = [
    ...summary.todo,
    ...summary.failed
      .filter((f) => !summary.todo.some((x) => x.title === `Copy failed: ${f.item}`))
      .map((f) => ({ group: 'Fix after the copy', title: `Copy failed: ${f.item}`, detail: f.fix })),
  ]

  const history = summary.history
    .filter((h) => typeFilter === 'all' || h.tag === typeFilter)
    .filter((h) => personFilter === 'all' || h.who === personFilter)
    .filter((h) => !query.trim() || `${h.when} ${h.tag} ${h.text} ${h.who}`.toLowerCase().includes(query.trim().toLowerCase()))
  // The history shows 20 entries a page. Searching or filtering starts again on the first page.
  const PAGE_SIZE = 20
  const pageCount = Math.max(1, Math.ceil(history.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = history.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  // Previous and next arrows with the page numbers between them. The arrows are always there, also with few pages.
  const pageNumbers: (number | 'gap')[] = []
  for (let n = 1; n <= pageCount; n++) {
    if (n === 1 || n === pageCount || Math.abs(n - currentPage) <= 1 || pageCount <= 7) pageNumbers.push(n)
    else if (pageNumbers[pageNumbers.length - 1] !== 'gap') pageNumbers.push('gap')
  }
  const pager =
    pageCount > 1 ? (
      <nav aria-label="Copy history pages" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: t.space.sm }}>
        <IconButton screenReaderLabel="Previous page" size="small" interaction={currentPage > 1 ? 'enabled' : 'disabled'} onClick={() => setPage(currentPage - 1)}>
          <IconArrowOpenStartSolid />
        </IconButton>
        {pageNumbers.map((n, i) =>
          n === 'gap' ? (
            <Text key={`gap-${i}`} color="secondary">…</Text>
          ) : (
            <Button
              key={n}
              size="small"
              color={n === currentPage ? 'primary' : 'secondary'}
              aria-current={n === currentPage ? 'page' : undefined}
              onClick={() => setPage(n)}
            >
              <ScreenReaderContent>Page </ScreenReaderContent>
              {n}
            </Button>
          ),
        )}
        <IconButton screenReaderLabel="Next page" size="small" interaction={currentPage < pageCount ? 'enabled' : 'disabled'} onClick={() => setPage(currentPage + 1)}>
          <IconArrowOpenEndSolid />
        </IconButton>
      </nav>
    ) : null
  const stills = todoAll.length
  const created = summary.stats.created + brought.length


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.xl }}>
      <section aria-labelledby="set-up" style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
        {!undone && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: t.space.lg }}>
            {[
              [created, 'Items copied'],
              [summary.stats.relinked, 'Tools relinked'],
              [summary.stats.sentToAdmin, 'Sent to admin'],
              [summary.stats.datesPlaced, 'Dates updated'],
              [notCopied.length, 'Not copied'],
              [stills, 'Open to-do items'],
            ].map(([value, label]) => (
              <div
                key={label}
                style={{
                  background: t.containerColor,
                  borderRadius: t.radiusCardMd,
                  boxShadow: card ? t.shadowResting : undefined,
                  border: card ? undefined : `${t.borderWidth} solid ${t.borderColor}`,
                  padding: t.space.lg,
                }}
              >
                <Metric textAlign="start" renderLabel={<Text size="medium">{label}</Text>} renderValue={String(value)} />
              </div>
            ))}
          </div>
        )}
      </section>

      {undone && (
        <FigmaAlert variant="info" type="inline">
          The copy from {summary.course} was removed. You can start the copy again from the beginning.
        </FigmaAlert>
      )}

      {!undone ? (
        <Tabs onRequestTabChange={(_e, { index }) => setTab(index)}>
          <Tabs.Panel id="tab-not-copied" renderTitle={`Not copied (${notCopied.length})`} isSelected={tab === 0} padding="general.spaceXl 0 0 0">
            <section aria-label="Not copied" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
                <Text as="div" weight="bold" size="large">Not copied</Text>
                <Text as="div" color="secondary">
                  {notCopied.length === 0
                    ? 'Everything you chose was copied.'
                    : 'These items were not copied. Items that failed are on your to-do list so you can fix them.'}
                </Text>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {notCopied.map((n) => (
                  <li key={n.item} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md, padding: `${t.space.md} 0`, borderTop: `${t.borderWidth} solid ${t.borderColor}` }}>
                    <span style={{ flex: '1 1 18rem', minWidth: 0 }}>
                      <Text as="div" weight="bold">{n.item}</Text>
                      <Text as="div" color="secondary">{n.reason}</Text>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: t.space.md }}>
                      {n.canBring && (
                        <Link as="button" onClick={() => setBrought([...brought, n.item])}>
                          Copy it now<ScreenReaderContent>: {n.item}</ScreenReaderContent>
                        </Link>
                      )}
                      <StatusPill size="sm" color={NOT_COPIED_PILL[n.kind].color}>{NOT_COPIED_PILL[n.kind].label}</StatusPill>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </Tabs.Panel>
          <Tabs.Panel id="tab-todo" renderTitle={`To-do list (${todoAll.length})`} isSelected={tab === 1} padding="general.spaceXl 0 0 0">
            <section aria-label="To-do list" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
                  <Text as="div" weight="bold" size="large">To-do list</Text>
                  <Text as="div" color="secondary">Actions that still need your attention after the copy. Export the list to keep it.</Text>
                </div>
                <Button renderIcon={<IconExportLine />} onClick={() => exportTodo(todoAll, summary.course)}>
                  Export to-do list
                </Button>
              </div>
              <Table caption={() => 'To-do list after the copy'} themeOverride={noFill}>
                <Table.Head themeOverride={noFill}>
                  <Table.Row themeOverride={noFill}>
                    <Table.ColHeader themeOverride={noFill} id="todo-item" width="35%">To do</Table.ColHeader>
                    <Table.ColHeader themeOverride={noFill} id="todo-detail">Details</Table.ColHeader>
                  </Table.Row>
                </Table.Head>
                <Table.Body themeOverride={noFill}>
                  {TODO_GROUPS.flatMap((g) => {
                    const items = todoAll.filter((x) => x.group === g)
                    if (items.length === 0) return []
                    return [
                      <Table.Row themeOverride={noFill} key={`g-${g}`}>
                        <Table.Cell themeOverride={noFill}><Text weight="bold">{g} ({items.length})</Text></Table.Cell>
                        <Table.Cell themeOverride={noFill} />
                      </Table.Row>,
                      ...items.map((x) => (
                        <Table.Row themeOverride={noFill} key={`${g}-${x.title}`}>
                          <Table.Cell themeOverride={noFill}>{x.title}</Table.Cell>
                          <Table.Cell themeOverride={noFill}>{x.detail}</Table.Cell>
                        </Table.Row>
                      )),
                    ]
                  })}
                </Table.Body>
              </Table>
            </section>
          </Tabs.Panel>
          <Tabs.Panel id="tab-history" renderTitle={`Copy history (${summary.history.length})`} isSelected={tab === 2} padding="general.spaceXl 0 0 0">
      <section aria-labelledby="history" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
          <Text as="div" weight="bold" size="large" id="history">Copy history</Text>
          <Text as="div" color="secondary">A record of this copy. Visible to everyone on the course and your admin.</Text>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'flex-end' }}>
          <div style={{ width: '20rem', maxWidth: '100%' }}>
            <TextInput
              renderLabel={<Text weight="bold">Search history</Text>}
              placeholder="Activity, type or user"
              renderBeforeInput={<IconSearchLine />}
              value={query}
              onChange={(_e, value) => { setQuery(value); setPage(1) }}
            />
          </div>
          <div style={{ width: '12rem', maxWidth: '100%' }}>
            <SimpleSelect
              renderLabel={<Text weight="bold">Type</Text>}
              value={typeFilter}
              onChange={(_e, { value }) => { setTypeFilter(String(value)); setPage(1) }}
            >
              {TYPE_FILTERS.map(([id, label]) => (
                <SimpleSelect.Option key={id} id={`history-type-${id}`} value={id}>{label}</SimpleSelect.Option>
              ))}
            </SimpleSelect>
          </div>
          <div style={{ width: '14rem', maxWidth: '100%' }}>
            <AutoSelect
              label="User"
              assistiveText="Type to find a user. Use the up and down arrow keys to choose."
              noMatch="No user matches"
              options={PERSON_FILTERS.map(([id, label]) => ({ id, label }))}
              value={personFilter}
              onChange={(id) => { setPersonFilter(id); setPage(1) }}
            />
          </div>
          <div style={{ marginInlineStart: 'auto' }}>
            <Button renderIcon={<IconExportLine />} onClick={() => exportHistory(history, summary.course)}>
              Export history
            </Button>
          </div>
        </div>
        <Table caption={() => 'Copy history'} themeOverride={noFill}>
          <Table.Head themeOverride={noFill}>
            <Table.Row themeOverride={noFill}>
              <Table.ColHeader themeOverride={noFill} id="h-when" width="20%">Date and time</Table.ColHeader>
              <Table.ColHeader themeOverride={noFill} id="h-type" width="12%">Type</Table.ColHeader>
              <Table.ColHeader themeOverride={noFill} id="h-what">Activity</Table.ColHeader>
              <Table.ColHeader themeOverride={noFill} id="h-who" width="20%">User</Table.ColHeader>
            </Table.Row>
          </Table.Head>
          <Table.Body themeOverride={noFill}>
            {history.length === 0 && (
              <Table.Row themeOverride={noFill}>
                <Table.Cell themeOverride={noFill} colSpan={4}>No history entries match.</Table.Cell>
              </Table.Row>
            )}
            {pageRows.map((h, i) => (
              <Table.Row themeOverride={noFill} key={`${h.when}-${i}`}>
                <Table.Cell themeOverride={noFill}>{h.when}</Table.Cell>
                <Table.Cell themeOverride={noFill}><StatusPill size="xs" color={TAG_COLOR[h.tag]}>{h.tag}</StatusPill></Table.Cell>
                <Table.Cell themeOverride={noFill}>{h.text}</Table.Cell>
                <Table.Cell themeOverride={noFill}>{h.who}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        {pager}
      </section>
          </Tabs.Panel>
        </Tabs>
      ) : (
      <section aria-labelledby="history" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
          <Text as="div" weight="bold" size="large" id="history">Copy history</Text>
          <Text as="div" color="secondary">A record of this copy. Visible to everyone on the course and your admin.</Text>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'flex-end' }}>
          <div style={{ width: '20rem', maxWidth: '100%' }}>
            <TextInput
              renderLabel={<Text weight="bold">Search history</Text>}
              placeholder="Activity, type or user"
              renderBeforeInput={<IconSearchLine />}
              value={query}
              onChange={(_e, value) => { setQuery(value); setPage(1) }}
            />
          </div>
          <div style={{ width: '12rem', maxWidth: '100%' }}>
            <SimpleSelect
              renderLabel={<Text weight="bold">Type</Text>}
              value={typeFilter}
              onChange={(_e, { value }) => { setTypeFilter(String(value)); setPage(1) }}
            >
              {TYPE_FILTERS.map(([id, label]) => (
                <SimpleSelect.Option key={id} id={`history-type-${id}`} value={id}>{label}</SimpleSelect.Option>
              ))}
            </SimpleSelect>
          </div>
          <div style={{ width: '14rem', maxWidth: '100%' }}>
            <AutoSelect
              label="User"
              assistiveText="Type to find a user. Use the up and down arrow keys to choose."
              noMatch="No user matches"
              options={PERSON_FILTERS.map(([id, label]) => ({ id, label }))}
              value={personFilter}
              onChange={(id) => { setPersonFilter(id); setPage(1) }}
            />
          </div>
          <div style={{ marginInlineStart: 'auto' }}>
            <Button renderIcon={<IconExportLine />} onClick={() => exportHistory(history, summary.course)}>
              Export history
            </Button>
          </div>
        </div>
        <Table caption={() => 'Copy history'} themeOverride={noFill}>
          <Table.Head themeOverride={noFill}>
            <Table.Row themeOverride={noFill}>
              <Table.ColHeader themeOverride={noFill} id="h-when" width="20%">Date and time</Table.ColHeader>
              <Table.ColHeader themeOverride={noFill} id="h-type" width="12%">Type</Table.ColHeader>
              <Table.ColHeader themeOverride={noFill} id="h-what">Activity</Table.ColHeader>
              <Table.ColHeader themeOverride={noFill} id="h-who" width="20%">User</Table.ColHeader>
            </Table.Row>
          </Table.Head>
          <Table.Body themeOverride={noFill}>
            {history.length === 0 && (
              <Table.Row themeOverride={noFill}>
                <Table.Cell themeOverride={noFill} colSpan={4}>No history entries match.</Table.Cell>
              </Table.Row>
            )}
            {pageRows.map((h, i) => (
              <Table.Row themeOverride={noFill} key={`${h.when}-${i}`}>
                <Table.Cell themeOverride={noFill}>{h.when}</Table.Cell>
                <Table.Cell themeOverride={noFill}><StatusPill size="xs" color={TAG_COLOR[h.tag]}>{h.tag}</StatusPill></Table.Cell>
                <Table.Cell themeOverride={noFill}>{h.text}</Table.Cell>
                <Table.Cell themeOverride={noFill}>{h.who}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        {pager}
      </section>
      )}

    </div>
  )
}

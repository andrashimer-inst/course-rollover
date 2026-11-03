import { useState } from 'react'
import { Button, CloseButton, Heading, IconExportLine, Link, Metric, Modal, ScreenReaderContent, SimpleSelect, Table, Text, Tooltip } from '@instructure/ui/v11_7'
import FigmaAlert from './FigmaAlert'
import StatusPill from './StatusPill'
import { PEOPLE } from './copyHistory'
import { UNDO_BLOCKED } from './sampleImports'
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
const TYPE_FILTERS = [['all', 'All'], ['type:Decision', 'Decisions'], ['type:Created', 'Created'], ['type:Automatic', 'Automatic']] as const
const PERSON_FILTERS = PEOPLE.map((p) => [`who:${p}`, p] as const)

function exportHistory(list: HistoryEvent[], course: string) {
  const rows = [['When', 'Type', 'What happened', 'Who'], ...list.map((h) => [h.when, h.tag, h.text, h.who])]
  const csv = rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `copy-history-${course.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function SummaryView({
  summary, published = false, undone: wasUndone = false, onUndo,
}: {
  summary: CopySummary
  // Once the course is published, a copy cannot be undone any more.
  published?: boolean
  undone?: boolean
  onUndo?: () => void
}) {
  const t = useSurfaceTokens()
  const card = useAppThemeKey() !== 'legacy'
  const cardStyle = card
    ? { background: t.containerColor, borderRadius: t.radiusCardMd, boxShadow: t.shadowResting, padding: t.space.lg }
    : { borderTop: `${t.borderWidth} solid ${t.borderColor}`, paddingTop: t.space.lg }

  // Bringing an item now is shown here: the item leaves the list and counts as created.
  const [brought, setBrought] = useState<string[]>([])
  const [undoneNow, setUndone] = useState(false)
  const undone = wasUndone || undoneNow
  const [confirmUndo, setConfirmUndo] = useState(false)
  const [filter, setFilter] = useState('all')

  const notCopied = [
    ...summary.notCame.map((n) => ({ item: n.item, reason: n.kind === 'left-out' ? `Left out: ${n.reason}` : n.reason, canBring: n.kind === 'left-out' })),
    ...summary.failed.map((f) => ({ item: f.item, reason: `Failed: ${f.reason}`, canBring: false })),
  ].filter((n) => !brought.includes(n.item))

  const history = summary.history.filter(
    (h) => filter === 'all' || (filter.startsWith('type:') ? h.tag === filter.slice(5) : h.who === filter.slice(4)),
  )
  const stills = summary.todo.length
  const created = summary.stats.created + brought.length


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.xl }}>
      <section aria-labelledby="set-up" style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
        {/* The result on the left, the two actions on the top right. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Heading level="h2" variant="titleSection" id="set-up">
              {undone ? `${summary.target} was set back to empty` : `${summary.target} Spring 2027 is set up`}
            </Heading>
            <Text as="div" color="secondary">{undone ? 'The copy was undone. Your choices are kept.' : summary.opens}</Text>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.sm }}>
            {!undone && <Button color="primary">Open course</Button>}
            <Tooltip
              renderTip={
                published
                  ? UNDO_BLOCKED
                  : `Removes everything this copy created. Your ${summary.target} Spring 2027 course goes back to empty. Your choices are kept.`
              }
              placement="bottom end"
            >
              {/* A disabled button gets no hover, so the tooltip sits on a wrapper that can also take focus. */}
              <span tabIndex={0} style={{ display: 'inline-flex' }}>
                <Button color="danger" interaction={undone || published ? 'disabled' : 'enabled'} onClick={() => setConfirmUndo(true)}>
                  Undo the whole copy
                </Button>
              </span>
            </Tooltip>
          </div>
        </div>
        {!undone && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: t.space.lg }}>
            {[
              [created, 'items created'],
              [summary.stats.relinked, 'tools relinked automatically'],
              [summary.stats.sentToAdmin, 'sent to your admin'],
              [summary.stats.datesPlaced, 'dates placed'],
              [notCopied.length, 'not copied'],
              [stills, 'still to do'],
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

      {!undone && (
        <section aria-labelledby="not-copied" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
          <Heading level="h3" variant="titleCardRegular" id="not-copied">Not copied ({notCopied.length})</Heading>
          {notCopied.length === 0 && <Text color="secondary">Everything you chose came over.</Text>}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {notCopied.map((n) => (
              <li key={n.item} style={{ display: 'flex', justifyContent: 'space-between', gap: t.space.md, padding: `${t.space.sm} 0`, borderTop: `${t.borderWidth} solid ${t.borderColor}` }}>
                <span>
                  <Text weight="bold">{n.item}</Text> <Text color="secondary">{n.reason}</Text>
                </span>
                {n.canBring && (
                  <Link as="button" onClick={() => setBrought([...brought, n.item])}>
                    Bring it now<ScreenReaderContent>: {n.item}</ScreenReaderContent>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!undone && (
        <section aria-labelledby="todo" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Heading level="h3" variant="titleCardRegular" id="todo">To-do list ({summary.todo.length})</Heading>
              <Text color="secondary">What is left for you to do by hand. Export it to keep it for yourself.</Text>
            </div>
            <Button renderIcon={<IconExportLine />} onClick={() => exportTodo(summary.todo, summary.course)}>
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
                const items = summary.todo.filter((x) => x.group === g)
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
      )}

      <section aria-labelledby="history" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Heading level="h3" variant="titleCardRegular" id="history">Copy history ({history.length === summary.history.length ? summary.history.length : `${history.length} of ${summary.history.length}`})</Heading>
            <Text color="secondary">Everyone on the course and your admin see the same history. Newest first.</Text>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.sm, alignItems: 'flex-end' }}>
            <div style={{ width: '16rem' }}>
              <SimpleSelect
                renderLabel={<ScreenReaderContent>Show</ScreenReaderContent>}
                value={filter}
                onChange={(_e, { value }) => setFilter(String(value))}
              >
                {TYPE_FILTERS.map(([id, label]) => (
                  <SimpleSelect.Option key={id} id={`history-${id}`} value={id}>{label}</SimpleSelect.Option>
                ))}
                <SimpleSelect.Group renderLabel="By person">
                  {PERSON_FILTERS.map(([id, label]) => (
                    <SimpleSelect.Option key={id} id={`history-${id}`} value={id}>{label}</SimpleSelect.Option>
                  ))}
                </SimpleSelect.Group>
              </SimpleSelect>
            </div>
            <Button renderIcon={<IconExportLine />} onClick={() => exportHistory(history, summary.course)}>
              Export history
            </Button>
          </div>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {history.map((h, i) => (
            <li
              key={`${h.when}-${i}`}
              style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, padding: `${t.space.md} 0`, borderTop: `${t.borderWidth} solid ${t.borderColor}` }}
            >
              <span style={{ flex: '0 0 11rem' }}><Text color="secondary">{h.when}</Text></span>
              <span style={{ flex: '1 1 18rem', minWidth: 0 }}>
                <StatusPill size="xs" color={TAG_COLOR[h.tag]}>{h.tag}</StatusPill> <Text>{h.text}</Text>
                <Text as="div" size="small" color="secondary">{h.who}</Text>
              </span>
              {h.link && <Link href="#" onClick={(e: { preventDefault: () => void }) => e.preventDefault()}>{h.link}</Link>}
            </li>
          ))}
        </ul>
      </section>

      <Modal open={confirmUndo} onDismiss={() => setConfirmUndo(false)} size="small" label="Undo the whole copy" shouldCloseOnDocumentClick={false}>
        <Modal.Header>
          <CloseButton placement="end" offset="small" onClick={() => setConfirmUndo(false)} screenReaderLabel="Close" />
          <Heading level="h2">Undo the whole copy?</Heading>
        </Modal.Header>
        <Modal.Body>
          <Text as="p">
            This removes everything the copy created in {summary.target}. The course goes back to empty. Your choices are kept, so you can copy again.
          </Text>
        </Modal.Body>
        <Modal.Footer>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button onClick={() => setConfirmUndo(false)}>Cancel</Button>
            <Button color="danger" onClick={() => { setUndone(true); setConfirmUndo(false); onUndo?.() }}>Yes, undo it</Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

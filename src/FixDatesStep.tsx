import {
  DateInput,
  Button,
  CircleAlertInstUIIcon,
  CircleCheckInstUIIcon,
  IconAssignmentLine,
  RadioInput,
  SimpleSelect,
  Table,
  Text,
  Tooltip,
} from '@instructure/ui/v11_7'
import DatePickerButton from './DatePickerButton'
import FigmaAlert from './FigmaAlert'
import StatusPill from './StatusPill'
import { DATE_ITEMS, NO_DATE_ITEMS, fmtShort, lastDayOf, localLabel, parseStart, rowInfo, timeOf, utcLabel } from './fixDatesData'
import type { DateChoice, DateMode, FixDatesState, NoDateChoice } from './fixDatesData'
import { useAppThemeKey, useSurfaceTokens } from './appTheme'

// Step 4 of the copy wizard: fix the dates. The teacher chooses how dates move to the new term, and each item that
// lands on a closed day (like Presidents' Day) gets a suggestion and a choice: move it before the
// holiday or after it. Items on a teaching day are done from the start, and any date can be changed by hand.

const noFill = { background: 'transparent' }

// The first day field and the fix-all dropdown are the same width, wide enough for the longest choice.
const FIELD_WIDTH = '21rem'

const dateFieldProps = {
  screenReaderLabels: {
    calendarIcon: 'Open calendar',
    prevMonthButton: 'Previous month',
    nextMonthButton: 'Next month',
    datePickerDialog: 'Date picker',
    selectedLabel: 'Selected',
  },
  placeholder: 'Select a date',
  invalidDateErrorMessage: 'Enter a valid date',
}

const MODES: { id: DateMode; title: string; body: string }[] = [
  {
    id: 'calendar',
    title: 'Place on the Spring 2027 calendar',
    body: 'Each item keeps its week of term and weekday. Spring break is skipped, so later weeks move one week on.',
  },
  {
    id: 'clear',
    title: 'Clear all dates and set them later',
    body: 'Items are copied with no dates. Nothing shows as due or missing until you set dates.',
  },
]

// The due time in UTC. Hovering or focusing it shows the same moment in the viewer's own time zone.
function TimeLabel({ date, time }: { date: Date; time: string }) {
  return (
    <Tooltip renderTip={`In your time zone: ${localLabel(date, time)}`} placement="top start">
      <span tabIndex={0} style={{ display: 'inline-block' }}>
        <Text size="small" color="secondary">{utcLabel(date, time)}</Text>
      </span>
    </Tooltip>
  )
}

export default function FixDatesStep({
  state, setState, todoCount, onToggleTodo,
}: {
  state: FixDatesState
  setState: (s: FixDatesState) => void
  // The to-do list so far, which opens beside the page.
  todoCount: number
  onToggleTodo: () => void
}) {
  const t = useSurfaceTokens()
  const card = useAppThemeKey() !== 'legacy'
  const cardStyle = card
    ? { background: t.containerColor, borderRadius: t.radiusCardMd, boxShadow: t.shadowResting, padding: t.space.lg }
    : undefined

  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const infos = DATE_ITEMS.map((item) => rowInfo(item, state))
  const clear = state.mode === 'clear'
  // Items still on a non-teaching day. A fixed item moves to a teaching day, so it no longer counts.
  const closedCount = infos.filter((r) => !clear && r.finalClosed !== null).length
  const open = infos.filter((r) => r.needsDecision && !r.choice)
  // Items still on a non-teaching day. A fixed item moves to a teaching day, so it no longer counts.

  const setRow = (id: string, choice: DateChoice, custom = state.rows[id]?.custom ?? '') =>
    setState({ ...state, rows: { ...state.rows, [id]: { choice, custom } } })
  // Every item that lands on a non-teaching day follows this choice. "None selected" takes the choice back. Dates changed
  // by hand are left alone.
  const applyFixAll = (fixAll: '' | 'before' | 'after') => {
    const next = { ...state.rows }
    for (const r of infos) {
      if (!r.closed || next[r.item.id]?.choice === 'custom') continue
      if (fixAll === '') delete next[r.item.id]
      else next[r.item.id] = { choice: fixAll, custom: '' }
    }
    setState({ ...state, fixAll, rows: next })
  }
  const setMode = (mode: DateMode) => setState({ ...state, mode, fixAll: '', rows: {} })

  // Fixes every item that is still on a non-teaching day in one go. It sits in the card of the way dates move.
  const fixAll = infos.some((r) => r.closed) ? (
    <div style={{ width: FIELD_WIDTH, maxWidth: '100%', flex: '0 0 auto' }}>
        <SimpleSelect
          renderLabel={<Text weight="bold">Fix non-teaching days</Text>}
          value={state.fixAll}
          onChange={(_e, { value }) => applyFixAll(value as '' | 'before' | 'after')}
        >
          {/* "None selected" is the base state. Going back to it takes the choice back for every item it moved. */}
          <SimpleSelect.Option id="fix-all-none" value="">None selected</SimpleSelect.Option>
          <SimpleSelect.Option id="fix-all-before" value="before">Move to the previous teaching day</SimpleSelect.Option>
          <SimpleSelect.Option id="fix-all-after" value="after">Move to the next teaching day</SimpleSelect.Option>
        </SimpleSelect>
    </div>
  ) : null

  // The first day of the course, in the card of the calendar placement.
  const startField = (
    <div style={{ width: FIELD_WIDTH, maxWidth: '100%', flex: '0 0 auto' }}>
          <DateInput
            {...dateFieldProps}
            width="100%"
            renderLabel={<Text weight="bold">First day of the course</Text>}
            value={state.startText}
            onChange={(_e, v) => setState({ ...state, startText: v, fixAll: '', rows: {} })}
            messages={parseStart(state.startText) ? [] : [{ type: 'newError', text: 'Enter a valid date' }]}
          />
    </div>
  )

  const modeCard = (m: (typeof MODES)[number]) => {
    const on = state.mode === m.id
    return (
      <div
        key={m.id}
        onClick={() => setMode(m.id)}
        style={{
          flex: '1 1 16rem',
          minWidth: 0,
          boxSizing: 'border-box',
          cursor: 'pointer',
          padding: t.space.lg,
          borderRadius: t.radiusCardMd,
          background: t.containerColor,
          boxShadow: t.shadowResting,
          border: `${on ? '0.125rem' : t.borderWidth} solid ${on ? t.linkColor : t.borderColor}`,
        }}
      >
        <RadioInput
          name="date-mode"
          value={m.id}
          checked={on}
          onChange={() => setMode(m.id)}
          label={
            <span style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
              <Text weight="bold">{m.title}</Text>
                            <Text as="div" color="secondary">{m.body}</Text>
            </span>
          }
        />
        {on && m.id === 'clear' && (
          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: t.space.lg }}>
            <FigmaAlert variant="info" type="inline">
              All due, available and event dates are cleared. Items are copied with no date, and each one is listed on the course Settings page until you set it.
            </FigmaAlert>
          </div>
        )}
        {on && m.id === 'calendar' && (
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: t.space.md, marginTop: t.space.lg }}>
            {startField}
            {fixAll}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.xl }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button renderIcon={<IconAssignmentLine />} onClick={onToggleTodo}>To-do list ({todoCount})</Button>
        </div>
        <div role="radiogroup" aria-label="How dates move" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: t.space.lg }}>
          {MODES.map(modeCard)}
        </div>

      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.md }}>
        <style>{`
          .dates-table table { table-layout: fixed; width: 100%; }
          .dates-table th:nth-child(1) { width: 30%; }
          .dates-table th:nth-child(2), .dates-table th:nth-child(3), .dates-table th:nth-child(4) { width: 23.3333%; }
          .dates-clear th:nth-child(1) { width: 40%; }
          .dates-clear th:nth-child(2) { width: 25%; }
          .dates-clear th:nth-child(3) { width: 35%; }
        `}</style>
        <div className={clear ? 'dates-table dates-clear' : 'dates-table'} style={cardStyle}>
          {/* The summary and the fix-all choice are part of the card. */}
          {/* Card title and description, with the spacing of the other cards. */}
          <div style={{ marginBottom: t.space.lg, display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
            <Text as="div" weight="bold" size="large">Dates</Text>
            <Text as="div" color="secondary" aria-live="polite">
              {clear
                ? `${infos.length} dates cleared · set them after the copy`
                : `${infos.length} dates to review · ${closedCount === 0 ? 'all on teaching days' : `${closedCount} on a non-teaching day · ${open.length} still to fix`}`}
            </Text>
          </div>
          <Table caption={() => 'Dates of the items to copy'} themeOverride={noFill}>
            <Table.Head themeOverride={noFill}>
              <Table.Row themeOverride={noFill}>
                <Table.ColHeader themeOverride={noFill} id="item">Item</Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="fall">Fall 2026</Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="check">Check</Table.ColHeader>
                {!clear && <Table.ColHeader themeOverride={noFill} id="choice">Fixed date</Table.ColHeader>}
              </Table.Row>
            </Table.Head>
            <Table.Body themeOverride={noFill}>
              {infos.map((r) => {
                return (
                  <Table.Row themeOverride={noFill} key={r.item.id}>
                    <Table.Cell themeOverride={noFill}>
                      <Text as="div" weight="bold">{r.item.title}</Text>
                      <Text as="div" size="small" color="secondary">{r.item.kind} · {r.item.module}</Text>
                    </Table.Cell>
                    <Table.Cell themeOverride={noFill}>
                      <Text as="div">{fmtShort(r.item.old)}</Text>
                      <TimeLabel date={r.item.old} time={timeOf(r.item)} />
                    </Table.Cell>
                    <Table.Cell themeOverride={noFill}>
                      {clear ? (
                        <StatusPill size="sm" color="info">Set it later</StatusPill>
                      ) : r.closed ? (
                        // The problem stays on the row after it is fixed, so the check always says what was wrong.
                        <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
                          <div>
                            {r.finalClosed ? (
                              <StatusPill size="sm" color="warning">Non-teaching day</StatusPill>
                            ) : (
                              <StatusPill size="sm" color="success">Fixed</StatusPill>
                            )}
                          </div>
                          <Text as="div" weight="bold">
                            {r.finalClosed ? 'Lands on' : 'Landed on'} {r.closed}{r.closed.startsWith('a ') ? ', which is a non-teaching day.' : ', a non-teaching day.'}
                          </Text>
                        </div>
                      ) : (
                        <StatusPill size="sm" color="success">Teaching day</StatusPill>
                      )}
                    </Table.Cell>
                    {!clear && (
                      <Table.Cell themeOverride={noFill}>
                        {/* The date the item ends up on. The calendar button changes it by hand. */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: t.space.sm }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {r.needsDecision && !r.choice ? (
                              <Text color="secondary">Not fixed yet</Text>
                            ) : (
                              <>
                                <Text as="div" weight="bold">{r.final ? fmtShort(r.final) : ''}</Text>
                                {r.final && <TimeLabel date={r.final} time={timeOf(r.item)} />}
                                {r.choice?.choice === 'custom' && (
                                  <Text as="div" size="small" color="secondary">Changed by you</Text>
                                )}
                              </>
                            )}
                          </div>
                          {/* A check mark when the date is fixed, an alert while it still lands on a non-teaching day. */}
                          {r.final && (
                            <Tooltip
                              renderTip={
                                r.finalClosed
                                  ? 'Not fixed yet. This date is on a non-teaching day.'
                                  : r.closed
                                    ? 'Fixed. The date moved to a teaching day.'
                                    : 'Nothing to fix. This date is on a teaching day.'
                              }
                              placement="top"
                            >
                              <span
                                tabIndex={0}
                                role="img"
                                aria-label={r.finalClosed ? 'Not fixed yet' : 'Fixed'}
                                style={{ display: 'inline-flex', paddingBlockStart: '0.25rem', color: r.finalClosed ? t.warningTextColor : t.successTextColor }}
                              >
                                {r.finalClosed ? <CircleAlertInstUIIcon /> : <CircleCheckInstUIIcon />}
                              </span>
                            </Tooltip>
                          )}
                          <DatePickerButton
                            value={iso(r.final ?? r.base)}
                            label={`Change the date of ${r.item.title}`}
                            onPick={(d) => setRow(r.item.id, 'custom', d)}
                          />
                        </div>
                      </Table.Cell>
                    )}
                  </Table.Row>
                )
              })}
              {/* Items with no due date: they stay empty, take the last day of the course, or get a date picked by hand. */}
              {!clear &&
                NO_DATE_ITEMS.map((item) => {
                  const pick: NoDateChoice = state.noDate[item.id] ?? 'empty'
                  const date = pick === 'empty' ? null : pick === 'last' ? lastDayOf(state) : new Date(`${pick}T12:00:00`)
                  return (
                    <Table.Row themeOverride={noFill} key={item.id}>
                      <Table.Cell themeOverride={noFill}>
                        <Text as="div" weight="bold">{item.title}</Text>
                        <Text as="div" size="small" color="secondary">{item.kind} · {item.module}</Text>
                      </Table.Cell>
                      <Table.Cell themeOverride={noFill}>No date</Table.Cell>
                      <Table.Cell themeOverride={noFill}>
                        <StatusPill size="sm" color="info">No due date</StatusPill>
                      </Table.Cell>
                      <Table.Cell themeOverride={noFill}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: t.space.sm }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {date ? (
                              <>
                                <Text as="div" weight="bold">{fmtShort(date)}</Text>
                                {pick === 'last' && <Text as="div" size="small" color="secondary">Last day of the course</Text>}
                                {pick !== 'last' && <Text as="div" size="small" color="secondary">Set by you</Text>}
                              </>
                            ) : (
                              <Text color="secondary">No date</Text>
                            )}
                          </div>
                          <Tooltip renderTip={date ? 'Dated. This item now has a due date.' : 'No date yet. Set one later, or pick a date.'} placement="top">
                            <span
                              tabIndex={0}
                              role="img"
                              aria-label={date ? 'Dated' : 'No date yet'}
                              style={{ display: 'inline-flex', paddingBlockStart: '0.25rem', color: date ? t.successTextColor : t.warningTextColor }}
                            >
                              {date ? <CircleCheckInstUIIcon /> : <CircleAlertInstUIIcon />}
                            </span>
                          </Tooltip>
                          <DatePickerButton
                            value={iso(date ?? lastDayOf(state))}
                            label={`Set the date of ${item.title}`}
                            onPick={(d) => setState({ ...state, noDate: { ...state.noDate, [item.id]: d } })}
                          />
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
            </Table.Body>
          </Table>
        </div>
      </div>
    </div>
  )
}

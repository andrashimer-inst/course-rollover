import {
  Button,
  DateInput,
  RadioInput,
  ScreenReaderContent,
  SimpleSelect,
  Table,
  Text,
} from '@instructure/ui/v11_7'
import FigmaAlert from './FigmaAlert'
import StatusPill from './StatusPill'
import { DATE_ITEMS, fmtShort, parseStart, rowInfo } from './fixDatesData'
import type { DateChoice, DateMode, DateRowInfo, FixDatesState } from './fixDatesData'
import { useAppThemeKey, useSurfaceTokens } from './appTheme'

// Step 4 of the copy wizard: fix the dates. The teacher chooses how dates move to the new term, and each item that
// lands on a closed day (like Presidents' Day) gets a suggestion and a choice: move it before the
// holiday or after it. Items on a teaching day are done from the start, and any date can be changed by hand.

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
  invalidDateErrorMessage: 'Enter a valid date',
}

const MODES: { id: DateMode; title: string; body: string }[] = [
  {
    id: 'calendar',
    title: 'Place on the Spring 2027 calendar',
    body: 'Each item keeps its week of term and weekday. Spring break is skipped, so later weeks move one week on.',
  },
  {
    id: 'start',
    title: 'Start on a different date',
    body: 'For a course that runs on its own schedule, such as a late-start or short course. Pick the first day.',
  },
  {
    id: 'clear',
    title: 'Clear all dates and set them later',
    body: 'Items come over with no dates. Nothing shows as due or missing until you set dates.',
  },
]

export default function FixDatesStep({ state, setState }: { state: FixDatesState; setState: (s: FixDatesState) => void }) {
  const t = useSurfaceTokens()
  const card = useAppThemeKey() !== 'legacy'
  const cardStyle = card
    ? { background: t.containerColor, borderRadius: t.radiusCardMd, boxShadow: t.shadowResting, padding: t.space.lg }
    : undefined

  const infos = DATE_ITEMS.map((item) => rowInfo(item, state))
  const clear = state.mode === 'clear'
  const open = infos.filter((r) => r.needsDecision && !r.choice)
  // Items still on a non-teaching day. A fixed item moves to a teaching day, so it no longer counts.
  const closedCount = infos.filter((r) => !clear && r.finalClosed !== null).length

  const setRow = (id: string, choice: DateChoice, custom = state.rows[id]?.custom ?? '') =>
    setState({ ...state, rows: { ...state.rows, [id]: { choice, custom } } })
  const applyToOpen = (choice: DateChoice) => {
    const next = { ...state.rows }
    for (const r of open) next[r.item.id] = { choice, custom: '' }
    setState({ ...state, rows: next })
  }
  const setMode = (mode: DateMode) => setState({ ...state, mode, rows: {} })

  // The Check column shows when an item is done, so the choice has no check mark of its own.
  const chooser = (label: string, value: string | undefined, options: { id: string; label: string }[], onPick: (id: string) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: t.space.sm }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <SimpleSelect
          renderLabel={<ScreenReaderContent>{label}</ScreenReaderContent>}
          placeholder="Choose what to do"
          value={value ?? ''}
          onChange={(_e, { value: v }) => v !== '' && onPick(String(v))}
        >
          {!value && <SimpleSelect.Option id={`${label}-none`} value="">Choose what to do</SimpleSelect.Option>}
          {options.map((o) => (
            <SimpleSelect.Option key={o.id} id={`${label}-${o.id}`} value={o.id}>{o.label}</SimpleSelect.Option>
          ))}
        </SimpleSelect>
      </div>
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
            <span style={{ display: 'block' }}>
              <Text weight="bold">{m.title}</Text>
                            <Text as="div" color="secondary">{m.body}</Text>
            </span>
          }
        />
      </div>
    )
  }

  // Weekend days are named like "a Saturday"; holidays have a name of their own.
  const weekend = (r: DateRowInfo) => !!r.closed?.startsWith('a ')
  const dateOptions = (r: DateRowInfo) => {
    // An item on a non-teaching day cannot stay there, so "keep" is only offered for teaching days.
    const opts: { id: string; label: string }[] = r.closed ? [] : [{ id: 'keep', label: `Use ${fmtShort(r.base)}` }]
    if (r.closed) {
      opts.push(
        { id: 'before', label: `${weekend(r) ? 'Move to the previous teaching day' : r.closed === 'Spring break' ? 'Move before spring break' : 'Move before the holiday'}: ${fmtShort(r.before)}` },
        { id: 'after', label: `${weekend(r) ? 'Move to the next teaching day' : r.closed === 'Spring break' ? 'Move after spring break' : 'Move after the holiday'}: ${fmtShort(r.after)}` },
      )
    }
    opts.push({ id: 'custom', label: 'Pick another date' })
    return opts
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.xl }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
        <Text weight="bold">How dates move</Text>
        <div role="radiogroup" aria-label="How dates move" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: t.space.lg }}>
          {MODES.map(modeCard)}
        </div>

        {state.mode === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
            <DateInput
              {...dateFieldProps}
              width="14rem"
              renderLabel="First day of the course"
              value={state.startText}
              onChange={(_e, v) => setState({ ...state, startText: v, rows: {} })}
              messages={parseStart(state.startText) ? [] : [{ type: 'newError', text: 'Enter a valid date' }]}
            />
            <Text color="secondary">
              Week 1 of the course starts in the week of this date. Each item keeps its week and weekday. Non-teaching days are still checked.
            </Text>
          </div>
        )}
        {clear && (
          <FigmaAlert variant="info" type="inline">
            All due, available and event dates are cleared. Items come over with no date, and each one is listed on the course Settings page until you set it.
          </FigmaAlert>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.md }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'center', justifyContent: 'space-between' }}>
          <Text color="secondary" aria-live="polite">
            {clear
              ? `${infos.length} items will have no date until you set one`
              : `${infos.length} dated items · ${closedCount === 0 ? 'all on teaching days' : `${closedCount} land on a non-teaching day`}${closedCount > 0 ? ` · ${open.length} still to decide` : ''}`}
          </Text>
          {!clear && closedCount > 0 && (
            <div role="group" aria-label="Fix all" style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.sm }}>
              <Button size="small" interaction={open.length ? 'enabled' : 'disabled'} onClick={() => applyToOpen('before')}>
                Move {open.length} before the holiday
              </Button>
              <Button size="small" interaction={open.length ? 'enabled' : 'disabled'} onClick={() => applyToOpen('after')}>
                Move {open.length} to the next teaching day
              </Button>
            </div>
          )}
        </div>

        <style>{`
          .dates-table table { table-layout: fixed; width: 100%; }
          .dates-table th:nth-child(1) { width: 19%; }
          .dates-table th:nth-child(2) { width: 12%; }
          .dates-table th:nth-child(3) { width: 13%; }
          .dates-table th:nth-child(4) { width: 28%; }
          .dates-table th:nth-child(5) { width: 28%; }
          .dates-clear th:nth-child(1) { width: 34%; }
          .dates-clear th:nth-child(2) { width: 22%; }
          .dates-clear th:nth-child(3) { width: 22%; }
          .dates-clear th:nth-child(4) { width: 22%; }
        `}</style>
        <div className={clear ? 'dates-table dates-clear' : 'dates-table'} style={cardStyle}>
          <Table caption={() => 'Dates of the items that come over'} themeOverride={noFill}>
            <Table.Head themeOverride={noFill}>
              <Table.Row themeOverride={noFill}>
                <Table.ColHeader themeOverride={noFill} id="item">Item</Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="fall">Fall 2026</Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="spring">Spring 2027</Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="check">Check</Table.ColHeader>
                {!clear && <Table.ColHeader themeOverride={noFill} id="choice">Your choice</Table.ColHeader>}
              </Table.Row>
            </Table.Head>
            <Table.Body themeOverride={noFill}>
              {infos.map((r) => {
                const choice = r.choice?.choice ?? (r.closed ? undefined : 'keep')
                return (
                  <Table.Row themeOverride={noFill} key={r.item.id}>
                    <Table.Cell themeOverride={noFill}>
                      <Text as="div" weight="bold">{r.item.title}</Text>
                      <Text as="div" size="small" color="secondary">{r.item.kind} · {r.item.module}</Text>
                    </Table.Cell>
                    <Table.Cell themeOverride={noFill}>{fmtShort(r.item.old)}</Table.Cell>
                    <Table.Cell themeOverride={noFill}>
                      {clear || !r.final ? (
                        <Text weight="bold">No date</Text>
                      ) : (
                        <>
                          <Text as="div" weight="bold">{fmtShort(r.final)}</Text>
                          {r.final.toDateString() !== r.base.toDateString() && (
                            <Text as="div" size="small" color="secondary">Moved from {fmtShort(r.base)}</Text>
                          )}
                        </>
                      )}
                    </Table.Cell>
                    <Table.Cell themeOverride={noFill}>
                      {clear ? (
                        <StatusPill size="sm" color="info">Set it later</StatusPill>
                      ) : r.finalClosed ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
                          <div><StatusPill size="sm" color="warning">Non-teaching day</StatusPill></div>
                          <Text as="div" weight="bold">
                            {r.finalClosed.startsWith('a ') ? `Lands on ${r.finalClosed}, which is a non-teaching day.` : `Lands on ${r.finalClosed}, a non-teaching day.`}
                          </Text>
                          <Text as="div" size="small" color="secondary">
                            Why it matters: students cannot take part, and Canvas treats the day as closed.
                          </Text>
                        </div>
                      ) : (
                        <StatusPill size="sm" color="success">Teaching day</StatusPill>
                      )}
                    </Table.Cell>
                    {!clear && (
                    <Table.Cell themeOverride={noFill}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
                          {chooser(`Date for ${r.item.title}`, choice, dateOptions(r), (id) => setRow(r.item.id, id as DateChoice))}
                          {r.choice?.choice === 'custom' && (
                            <DateInput
                              {...dateFieldProps}
                              width="100%"
                              renderLabel={<ScreenReaderContent>Another date for {r.item.title}</ScreenReaderContent>}
                              value={r.choice.custom}
                              onChange={(_e, v) => setRow(r.item.id, 'custom', v)}
                              messages={r.customProblem ? [{ type: 'newError', text: r.customProblem }] : []}
                            />
                          )}
                      </div>
                    </Table.Cell>
                    )}
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

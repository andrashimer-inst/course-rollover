import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Checkbox, DateInput, IconArrowOpenDownSolid, IconArrowOpenEndSolid, IconArrowOpenUpSolid, IconAssignmentLine, SimpleSelect, Tabs, RadioInput, Text } from '@instructure/ui/v11_7'
import StatusPill from './StatusPill'
import ReadinessLoading from './ReadinessLoading'
import { CoursePreview } from './ContentStep'
import { CONTENT_TYPES, MODULE_ENTRIES } from './courseContentData'
import type { CopyMode, Picked, Scope } from './contentHelpers'
import { STATUS_LABEL, dimensionsOf, openingLabel, readiness } from './reviewCopyData'
import type { Opening } from './reviewCopyData'
import type { ReadyStatus } from './reviewCopyData'
import { choiceLabel, choiceOf, hiddenModules, itemIdOf } from './reviewData'
import type { Choice, DupeChoice, ReviewRow } from './reviewData'
import { DATE_ITEMS, rowInfo } from './fixDatesData'
import type { FixDatesState } from './fixDatesData'
import { useAppThemeKey, useSurfaceTokens } from './appTheme'

// Step 5 of the copy wizard: review and copy. Before the copy runs, the teacher can run the course readiness check,
// see a final preview of the modules with a note on what the choices changed, and choose when students see the
// course. The copy itself starts from this step. The to-do list comes with the summary afterwards.

const STATUS_PILL: Record<ReadyStatus, 'success' | 'warning' | 'error'> = {
  pass: 'success',
  fixed: 'success',
  later: 'warning',
  manual: 'error',
}

// The viewer's own time zone, like "GMT+2". The publish time is always in it.
const LOCAL_ZONE = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? 'your time zone'

// Every half hour of the day, for the publish time.
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? 0 : 30
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const label = new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return { value, label }
})

const MODULES = CONTENT_TYPES.find((c) => c.id === 'modules')!.items

export default function ReviewAndCopyStep({
  rows, choices, offRules, scope, mode, picked, dupes, dates, readyRan, setReadyRan, opening, setOpening, todoCount, onToggleTodo,
}: {
  rows: ReviewRow[]
  choices: Record<string, Choice>
  // The rules the educator switched off in the review step.
  offRules: string[]
  scope: Scope
  mode: CopyMode
  picked: Picked
  dupes: Record<string, DupeChoice>
  dates: FixDatesState
  readyRan: boolean
  setReadyRan: (v: boolean) => void
  opening: Opening
  setOpening: (o: Opening) => void
  // The to-do list so far, which opens beside the page.
  todoCount: number
  onToggleTodo: () => void
}) {
  const t = useSurfaceTokens()
  const card = useAppThemeKey() !== 'legacy'
  const cardStyle = card
    ? { background: t.containerColor, borderRadius: t.radiusCardMd, boxShadow: t.shadowResting, padding: t.space.lg }
    : undefined

  const [tab, setTab] = useState(0)
  // The groups of the learning objects tab open and close like an accordion. They start open.
  const [closedGroups, setClosedGroups] = useState<string[]>([])
  const ready = useMemo(() => readiness(rows, choices, offRules), [rows, choices, offRules])
  const groups = useMemo(() => dimensionsOf(ready), [ready])

  // The readiness check goes through one area at a time. It can take a while, so each area shows its own progress.
  const [running, setRunning] = useState(false)
  const run = () => {
    setReadyRan(false)
    setRunning(true)
  }

  // The check starts by itself when the step opens, unless it already ran.
  useEffect(() => {
    if (!readyRan) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  // What the choices of steps 2 and 3 changed, for the notes and the preview.
  const leftOut = rows.filter((r) => !r.extra && choiceOf(r, choices) === 'leave')
  const aiFixed = rows.filter((r) => ['aifix', 'aicheck'].includes(choiceOf(r, choices) as string))
  const fixLater = rows.filter((r) => choiceOf(r, choices) === 'fix')
  const moduleIds = scope === 'whole' ? MODULES.map((m) => m.id) : MODULES.filter((m) => picked[m.id]).map((m) => m.id)
  const merging = scope === 'part' && mode === 'merge'
  const movedDates = DATE_ITEMS.filter((item) => {
    const info = rowInfo(item, dates)
    return info.final && info.final.toDateString() !== info.base.toDateString()
  }).length

  // A summary of the choices made, one line for each area.
  const changes: string[] = [
    scope === 'whole'
      ? `Scope: the whole course (${MODULES.length} modules and all learning objects). It replaces the content copied here before. Content you added yourself stays.`
      : `Scope: ${moduleIds.length} of ${MODULES.length} modules. ${merging ? 'They are added to the content in the course now.' : 'They replace the content copied here before. Content you added yourself stays.'}`,
    leftOut.length ? `Left out: ${leftOut.length} ${leftOut.length === 1 ? 'item' : 'items'} (${leftOut.map((r) => r.title).join(', ')}).` : 'Left out: nothing.',
    aiFixed.length ? `AI fixes: ${aiFixed.length} applied during the copy.` : 'AI fixes: none applied.',
    fixLater.length ? `To fix after the copy: ${fixLater.length} ${fixLater.length === 1 ? 'item' : 'items'}, on your to-do list.` : 'To fix after the copy: nothing.',
    dates.mode === 'clear'
      ? 'Dates: cleared. Set them after the copy.'
      : `Dates: moved to the new term${movedDates ? `, ${movedDates} changed by you` : ''}.`,
    opening.mode === 'open'
      ? `Publishing: ${openingLabel(opening)}${opening.hold ? ', unless a required check still fails that day' : ''}.`
      : 'Publishing: manual. The course stays unpublished until you publish it.',
  ]

  // Each item shows the decision made for it in the review, the same pills as in the learning object review.
  // The learning objects copied on their own (not in a module), grouped by type, with the decisions made for each.
  const inModule = new Set(Object.values(MODULE_ENTRIES).flatMap((es) => es.map((e) => e.itemId)))
  const pillColor = (c: Choice) => (c === 'aifix' || c === 'aicheck' ? 'ai' : c === 'fix' ? 'warning' : c === 'leave' ? 'error' : 'success') as 'ai' | 'warning' | 'error' | 'success'
  const objectItems = [...new Set(rows.filter((r) => !r.courseWide && !inModule.has(itemIdOf(r))).map((r) => itemIdOf(r)))].map((id) => {
    const own = rows.filter((r) => itemIdOf(r) === id)
    const first = own[0]
    const decisions = own
      .map((r) => choiceOf(r, choices))
      .filter((c): c is Choice => c !== undefined)
      .filter((c, n, all) => all.indexOf(c) === n)
      .map((c) => ({ label: choiceLabel(first, c), color: pillColor(c) }))
    return { id, title: first.title, kind: first.kindLabel, group: first.group, decisions, left: decisions.some((d) => d.color === 'error') }
  })
  const objectCopied = objectItems.filter((i) => !i.left).length
  const objectGroups = [...new Set(objectItems.map((i) => i.group))].map((g) => [g, objectItems.filter((i) => i.group === g)] as const)

  const noteFor = (itemId: string): ReactNode => {
    const row = rows.find((r) => r.id === itemId)
    const c = row ? choiceOf(row, choices) : undefined
    if (!row || !c) return null
    return (
      <StatusPill size="xs" color={c === 'aifix' || c === 'aicheck' ? 'ai' : c === 'fix' ? 'warning' : c === 'leave' ? 'error' : 'success'}>
        {choiceLabel(row, c)}
      </StatusPill>
    )
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.xxl }}>
      <Tabs onRequestTabChange={(_e, { index }) => setTab(index)}>
        <Tabs.Panel id="tab-ready" renderTitle="Course readiness check" isSelected={tab === 0} padding="general.spaceXl 0 0 0">
          <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
            {/* The to-do list button stays on top of the card, under the tabs. */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button renderIcon={<IconAssignmentLine />} onClick={onToggleTodo}>To-do list ({todoCount})</Button>
            </div>
          <div style={cardStyle}>
            {/* Card title and description, with the run button at the end of the row. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
                <Text as="div" weight="bold" size="large">Course readiness check</Text>
                <Text as="div" color="secondary">The check uses the course design rules and your choices in the review.</Text>
              </div>
              <Button color={readyRan ? 'secondary' : 'primary'} interaction={running ? 'disabled' : 'enabled'} onClick={run}>
                {running ? 'Checking…' : readyRan ? 'Run again' : 'Run readiness check'}
              </Button>
            </div>
            <div style={{ marginTop: t.space.lg }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
                {running && (
                  <ReadinessLoading areas={groups.map((g) => g.dimension)} onDone={() => { setRunning(false); setReadyRan(true) }} />
                )}
                {readyRan && !running && (
                  <div>
                    {groups.map((g) => (
                      <div key={g.dimension} style={{ marginTop: t.space.lg }}>
                        <div style={{ background: t.pageColor, padding: t.space.md }}>
                          <Text weight="bold">{g.dimension}</Text>
                        </div>
                        {g.rules.map((x) => (
                          <div
                            key={x.rule.id}
                            style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'center', justifyContent: 'space-between', padding: t.space.md, borderTop: `${t.borderWidth} solid ${t.borderColor}` }}
                          >
                            <div style={{ flex: '1 1 20rem', minWidth: 0 }}>
                              <Text as="div" weight="bold">{x.rule.title}</Text>
                              <Text as="div" color="secondary">{x.note}</Text>
                            </div>
                            <StatusPill size="sm" color={STATUS_PILL[x.status]}>{STATUS_LABEL[x.status]}</StatusPill>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {!running && !readyRan && (
                  <Text color="secondary">Run the readiness check to see whether the course is ready for students, based on the choices you made. The check is optional.</Text>
                )}
              </div>
            </div>
          </div>
          </div>
        </Tabs.Panel>
        <Tabs.Panel id="tab-final" renderTitle="Course preview" isSelected={tab === 1} padding="general.spaceXl 0 0 0">
          <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
                <Text as="div" weight="bold" size="large">Copy overview</Text>
                <Text as="div" color="secondary">A summary of the choices you made in this copy.</Text>
              </div>
              <ul style={{ margin: `${t.space.lg} 0 0`, paddingInlineStart: '1.25rem' }}>
                {changes.map((c) => (
                  <li key={c}><Text>{c}</Text></li>
                ))}
              </ul>
            </div>
            <CoursePreview
              title="Preview"
              moduleIds={moduleIds}
              keepCurrent={merging}
              highlightNew
              hidden={hiddenModules(dupes)}
              noteFor={noteFor}
            />
          </div>
        </Tabs.Panel>
        <Tabs.Panel id="tab-objects" renderTitle="Learning objects" isSelected={tab === 2} padding="general.spaceXl 0 0 0">
          {/* The learning objects that are copied on their own, outside modules, with the decision made for each in the review. */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
                <Text as="div" weight="bold" size="large">Learning objects</Text>
                <Text as="div" color="secondary">
                  {objectCopied} of {objectItems.length} learning objects will be copied.
                </Text>
              </div>
              {objectGroups.length > 0 && (() => {
                const names = objectGroups.map(([g]) => g)
                const allClosed = names.every((g) => closedGroups.includes(g))
                return (
                  <Button
                    size="small"
                    renderIcon={allClosed ? <IconArrowOpenDownSolid /> : <IconArrowOpenUpSolid />}
                    onClick={() => setClosedGroups(allClosed ? [] : names)}
                  >
                    {allClosed ? 'Expand all' : 'Collapse all'}
                  </Button>
                )
              })()}
            </div>
            {objectGroups.length === 0 ? (
              <Text as="p" color="secondary">No learning objects are copied on their own.</Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg, marginTop: t.space.lg }}>
                {objectGroups.map(([group, list]) => {
                  const closed = closedGroups.includes(group)
                  return (
                    <div key={group} style={{ border: `${t.borderWidth} solid ${t.borderColor}`, borderRadius: t.radiusMd, overflow: 'hidden' }}>
                      <button
                        type="button"
                        aria-expanded={!closed}
                        onClick={() => setClosedGroups(closed ? closedGroups.filter((g) => g !== group) : [...closedGroups, group])}
                        style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: t.space.sm, padding: t.space.md, background: t.pageColor, color: t.textColor }}
                      >
                        <span aria-hidden="true" style={{ display: 'inline-flex' }}>
                          {closed ? <IconArrowOpenEndSolid /> : <IconArrowOpenDownSolid />}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}><Text weight="bold">{group}</Text></span>
                        <Text size="small" color="secondary">{list.filter((i) => !i.left).length} of {list.length} copied</Text>
                      </button>
                      {!closed &&
                        list.map((i) => (
                          <div
                            key={i.id}
                            style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'center', justifyContent: 'space-between', padding: t.space.md, borderTop: `${t.borderWidth} solid ${t.borderColor}` }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <Text as="div" weight="bold">{i.title}</Text>
                              <Text as="div" size="small" color="secondary">{i.kind}</Text>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.sm }}>
                              {i.decisions.map((d) => (
                                <StatusPill key={d.label} size="xs" color={d.color}>{d.label}</StatusPill>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Tabs.Panel>
        <Tabs.Panel id="tab-open" renderTitle="Course publish" isSelected={tab === 3} padding="general.spaceXl 0 0 0">
          <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
            <div role="radiogroup" aria-label="Course publish" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: t.space.lg }}>
              {([
                ['open', `Publish on ${openingLabel(opening)}`, 'Publishes on the term start date. Hidden from students until then.'],
                ['self', 'Publish manually', 'The course stays hidden until you publish it.'],
              ] as const).map(([id, title, body]) => {
                const on = opening.mode === id
                return (
                  <div
                    key={id}
                    onClick={() => setOpening({ ...opening, mode: id })}
                    style={{
                      flex: '1 1 18rem',
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
                      name="opening"
                      value={id}
                      checked={on}
                      onChange={() => setOpening({ ...opening, mode: id })}
                      label={
                        <span style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
                          <Text weight="bold">{title}</Text>
                          <Text as="div" color="secondary">{body}</Text>
                        </span>
                      }
                    />
                    {/* The day and time of the automatic publish, with the date field of the dates step. */}
                    {on && id === 'open' && (
                      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'flex-start', marginTop: t.space.lg }}>
                        <div style={{ width: '14rem', maxWidth: '100%' }}>
                          <DateInput
                            screenReaderLabels={{
                              calendarIcon: 'Open calendar',
                              prevMonthButton: 'Previous month',
                              nextMonthButton: 'Next month',
                              datePickerDialog: 'Date picker',
                              selectedLabel: 'Selected',
                            }}
                            width="100%"
                            placeholder="Select a date"
                            invalidDateErrorMessage="Enter a valid date"
                            renderLabel={<Text weight="bold">Publish date</Text>}
                            value={opening.date}
                            onChange={(_e, v) => setOpening({ ...opening, date: v })}
                            messages={Number.isNaN(new Date(opening.date).getTime()) ? [{ type: 'newError', text: 'Enter a valid date' }] : []}
                          />
                        </div>
                        <div style={{ width: '14rem', maxWidth: '100%' }}>
                          <SimpleSelect
                            renderLabel={<Text weight="bold">{`Publish time (${LOCAL_ZONE})`}</Text>}
                            value={opening.time}
                            onChange={(_e, { value }) => setOpening({ ...opening, time: String(value) })}
                          >
                            {TIMES.map((tm) => (
                              <SimpleSelect.Option key={tm.value} id={`publish-${tm.value}`} value={tm.value}>{tm.label}</SimpleSelect.Option>
                            ))}
                          </SimpleSelect>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <Checkbox
              label="Do not publish automatically if a required check still fails on that day"
              checked={opening.hold}
              onChange={() => setOpening({ ...opening, hold: !opening.hold })}
              disabled={opening.mode === 'self'}
            />
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}

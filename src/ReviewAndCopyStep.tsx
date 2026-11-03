import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Checkbox, IconCheckMarkSolid, RadioInput, Spinner, Text } from '@instructure/ui/v11_7'
import StatusPill from './StatusPill'
import { CoursePreview } from './ContentStep'
import { CONTENT_TYPES } from './courseContentData'
import type { CopyMode, Picked, Scope } from './contentHelpers'
import { OPENING_TIME, STATUS_LABEL, dimensionsOf, readiness } from './reviewCopyData'
import type { Opening } from './reviewCopyData'
import type { ReadyStatus } from './reviewCopyData'
import { choiceOf, hiddenModules } from './reviewData'
import type { Choice, DupeChoice, ReviewRow } from './reviewData'
import { DATE_ITEMS, rowInfo } from './fixDatesData'
import type { FixDatesState } from './fixDatesData'
import { useAppThemeKey, useSurfaceTokens } from './appTheme'

// Step 5 of the copy wizard: review and copy. Before the copy runs, the teacher can run the course readiness check,
// see a final preview of the modules with a note on what the choices changed, and choose when students see the
// course. The copy itself starts from this step. The to-do list comes with the summary afterwards.

const STEP_MS = 450

const STATUS_PILL: Record<ReadyStatus, 'success' | 'warning' | 'error'> = {
  pass: 'success',
  fixed: 'success',
  later: 'warning',
  manual: 'error',
}

const MODULES = CONTENT_TYPES.find((c) => c.id === 'modules')!.items

export default function ReviewAndCopyStep({
  rows, choices, scope, mode, picked, dupes, dates, readyRan, setReadyRan, opening, setOpening,
}: {
  rows: ReviewRow[]
  choices: Record<string, Choice>
  scope: Scope
  mode: CopyMode
  picked: Picked
  dupes: Record<string, DupeChoice>
  dates: FixDatesState
  readyRan: boolean
  setReadyRan: (v: boolean) => void
  opening: Opening
  setOpening: (o: Opening) => void
}) {
  const t = useSurfaceTokens()
  const card = useAppThemeKey() !== 'legacy'
  const cardStyle = card
    ? { background: t.containerColor, borderRadius: t.radiusCardMd, boxShadow: t.shadowResting, padding: t.space.lg }
    : undefined

  const ready = useMemo(() => readiness(rows, choices), [rows, choices])
  const groups = useMemo(() => dimensionsOf(ready), [ready])

  // The readiness check goes through one area at a time. It can take a while, so each area shows its own progress.
  const [running, setRunning] = useState(false)
  const [doneAreas, setDoneAreas] = useState(0)
  useEffect(() => {
    if (!running) return
    if (doneAreas >= groups.length) {
      const end = setTimeout(() => {
        setRunning(false)
        setReadyRan(true)
      }, 300)
      return () => clearTimeout(end)
    }
    const next = setTimeout(() => setDoneAreas((n) => n + 1), STEP_MS)
    return () => clearTimeout(next)
  }, [running, doneAreas, groups.length, setReadyRan])
  const run = () => {
    setReadyRan(false)
    setDoneAreas(0)
    setRunning(true)
  }

  const count = (s: ReadyStatus) => ready.filter((r) => r.status === s).length
  const readyCount = count('pass') + count('fixed')

  // What the choices of steps 2 and 3 changed, for the notes and the preview.
  const leftOut = rows.filter((r) => choiceOf(r, choices) === 'leave')
  const aiFixed = rows.filter((r) => choiceOf(r, choices) === 'aifix')
  const fixLater = rows.filter((r) => choiceOf(r, choices) === 'fix')
  const hiddenItems = new Set(leftOut.map((r) => r.id))
  const moduleIds = scope === 'whole' ? MODULES.map((m) => m.id) : MODULES.filter((m) => picked[m.id]).map((m) => m.id)
  const merging = scope === 'part' && mode === 'merge'
  const movedDates = DATE_ITEMS.filter((item) => {
    const info = rowInfo(item, dates)
    return info.final && info.final.toDateString() !== info.base.toDateString()
  }).length

  const changes: string[] = [
    scope === 'whole'
      ? `The whole course comes over (${MODULES.length} modules and all learning objects). It replaces what is in this course now.`
      : `Part of the course comes over: ${moduleIds.length} of ${MODULES.length} modules. It ${merging ? 'is merged with the current course' : 'replaces the current course'}.`,
    leftOut.length ? `${leftOut.length} ${leftOut.length === 1 ? 'item is' : 'items are'} left out: ${leftOut.map((r) => r.title).join(', ')}.` : 'Nothing is left out.',
    aiFixed.length ? `${aiFixed.length} AI ${aiFixed.length === 1 ? 'fix is' : 'fixes are'} applied while copying.` : 'No AI fixes are applied.',
    fixLater.length ? `${fixLater.length} ${fixLater.length === 1 ? 'item comes' : 'items come'} over as they are and ${fixLater.length === 1 ? 'is' : 'are'} on your to-do list to fix.` : 'No items are waiting to be fixed after the copy.',
    dates.mode === 'clear'
      ? 'All dates are cleared. You set them later.'
      : `Dates move to the new term${movedDates ? `, and ${movedDates} ${movedDates === 1 ? 'was' : 'were'} changed by you` : ''}.`,
    opening.mode === 'open'
      ? `Students see the course on ${OPENING_TIME}${opening.hold ? ', unless a required check still fails that day' : ''}.`
      : 'The course stays unpublished until you open it yourself.',
  ]

  const noteFor = (itemId: string): ReactNode => {
    const row = rows.find((r) => r.id === itemId)
    const c = row ? choiceOf(row, choices) : undefined
    if (c === 'aifix') return <StatusPill size="xs" color="ai">AI fix applied</StatusPill>
    if (c === 'fix') return <StatusPill size="xs" color="warning">Fix after the copy</StatusPill>
    return null
  }

  const section = (title: string, body: ReactNode, action?: ReactNode, note?: string) => (
    <section style={{ display: 'flex', flexDirection: 'column', gap: t.space.md }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Text as="div" weight="bold" size="large">{title}</Text>
          {note && <Text as="div" color="secondary">{note}</Text>}
        </div>
        {action}
      </div>
      {body}
    </section>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.xxl }}>
      {section(
        'Course readiness check',
        <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
          {running && (
            <div role="status" style={cardStyle}>
              <Text as="div" color="secondary">This can take some time. Keep this page open.</Text>
              <ul style={{ listStyle: 'none', margin: `${t.space.md} 0 0`, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))', gap: t.space.md }}>
                {groups.map((g, i) => (
                  <li key={g.dimension} style={{ display: 'flex', alignItems: 'center', gap: t.space.md, opacity: i <= doneAreas ? 1 : 0.5 }}>
                    <span style={{ display: 'inline-flex', width: '1.5rem', color: t.successTextColor }}>
                      {i < doneAreas ? <IconCheckMarkSolid /> : i === doneAreas ? <Spinner renderTitle={`Checking ${g.dimension}`} size="x-small" /> : null}
                    </span>
                    <span>
                      <Text as="div" weight="bold">{g.dimension}</Text>
                      <Text as="div" size="small" color="secondary">{i < doneAreas ? 'Checked' : i === doneAreas ? 'Checking' : 'Waiting'}</Text>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {readyRan && !running && (
            <div style={cardStyle}>
              <Text as="div" weight="bold">
                {readyCount} of {ready.length} checks are ready · {count('later')} to fix after the copy · {count('manual')} to do yourself
              </Text>
              {groups.map((g) => (
                <div key={g.dimension} style={{ marginTop: t.space.lg }}>
                  <div style={{ background: t.pageColor, padding: t.space.md }}>
                    <Text weight="bold">{g.dimension}</Text>
                  </div>
                  {g.rules.map((x) => (
                    <div
                      key={x.rule.id}
                      style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'flex-start', justifyContent: 'space-between', padding: t.space.md, borderTop: `${t.borderWidth} solid ${t.borderColor}` }}
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
            <Text color="secondary">Run the check to see how ready the course is for students, based on the choices you made. You can copy without running it.</Text>
          )}
        </div>,
        <Button color={readyRan ? 'secondary' : 'primary'} interaction={running ? 'disabled' : 'enabled'} onClick={run}>
          {running ? 'Checking…' : readyRan ? 'Run it again' : 'Run the check'}
        </Button>,
        'The check uses the course design rules and your choices in the review.',
      )}

      {section(
        'Final preview',
        <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
          <div style={cardStyle}>
            <Text as="div" weight="bold">What changed from your choices</Text>
            <ul style={{ margin: `${t.space.sm} 0 0`, paddingInlineStart: '1.25rem' }}>
              {changes.map((c) => (
                <li key={c}><Text>{c}</Text></li>
              ))}
            </ul>
          </div>
          <CoursePreview
            title="How the course will look after the copy"
            moduleIds={moduleIds}
            keepCurrent={merging}
            highlightNew={scope === 'part'}
            hidden={hiddenModules(dupes)}
            hiddenItems={hiddenItems}
            noteFor={noteFor}
          />
        </div>,
      )}

      {section(
        'When students see the course',
        <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
          <div role="radiogroup" aria-label="When students see the course" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: t.space.lg }}>
            {([
              ['open', `Open on ${OPENING_TIME}`, 'The first day of term. Students see nothing before then.'],
              ['self', 'I’ll open it myself', 'The course stays unpublished until you publish it.'],
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
                      <span style={{ display: 'block' }}>
                        <Text weight="bold">{title}</Text>
                        <Text as="div" color="secondary">{body}</Text>
                      </span>
                    }
                  />
                </div>
              )
            })}
          </div>
          <Checkbox
            label="Hold the opening if a required check still fails on that day"
            checked={opening.hold}
            onChange={() => setOpening({ ...opening, hold: !opening.hold })}
            disabled={opening.mode === 'self'}
          />
        </div>,
      )}
    </div>
  )
}

import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  Checkbox,
  CircleCheckInstUIIcon,
  IconArrowOpenDownSolid,
  IconArrowOpenEndSolid,
  ScreenReaderContent,
  SimpleSelect,
  Table,
  Tabs,
  IconButton,
  IconEmailLine,
  Text,
  Tooltip,
  View,
} from '@instructure/ui/v11_7'
import StatusPill from './StatusPill'
import AdminHelpModal from './AdminHelpModal'
import { CoursePreview } from './ContentStep'
import { CONTENT_TYPES } from './courseContentData'
import type { Picked, Scope, CopyMode } from './contentHelpers'
import { CHOICES, NOTE_LABEL, RULE_LABEL, choiceLabel, choiceOf, hiddenModules } from './reviewData'
import type { Choice, DupeChoice, ReviewRow } from './reviewData'
import { useAppThemeKey, useSurfaceTokens } from './appTheme'

// Step 3 of the copy wizard: review every learning object that comes over. Each row says what the design check
// and the teaching team found, what the AI suggests, and lets the educator choose what to do with it.
// Rows with nothing to suggest are done from the start and bring the item. Picking something marks the row done,
// and it can be changed at any time. Ticking rows opens bulk actions.

const noFill = { background: 'transparent' }
type Filter = 'all' | 'suggestion' | 'todo' | 'done'
const FILTERS: [Filter, string][] = [
  ['all', 'All items'],
  ['suggestion', 'Has a suggestion'],
  ['todo', 'Still to decide'],
  ['done', 'Done'],
]

const MODULES = CONTENT_TYPES.find((c) => c.id === 'modules')!.items

export default function LearningObjectReview({
  rows, choices, setChoices, scope, mode, picked, dupes,
}: {
  rows: ReviewRow[]
  choices: Record<string, Choice>
  setChoices: (c: Record<string, Choice>) => void
  scope: Scope
  mode: CopyMode
  picked: Picked
  dupes: Record<string, DupeChoice>
}) {
  const t = useSurfaceTokens()
  // Light and Dark put the table on a card. Legacy stays flat on the page.
  const legacy = useAppThemeKey() === 'legacy'
  const card = !legacy
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [showWhole, setShowWhole] = useState(false)
  // The row the educator is asking the admin about, and the rows already asked.
  const [helpRow, setHelpRow] = useState<ReviewRow | null>(null)
  const [asked, setAsked] = useState<string[]>([])
  // Module bars open and close like an accordion. They start open.
  const [closedGroups, setClosedGroups] = useState<string[]>([])
  const toggleGroup = (g: string) => setClosedGroups(closedGroups.includes(g) ? closedGroups.filter((x) => x !== g) : [...closedGroups, g])

  const done = (r: ReviewRow) => choiceOf(r, choices) !== undefined
  const counts = {
    all: rows.length,
    suggestion: rows.filter((r) => r.hasSuggestion).length,
    todo: rows.filter((r) => !done(r)).length,
    done: rows.filter(done).length,
  }
  const shown = rows.filter((r) => filter === 'all' || (filter === 'suggestion' && r.hasSuggestion) || (filter === 'todo' && !done(r)) || (filter === 'done' && done(r)))
  const groupsOf = (list: ReviewRow[]) => [...new Set(list.map((r) => r.group))]
  const wholeRows = shown.filter((r) => r.courseWide)
  // Actions still needed in each tab: the rows with no choice yet, whatever the filter is.
  const wholeTodo = rows.filter((r) => r.courseWide && !done(r)).length
  const moduleTodo = rows.filter((r) => !r.courseWide && !done(r)).length
  const [tab, setTab] = useState(0)
  const tabTitle = (name: string, todo: number) => `${name} (${todo})`
  const moduleRows = shown.filter((r) => !r.courseWide)

  const tally = (c: Choice) => rows.filter((r) => choiceOf(r, choices) === c).length
  // Items that come over: the learning objects, not the course-wide issues.
  const comeOver = rows.filter((r) => !r.courseWide && choiceOf(r, choices) !== undefined && choiceOf(r, choices) !== 'leave').length

  // A choice only applies to a row that offers it (course-wide rows have no "leave out", only some rows have an AI fix).
  const allowed = (r: ReviewRow, c: Choice) => (c === 'aifix' ? !!r.aiFix : r.options ? r.options.includes(c) : true)
  type Action = 'accept' | Choice
  const targetOf = (r: ReviewRow, a: Action): Choice | undefined => {
    // Accepting the suggestions only fills in the rows with no choice yet, so it never undoes a choice made before.
    const c = a === 'accept' ? (choiceOf(r, choices) === undefined ? r.ai?.choice : undefined) : a
    return c && allowed(r, c) ? c : undefined
  }
  // The ticked rows an action would still change. Rows that already have that choice are not counted.
  const pending = (a: Action) => rows.filter((r) => selected.includes(r.id) && targetOf(r, a) !== undefined && choiceOf(r, choices) !== targetOf(r, a)).length
  const run = (a: Action) => {
    const next = { ...choices }
    for (const r of rows) {
      const c = selected.includes(r.id) ? targetOf(r, a) : undefined
      if (c) next[r.id] = c
    }
    setChoices(next)
  }

  const toggle = (id: string) => setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])

  const merging = scope === 'part' && mode === 'merge'
  const moduleIds = scope === 'whole' ? MODULES.map((m) => m.id) : MODULES.filter((m) => picked[m.id]).map((m) => m.id)

  // A chosen field gets a check mark next to it. The whole row is highlighted by the table styles below.
  const chooser = (label: string, value: string | undefined, options: { id: string; label: string }[], onPick: (id: string) => void, help?: ReactNode) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: t.space.sm,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <SimpleSelect
          renderLabel={<ScreenReaderContent>{label}</ScreenReaderContent>}
          placeholder="Choose what to do"
          value={value ?? ''}
          onChange={(_e, { value: v }) => v !== '' && onPick(String(v))}
        >
          {/* Until something is chosen, the field shows a hint instead of the first option. */}
          {!value && <SimpleSelect.Option id={`${label}-none`} value="">Choose what to do</SimpleSelect.Option>}
          {options.map((o) => (
            <SimpleSelect.Option key={o.id} id={`${label}-${o.id}`} value={o.id}>{o.label}</SimpleSelect.Option>
          ))}
        </SimpleSelect>
      </div>
      {help !== undefined && <span style={{ width: '2rem', flexShrink: 0, display: 'inline-flex' }}>{help}</span>}
      <span style={{ width: '1.5rem', flexShrink: 0, color: t.successTextColor, display: 'inline-flex' }}>
        {value && (
          <span role="img" aria-label="Done"><CircleCheckInstUIIcon /></span>
        )}
      </span>
    </div>
  )

  // The table of one card. The whole course and the modules each get a card of their own.
  const reviewTable = (subset: ReviewRow[], caption: string) => {
    const allSel = subset.length > 0 && subset.every((r) => selected.includes(r.id))
    const someSel = subset.some((r) => selected.includes(r.id))
    return (
      <div
          className="review-table"
          style={
            card
              ? { background: t.containerColor, borderRadius: t.radiusCardMd, boxShadow: t.shadowResting, padding: t.space.lg }
              : undefined
          }
        >
        <Table caption={() => caption} themeOverride={noFill}>
          <Table.Head themeOverride={noFill}>
            <Table.Row themeOverride={noFill}>
              <Table.ColHeader themeOverride={noFill} id="pick">
                <Checkbox
                  label={<ScreenReaderContent>Select all shown items</ScreenReaderContent>}
                  checked={allSel}
                  indeterminate={!allSel && someSel}
                  onChange={() => setSelected(allSel ? selected.filter((s) => !subset.some((r) => r.id === s)) : [...new Set([...selected, ...subset.map((r) => r.id)])])}
                />
              </Table.ColHeader>
              <Table.ColHeader themeOverride={noFill} id="item">Item</Table.ColHeader>
              <Table.ColHeader themeOverride={noFill} id="suggestion">Suggestion</Table.ColHeader>
              <Table.ColHeader themeOverride={noFill} id="fix">Fix</Table.ColHeader>
              <Table.ColHeader themeOverride={noFill} id="choice">Your choice</Table.ColHeader>
            </Table.Row>
          </Table.Head>
          <Table.Body themeOverride={noFill}>
            {subset.length === 0 && (
              <Table.Row themeOverride={noFill}>
                <Table.Cell themeOverride={noFill} colSpan={5}>No items match this filter.</Table.Cell>
              </Table.Row>
            )}
            {groupsOf(subset).flatMap((g) => {
              const inGroup = subset.filter((r) => r.group === g)
              const all = rows.filter((r) => r.group === g)
              const coming = all.filter((r) => choiceOf(r, choices) !== 'leave').length
              return [
                <Table.Row themeOverride={noFill} key={`g-${g}`} data-group="true">
                  <Table.Cell themeOverride={noFill} colSpan={5}>
                    {/* The same module bar as the course preview: light grey, a caret, and it opens and closes the group. */}
                    <View as="div" background={legacy ? 'secondary' : undefined}>
                      <button
                        type="button"
                        aria-expanded={!closedGroups.includes(g)}
                        onClick={() => toggleGroup(g)}
                        style={{
                          all: 'unset',
                          boxSizing: 'border-box',
                          width: '100%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: t.space.sm,
                          padding: t.space.md,
                          background: legacy ? 'transparent' : t.pageColor,
                          color: t.textColor,
                        }}
                      >
                        <span aria-hidden="true" style={{ display: 'inline-flex' }}>
                          {closedGroups.includes(g) ? <IconArrowOpenEndSolid /> : <IconArrowOpenDownSolid />}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}><Text weight="bold">{g}</Text></span>
                        <Text color="secondary">{g === 'Whole course' ? `${all.length} issues across the course` : `${coming} of ${all.length} items come over`}</Text>
                      </button>
                    </View>
                  </Table.Cell>
                </Table.Row>,
                ...(closedGroups.includes(g) ? [] : inGroup).map((r) => {
                  const choice = choiceOf(r, choices)
                  return (
                    <Table.Row themeOverride={noFill} key={r.id}>
                      <Table.Cell themeOverride={noFill}>
                        <Checkbox
                          label={<ScreenReaderContent>{`Select ${r.title}`}</ScreenReaderContent>}
                          checked={selected.includes(r.id)}
                          onChange={() => toggle(r.id)}
                        />
                      </Table.Cell>
                      <Table.Cell themeOverride={noFill}>
                        <Text as="div" weight="bold">{r.title}</Text>
                        <Text as="div" size="small" color="secondary">{r.kindLabel}</Text>
                        {r.note && (
                          <Text as="div" size="small" color="primary">
                            Your team’s note: {r.note.text}
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell themeOverride={noFill}>
                        {!r.hasSuggestion ? (
                          <>
                            <Text as="div" weight="bold">Bring</Text>
                            <Text as="div" color="secondary">No change suggested.</Text>
                          </>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.md }}>
                            {r.findings.map((f) => (
                              <div key={f.rule.id + f.detail}>
                                <StatusPill size="sm" color={f.rule.severity === 'critical' ? 'error' : 'warning'}>
                                  {RULE_LABEL[f.rule.id] ?? f.rule.title}
                                </StatusPill>
                                <Text as="div" weight="bold">{f.rule.title}</Text>
                                <Text as="div">{f.detail}</Text>
                                <Text as="div" size="small" color="secondary">Why it matters: {f.rule.why}</Text>
                              </div>
                            ))}
                            {r.findings.length === 0 && r.note && (
                              <div>
                                <StatusPill size="sm" color={r.note.decision === 'copy' ? 'success' : 'warning'}>
                                  {NOTE_LABEL[r.note.id] ?? 'Flagged by your team'}
                                </StatusPill>
                                <Text as="div">{r.note.author} left a note about this last term.</Text>
                              </div>
                            )}
                          </div>
                        )}
                      </Table.Cell>
                      <Table.Cell themeOverride={noFill}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.md }}>
                          {r.aiFix && (
                            <div>
                              <StatusPill size="sm" color="ai">AI quick fix</StatusPill>
                              <Text as="div" weight="bold">{r.aiFix.what}.</Text>
                              <Text as="div" color="secondary">Suggested text: “{r.aiFix.after}”</Text>
                            </div>
                          )}
                          {/* Where an AI quick fix is offered, it replaces the AI suggestion text. */}
                        {r.ai && !r.aiFix && (
                            <div>
                              <Text as="div" weight="bold">AI suggestion: {choiceLabel(r, r.ai.choice)}.</Text>
                              <Text as="div" color="secondary">{r.ai.reason}</Text>
                            </div>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell themeOverride={noFill}>
                        {chooser(
                          `Choice for ${r.title}`,
                          choice,
                          (r.options ?? CHOICES.filter((c) => c !== 'aifix' || r.aiFix)).map((c) => ({ id: c, label: choiceLabel(r, c) })),
                          (id) => setChoices({ ...choices, [r.id]: id as Choice }),
                          // The help button sits between the selector and the check mark.
                          r.hasSuggestion ? (
                            <Tooltip renderTip={asked.includes(r.id) ? 'Message sent to your admin' : 'Ask your admin for help'} placement="top">
                              <IconButton size="small" screenReaderLabel={`Ask your admin for help with ${r.title}`} onClick={() => setHelpRow(r)}>
                                <IconEmailLine />
                              </IconButton>
                            </Tooltip>
                          ) : null,
                        )}
                      </Table.Cell>
                    </Table.Row>
                  )
                }),
              ]
            })}
          </Table.Body>
        </Table>
        </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
      {/* The filters on the left, the switch for the course preview at the end of the same row. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.md, alignItems: 'center', justifyContent: 'space-between' }}>
        {showWhole && merging ? null : (
          <div style={{ width: '16rem', maxWidth: '100%' }}>
            <SimpleSelect
              renderLabel={<ScreenReaderContent>Show</ScreenReaderContent>}
              value={filter}
              onChange={(_e, { value }) => setFilter(String(value) as Filter)}
            >
              {FILTERS.map(([id, label]) => (
                <SimpleSelect.Option key={id} id={`filter-${id}`} value={id}>{`${label} (${counts[id]})`}</SimpleSelect.Option>
              ))}
            </SimpleSelect>
          </div>
        )}
        {merging && (
          <div style={{ marginInlineStart: 'auto' }}>
            <Checkbox
              variant="toggle"
              label="Preview the course"
              checked={showWhole}
              onChange={() => setShowWhole(!showWhole)}
            />
          </div>
        )}
      </div>

      {merging && showWhole ? (
        <CoursePreview moduleIds={moduleIds} keepCurrent highlightNew hidden={hiddenModules(dupes)} />
      ) : (
        <>
      <Text color="secondary" aria-live="polite">
        {comeOver} come over · {tally('leave')} left out · {tally('fix')} to fix later · {tally('aifix')} AI fixes · {counts.todo} still to decide
      </Text>

      {selected.length > 0 ? (
        <div
          role="region"
          aria-label="Bulk actions"
          style={{ display: 'flex', flexWrap: 'wrap', gap: t.space.sm, alignItems: 'center', padding: t.space.md, borderRadius: t.radiusCardSm, background: t.containerColor, boxShadow: t.shadowResting }}
        >
          <Text weight="bold">{selected.length} selected</Text>
          {([
            ['aifix', 'Use AI fix for'],
            ['accept', 'Accept suggestions for'],
            ['bring', 'Bring as is:'],
            ['fix', 'Bring, then fix:'],
            ['leave', 'Leave out:'],
          ] as const).map(([a, label]) => (
            <Button key={a} size="small" interaction={pending(a) ? 'enabled' : 'disabled'} onClick={() => run(a)}>
              {label} {pending(a)}
            </Button>
          ))}
          <Button size="small" color="secondary" onClick={() => setSelected([])}>Clear selection</Button>
        </div>
      ) : (
        <Text size="small" color="secondary">Tick items to change several at once. Nothing changes until you pick a button.</Text>
      )}

      {/* A module bar fills the whole row, so its cell has no padding. */}
      <style>{`
        .review-table th:first-child, .review-table tr:not([data-group="true"]) td:first-child { width: 2.25rem; min-width: 0; max-width: 2.25rem; padding-inline-end: 0; }
        .review-table th:nth-child(2), .review-table tr:not([data-group="true"]) td:nth-child(2) { padding-inline-start: 0.5rem; }
        .review-table th:first-child > div, .review-table tr:not([data-group="true"]) td:first-child > div { width: 1.5rem; }
        .review-table table { table-layout: fixed; width: 100%; }
        .review-table th:nth-child(2) { width: 15%; }
        .review-table th:nth-child(3) { width: 26%; }
        .review-table th:nth-child(4) { width: 26%; }
        .review-table th:nth-child(5) { width: 28%; }
        .review-table tr[data-group="true"] td { padding: 0; }
      `}</style>
      <Tabs onRequestTabChange={(_e, { index }) => {
        // Ticks belong to the tab they were made in, so switching tabs clears them and hides the bulk actions.
        setTab(index)
        setSelected([])
      }}>
        <Tabs.Panel id="tab-modules" renderTitle={tabTitle('Modules', moduleTodo)} isSelected={tab === 0} padding="general.spaceMd 0 0 0">
          {moduleRows.length > 0 ? reviewTable(moduleRows, 'Learning objects that come over') : <Text as="p">No items match this filter.</Text>}
        </Tabs.Panel>
        <Tabs.Panel id="tab-course" renderTitle={tabTitle('The whole course', wholeTodo)} isSelected={tab === 1} padding="general.spaceMd 0 0 0">
          {wholeRows.length > 0 ? reviewTable(wholeRows, 'Issues that affect the whole course') : <Text as="p">No items match this filter.</Text>}
        </Tabs.Panel>
      </Tabs>
        </>
      )}
      <AdminHelpModal row={helpRow} onClose={() => setHelpRow(null)} onSend={(id) => setAsked([...asked, id])} />
    </div>
  )
}


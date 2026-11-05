import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Checkbox,
  IconArrowOpenDownSolid,
  IconArrowOpenEndSolid,
  IconAssignmentLine,
  IconButton,
  IconDiscussionLine,
  IconDocumentLine,
  IconFolderLine,
  IconQuizLine,
  RadioInput,
  Text,
  Tooltip,
  View,
} from '@instructure/ui/v11_7'
import { CONTENT_TYPES, CURRENT_MODULES, MODULE_ENTRIES } from './courseContentData'
import { TYPE_ICON, countPicked, keys, pulledInBy, withPulledIn } from './contentHelpers'
import type { CopyMode, Picked, Scope } from './contentHelpers'
import type { ModuleEntry } from './courseContentData'
import FigmaAlert from './FigmaAlert'
import SegmentedControl from './SegmentedControl'
import { useAppThemeKey, useSurfaceTokens } from './appTheme'

const MODULES = CONTENT_TYPES.find((c) => c.id === 'modules')!.items

// Step 2 of the copy wizard: content to copy. Two cards to choose from: the whole course, or part of it.
// "Part of it" opens a list of learning objects to tick. Whenever modules are copied, a preview shows how the course looks.

const KIND_ICON: Record<ModuleEntry['kind'], ReactNode> = {
  assignment: <IconAssignmentLine />,
  quiz: <IconQuizLine />,
  page: <IconDocumentLine />,
  discussion: <IconDiscussionLine />,
  file: <IconFolderLine />,
}


export default function ContentStep({
  scope, setScope, picked: chosen, setPicked, mode, setMode, hidden,
}: {
  scope: Scope | null
  setScope: (s: Scope) => void
  picked: Picked
  setPicked: (p: Picked) => void
  mode: CopyMode
  setMode: (m: CopyMode) => void
  hidden?: Set<string>
}) {
  const t = useSurfaceTokens()
  // `chosen` is what was ticked. `picked` adds the learning objects that come with a ticked module.
  const picked = withPulledIn(chosen)
  const pulled = pulledInBy(chosen)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const setKeys = (ks: string[], on: boolean) => setPicked({ ...chosen, ...Object.fromEntries(ks.map((k) => [k, on])) })
  const allKeys = CONTENT_TYPES.flatMap(keys)
  const allCount = allKeys.filter((k) => picked[k]).length

  const comingModules = scope === 'whole' ? MODULES : MODULES.filter((m) => picked[m.id])

  const card = (id: Scope, title: string, body: ReactNode, extra?: ReactNode) => {
    const on = scope === id
    return (
      <div
        onClick={() => setScope(id)}
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
          name="content-scope"
          value={id}
          checked={on}
          onChange={() => setScope(id)}
          label={
            <span style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
              <Text weight="bold">{title}</Text>
              <Text as="div" color="secondary">{body}</Text>
            </span>
          }
        />
        {/* The extra part only shows when the card is selected. Its space stays, so both cards keep the same height. */}
        {extra && (
          <div
            style={{ marginTop: t.space.lg, visibility: on ? 'visible' : 'hidden' }}
            aria-hidden={!on}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(!on ? ({ inert: '' } as any) : {})}
          >
            {extra}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.xl }}>
      <div role="radiogroup" aria-label="Content to copy" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: t.space.lg }}>
        {card(
          'whole',
          'The whole course',
          `${MODULES.length} modules and all learning objects.`,
(
            <FigmaAlert variant="warning" type="inline">
              Copying the whole course replaces the content that is in this course now.
            </FigmaAlert>
          ),
        )}
        {card(
          'part',
          'Part of it',
          CONTENT_TYPES.map((c) => c.label).join(', ') + '.',
          (
            <div onClick={(e) => e.stopPropagation()}>
              <div>
                <SegmentedControl
                  label="How should it be copied?"
                  value={mode}
                  onChange={(v) => setMode(v as CopyMode)}
                  options={[
                    { value: 'merge', label: 'Merge it with the current content' },
                    { value: 'replace', label: 'Replace the current content' },
                  ]}
                />
              </div>
            </div>
          ),
        )}
      </div>

      {/* The list to tick from and the preview of the course sit side by side. On a narrow page they stack. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: t.space.xl }}>
      {scope === 'part' && (
        <div style={{ flex: '1 1 24rem', minWidth: 0, display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
          <div
            style={{
              background: t.containerColor,
              borderRadius: t.radiusCardMd,
              boxShadow: t.shadowResting,
              padding: t.space.lg,
            }}
          >
            <div style={{ marginBottom: t.space.md }}>
              <Text weight="bold">Choose the learning objects to copy</Text>
            </div>
            <Checkbox
              label="Select all"
              checked={allCount === allKeys.length}
              indeterminate={allCount > 0 && allCount < allKeys.length}
              onChange={() => setKeys(allKeys, allCount < allKeys.length)}
            />
            {CONTENT_TYPES.map((type) => {
              const ks = keys(type)
              const n = countPicked(type, picked)
              const expanded = !!open[type.id]
              return (
                <div key={type.id} style={{ borderTop: `${t.borderWidth} solid ${t.borderColor}`, marginTop: t.space.sm, paddingTop: t.space.sm }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: t.space.sm }}>
                    <span style={{ width: '2rem', flexShrink: 0 }}>
                      {type.items.length > 0 && (
                        <IconButton
                          size="small"
                          withBackground={false}
                          withBorder={false}
                          screenReaderLabel={`${expanded ? 'Hide' : 'Show'} ${type.label}`}
                          aria-expanded={expanded}
                          onClick={() => setOpen({ ...open, [type.id]: !expanded })}
                        >
                          {expanded ? <IconArrowOpenDownSolid /> : <IconArrowOpenEndSolid />}
                        </IconButton>
                      )}
                    </span>
                    <Checkbox
                      label={
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: t.space.sm }}>
                          {TYPE_ICON[type.id]}
                          {type.label}
                          {type.items.length > 0 && ` (${type.items.length})`}
                        </span>
                      }
                      checked={n === ks.length}
                      indeterminate={n > 0 && n < ks.length}
                      onChange={() => setKeys(ks, n < ks.length)}
                    />
                  </div>
                  {expanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm, padding: `${t.space.sm} 0 ${t.space.sm} 4.5rem` }}>
                      {type.items.map((item) => {
                        const from = pulled[item.id]
                        const box = (
                          <Checkbox
                            label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: t.space.sm }}>{TYPE_ICON[type.id]}{item.label}</span>}
                            checked={!!picked[item.id]}
                            disabled={!!from}
                            onChange={() => setKeys([item.id], !picked[item.id])}
                          />
                        )
                        // A disabled box gets no hover, so the tooltip sits on a wrapper that can also take focus.
                        return from ? (
                          <Tooltip
                            key={item.id}
                            renderTip={`Part of ${from.map((n) => `“${n}”`).join(' and ')}, so it is copied with the module. To leave it out, untick the module.`}
                            placement="top start"
                          >
                            <span tabIndex={0} style={{ display: 'inline-block', width: 'fit-content' }}>{box}</span>
                          </Tooltip>
                        ) : (
                          <div key={item.id}>{box}</div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(comingModules.length > 0 || (scope === 'part' && mode === 'merge')) && (
        <div style={{ flex: '1 1 24rem', minWidth: 0 }}>
          <CoursePreview moduleIds={comingModules.map((m) => m.id)} keepCurrent={scope === 'part' && mode === 'merge'} highlightNew={scope === 'part'} hidden={hidden} titleSize="medium" />
        </div>
      )}
      </div>
    </div>
  )
}

// How the course looks with the modules that are copied: grey module bars with their items under them.
export function CoursePreview({
  moduleIds, keepCurrent, highlightNew, hidden, hiddenItems, noteFor, title, titleSize = 'large',
}: {
  moduleIds: string[]
  keepCurrent: boolean
  highlightNew: boolean
  // Modules left out because the educator kept only one of two similar modules.
  hidden?: Set<string>
  // Items left out of the copy are not shown, and an item can carry a note (like an AI fix).
  hiddenItems?: Set<string>
  noteFor?: (itemId: string) => ReactNode
  // `false` leaves the title out and keeps the description.
  title?: string | false
  // The size of the title. Step 2 uses the size of the card title beside it.
  titleSize?: 'medium' | 'large'
}) {
  const t = useSurfaceTokens()
  const legacy = useAppThemeKey() === 'legacy'
  // Each module opens and closes like an accordion. They start open.
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  const toggleModule = (id: string) => setClosed({ ...closed, [id]: !closed[id] })
  // The basic icon color, the same as the text. No green.
  const iconColor = { color: t.textColor }
  const coming = MODULES.filter((m) => moduleIds.includes(m.id)).map((m) => ({ id: m.id, label: m.label, entries: MODULE_ENTRIES[m.id], isNew: true }))
  const current = keepCurrent ? CURRENT_MODULES.map((m) => ({ ...m, isNew: false })) : []
  // Names are kept as they are, so two modules can have the same name.
  const list = [...current, ...coming].filter((m) => !hidden?.has(m.id))
  // Card title and description: a small gap between them, like the Card component in Figma.
  const heading = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
      {title !== false && <Text as="div" weight="bold" size={titleSize} id="course-preview">{title ?? 'Preview'}</Text>}
      <Text as="div" color="secondary">
        {moduleIds.length} of {MODULES.length} modules will be copied.{keepCurrent ? '' : ' They replace the current course content.'}
      </Text>
    </div>
  )
  return (
    <section aria-labelledby="course-preview" style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
      {/* In Light and Dark the title sits inside the card. Legacy has no card, so it stays above the list. */}
      {legacy && heading}
      <style>{`.module-toggle:focus-visible { outline: 0.125rem solid currentColor; outline-offset: -0.25rem; }`}</style>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: t.space.lg,
          background: legacy ? undefined : t.containerColor,
          borderRadius: legacy ? undefined : t.radiusCardMd,
          boxShadow: legacy ? undefined : t.shadowResting,
          padding: legacy ? undefined : t.space.lg,
        }}
      >
        {!legacy && heading}
        {list.map((m) => (
          <div
            key={m.id}
            style={{
              border: `${t.borderWidth} solid ${t.borderColor}`,
              borderRadius: legacy ? undefined : t.radiusMd,
              overflow: 'hidden',
            }}
          >
            {/* Modules that are copied get a blue bar. Modules already in the course keep the light grey bar. */}
            {/* Modules that are copied get a blue bar. Modules already in the course keep the light grey bar. */}
            <View as="div" background={legacy && !(m.isNew && highlightNew) ? 'secondary' : undefined}>
              <button
                type="button"
                className="module-toggle"
                aria-expanded={!closed[m.id]}
                onClick={() => toggleModule(m.id)}
                style={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  width: '100%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: t.space.sm,
                  padding: t.space.md,
                  ...(m.isNew && highlightNew
                    ? { background: t.linkColor, color: t.onColor }
                    : { background: legacy ? 'transparent' : t.pageColor, color: t.textColor }),
                }}
              >
                <span aria-hidden="true" style={{ display: 'inline-flex' }}>
                  {closed[m.id] ? <IconArrowOpenEndSolid /> : <IconArrowOpenDownSolid />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <Text weight="bold" color={m.isNew && highlightNew ? 'primary-inverse' : undefined}>{m.label}</Text>
                </span>
                {/* When the copy is merged into the course, each module says if it is already there or is new. */}
                {keepCurrent && (
                  <Text size="small" color={m.isNew && highlightNew ? 'primary-inverse' : 'secondary'}>
                    {m.isNew ? 'New' : 'Existing'}
                  </Text>
                )}
              </button>
            </View>
            {!closed[m.id] && m.entries.filter((e) => !hiddenItems?.has(e.itemId)).map((e) => (
              <div
                key={e.itemId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: t.space.md,
                  padding: t.space.md,
                  borderTop: `${t.borderWidth} solid ${t.borderColor}`,
                }}
              >
                <span style={{ ...iconColor, display: 'inline-flex' }}>{KIND_ICON[e.kind]}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <Text as="div" weight="bold">{e.title}</Text>
                  <Text as="div" size="small" color="secondary">{e.meta}</Text>
                </span>
                {noteFor?.(e.itemId)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

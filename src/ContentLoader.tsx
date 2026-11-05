import { useEffect, useState } from 'react'
import { IconCheckMarkSolid, Spinner, Text } from '@instructure/ui/v11_7'
import { TYPE_ICON } from './contentHelpers'
import type { ContentType } from './courseContentData'
import { useSurfaceTokens } from './appTheme'

// Shown after "Select content": the course is read one learning object type at a time. Each tile shows its icon
// and title, a spinner while it loads and a check when it is done. When the last one is done, `onDone` runs.

const STEP_MS = 650

export default function ContentLoader({ types, onDone }: { types: ContentType[]; onDone: () => void }) {
  const t = useSurfaceTokens()
  const [done, setDone] = useState(0)

  useEffect(() => {
    if (done >= types.length) {
      const wait = setTimeout(onDone, 500)
      return () => clearTimeout(wait)
    }
    const timer = setTimeout(() => setDone((d) => d + 1), STEP_MS)
    return () => clearTimeout(timer)
  }, [done, types.length, onDone])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg, padding: `${t.space.xl} 0` }}>
      <div role="status">
        <Text as="div" weight="bold" size="large">Loading your course content</Text>
        <Text as="div" color="secondary">This can take some time. Keep this page open.</Text>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(13rem, 1fr))', gap: t.space.md }}>
        {types.map((type, i) => {
          const finished = i < done
          const loading = i === done
          return (
            <li
              key={type.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: t.space.md,
                padding: t.space.md,
                background: t.containerColor,
                borderRadius: t.radiusCardSm,
                boxShadow: t.shadowResting,
                opacity: finished || loading ? 1 : 0.5,
              }}
            >
              <span style={{ display: 'inline-flex', fontSize: '1.5rem' }}>{TYPE_ICON[type.id]}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <Text as="div" weight="bold">{type.label}</Text>
                <Text as="div" size="small" color="secondary">{finished ? 'Loaded' : loading ? 'Loading' : 'Waiting'}</Text>
              </span>
              <span style={{ display: 'inline-flex', color: t.successTextColor }}>
                {finished ? <IconCheckMarkSolid /> : loading ? <Spinner renderTitle={`Loading ${type.label}`} size="x-small" /> : null}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

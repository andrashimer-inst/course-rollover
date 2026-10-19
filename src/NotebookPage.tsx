import { useState } from 'react'
import { Link, SimpleSelect, Text } from '@instructure/ui/v11_7'
import DesktopWrapper from './DesktopWrapper'
import { NoteCard } from './NotebookPanel'
import { NOTEBOOK_COURSE, courseMenu, itemById } from './notebookData'
import type { NotesApi } from './useNotes'
import { useSurfaceTokens } from './appTheme'

// The Notebook page, opened from Account > Notebook: every note the educator made in the course, with a
// link to the page or assignment it belongs to.

const FILTERS = ['All notes', 'Pages', 'Assignments and quizzes']

export default function NotebookPage({
  api,
  onNavigate,
  onSelectMenu,
  onOpenItem,
}: {
  api: NotesApi
  onNavigate: (label: string) => void
  onSelectMenu: (label: string) => void
  onOpenItem: (itemId: string) => void
}) {
  const t = useSurfaceTokens()
  const [filter, setFilter] = useState(FILTERS[0])
  const shown = api.notes.filter((n) => {
    const item = itemById(n.itemId)
    if (filter === FILTERS[1]) return item?.kind === 'Pages'
    if (filter === FILTERS[2]) return item?.kind === 'Assignments'
    return true
  })
  return (
    <DesktopWrapper
      pageTitle="Notebook"
      breadcrumb={['Account']}
      activeNav="Dashboard"
      course={courseMenu(NOTEBOOK_COURSE, '', onSelectMenu)}
      onNavigate={onNavigate}
      description="Every note you made in your courses. Open a page or assignment to add more."
      fullWidth
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.xl, maxWidth: '47.5rem' }}>
        <SimpleSelect renderLabel="Show" value={filter} onChange={(_e, { value }) => setFilter(String(value))}>
          {FILTERS.map((f) => (
            <SimpleSelect.Option key={f} id={f} value={f}>
              {f}
            </SimpleSelect.Option>
          ))}
        </SimpleSelect>
        <Text color="secondary">
          {shown.length} {shown.length === 1 ? 'note' : 'notes'} in {NOTEBOOK_COURSE}
        </Text>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
          {shown.map((n) => {
            const item = itemById(n.itemId)
            if (!item) return null
            return (
              <NoteCard
                key={n.id}
                note={n}
                wholeLabel={item.kind === 'Pages' ? 'Whole page' : 'Whole assignment'}
                showItem={item.title}
                onUpdate={api.update}
                onRemove={api.remove}
                openLink={
                  <Link
                    href="#"
                    onClick={(e: { preventDefault: () => void }) => {
                      e.preventDefault()
                      onOpenItem(item.id)
                    }}
                  >
                    Open {item.kind === 'Pages' ? 'page' : 'assignment'}
                  </Link>
                }
              />
            )
          })}
        </ul>
        {shown.length === 0 && <Text color="secondary">No notes here yet.</Text>}
      </div>
    </DesktopWrapper>
  )
}

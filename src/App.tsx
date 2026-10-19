import { useState } from 'react'
import { InstUISettingsProvider } from '@instructure/ui/v11_7'
import CourseContent from './CourseContent'
import CourseRollover from './CourseRollover'
import NotebookPage from './NotebookPage'
import ThemeSwitcher from './ThemeSwitcher'
import { AppThemeContext, THEMES } from './appTheme'
import type { ThemeKey } from './appTheme'
import { itemById } from './notebookData'
import { useNotes } from './useNotes'

// Screens of the prototype:
//   rollover     Settings > Import Content, the Course Rollover design
//   notebook     Account > Notebook, every note the educator made
//   pages        a page of the course, with the Notebook (highlight text, make a note)
//   assignments  an assignment of the course, same Notebook
// Notes are shared by all screens, and the copy wizard shows them in its Review comments step.
type Screen = 'rollover' | 'notebook' | 'pages' | 'assignments'

export default function App() {
  const [themeKey, setThemeKey] = useState<ThemeKey>('light')
  const [screen, setScreen] = useState<Screen>('rollover')
  const [pageId, setPageId] = useState('week5')
  const [assignmentId, setAssignmentId] = useState('a3')
  const api = useNotes()

  // A global nav item without its own screen is ignored. Account > Notebook opens the Notebook page.
  const onNavigate = (label: string) => {
    if (label === 'Notebook') setScreen('notebook')
  }
  // The course menu of the notebook course (Portfolio Test). Settings goes back to Import Content.
  const onSelectMenu = (label: string) => {
    if (label === 'Pages') setScreen('pages')
    else if (label === 'Assignments') setScreen('assignments')
    else if (label === 'Settings') setScreen('rollover')
  }
  const openItem = (id: string) => {
    if (itemById(id)?.kind === 'Pages') {
      setPageId(id)
      setScreen('pages')
    } else {
      setAssignmentId(id)
      setScreen('assignments')
    }
  }

  return (
    <AppThemeContext.Provider value={themeKey}>
      <InstUISettingsProvider theme={THEMES[themeKey]}>
        {screen === 'rollover' && <CourseRollover notes={api.notes} onNavigate={onNavigate} />}
        {screen === 'notebook' && (
          <NotebookPage api={api} onNavigate={onNavigate} onSelectMenu={onSelectMenu} onOpenItem={openItem} />
        )}
        {screen === 'pages' && (
          <CourseContent
            kind="Pages"
            itemId={pageId}
            onItemChange={setPageId}
            api={api}
            onNavigate={onNavigate}
            onSelectMenu={onSelectMenu}
          />
        )}
        {screen === 'assignments' && (
          <CourseContent
            kind="Assignments"
            itemId={assignmentId}
            onItemChange={setAssignmentId}
            api={api}
            onNavigate={onNavigate}
            onSelectMenu={onSelectMenu}
          />
        )}

        {/* Theme switcher overlay: movable and collapsible (see ThemeSwitcher.tsx) */}
        <ThemeSwitcher themeKey={themeKey} onChange={setThemeKey} />
      </InstUISettingsProvider>
    </AppThemeContext.Provider>
  )
}

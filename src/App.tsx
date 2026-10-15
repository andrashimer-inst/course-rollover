import { useState } from 'react'
import { InstUISettingsProvider } from '@instructure/ui/v11_7'
import CourseRollover from './CourseRollover'
import ThemeSwitcher from './ThemeSwitcher'
import { AppThemeContext, THEMES } from './appTheme'
import type { ThemeKey } from './appTheme'

export default function App() {
  const [themeKey, setThemeKey] = useState<ThemeKey>('light')

  return (
    <AppThemeContext.Provider value={themeKey}>
      <InstUISettingsProvider theme={THEMES[themeKey]}>
        <CourseRollover />

        {/* Theme switcher overlay: movable and collapsible (see ThemeSwitcher.tsx) */}
        <ThemeSwitcher themeKey={themeKey} onChange={setThemeKey} />
      </InstUISettingsProvider>
    </AppThemeContext.Provider>
  )
}

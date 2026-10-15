import { useState } from 'react'
import {
  InstUISettingsProvider,
  RadioInputGroup,
  RadioInput,
  View,
} from '@instructure/ui/v11_7'
import CourseRollover from './CourseRollover'
import { AppThemeContext, THEMES } from './appTheme'
import type { ThemeKey } from './appTheme'

export default function App() {
  const [themeKey, setThemeKey] = useState<ThemeKey>('light')

  return (
    <AppThemeContext.Provider value={themeKey}>
    <InstUISettingsProvider theme={THEMES[themeKey]}>
      <CourseRollover />

      {/* Theme switcher overlay, bottom right */}
      <div // The wrapper sets --wrapper-panel-width while a utility panel is open, so this moves left of it.
        style={{ position: 'fixed', right: 'calc(1rem + var(--wrapper-panel-width, 0px))', bottom: 16, zIndex: 9999 }}>
        <View
          as="div"
          background="primary"
          padding="small"
          borderWidth="small"
          borderRadius="medium"
          shadow="above"
        >
          <RadioInputGroup
            name="theme"
            description="Theme"
            variant="toggle"
            size="small"
            value={themeKey}
            onChange={(_e, value) => setThemeKey(value as ThemeKey)}
          >
            <RadioInput value="legacy" label="Legacy" />
            <RadioInput value="light" label="Light" />
            <RadioInput value="dark" label="Dark" />
          </RadioInputGroup>
        </View>
      </div>
    </InstUISettingsProvider>
    </AppThemeContext.Provider>
  )
}

import { useState } from 'react'
import {
  Button,
  Heading,
  InstUISettingsProvider,
  RadioInputGroup,
  RadioInput,
  Text,
  View,
} from '@instructure/ui/v11_7'
import DesktopWrapper from './DesktopWrapper'
import FigmaAlert from './FigmaAlert'
import { AppThemeContext, THEMES } from './appTheme'
import type { ThemeKey } from './appTheme'

// Template page: the wrapper, global nav and theme switcher with a little sample content.
// A design replaces the sample content (and, on its own branch, this file's page).
export default function App() {
  const [themeKey, setThemeKey] = useState<ThemeKey>('light')

  return (
    <AppThemeContext.Provider value={themeKey}>
      <InstUISettingsProvider theme={THEMES[themeKey]}>
        <DesktopWrapper
          pageTitle="Courses"
          breadcrumb={['Home']}
          activeNav="Courses"
          fullWidth
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FigmaAlert variant="info" type="floating">
              Floating alert: page-level messages that need prominent placement.
            </FigmaAlert>
            <FigmaAlert variant="success" type="inline">
              Inline alert: messages that live inside a region of the page.
            </FigmaAlert>
            <View as="div" padding="padding.card.lg" borderWidth="small" borderRadius="medium">
              <Heading level="h2">Sample content</Heading>
              <Text as="p">Sample course data only. Replace this with the screen you want to design.</Text>
              <Button color="primary">Primary action</Button>
            </View>
          </div>
        </DesktopWrapper>

        {/* Theme switcher overlay, bottom right */}
        <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999 }}>
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

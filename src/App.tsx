import { useState } from 'react'
import {
  Button,
  Heading,
  InstUISettingsProvider,
  RadioInputGroup,
  RadioInput,
  Text,
  View,
  canvas,
  dark,
  light,
} from '@instructure/ui/v11_7'
import DesktopWrapper from './DesktopWrapper'

const THEMES = { legacy: canvas, light, dark }
type ThemeKey = keyof typeof THEMES

export default function App() {
  const [themeKey, setThemeKey] = useState<ThemeKey>('light')

  return (
    <InstUISettingsProvider theme={THEMES[themeKey]}>
      <View as="div" background="primary" minHeight="100vh">
        <DesktopWrapper
          pageTitle="Courses"
          breadcrumb={['Home']}
          activeNav="Courses"
          fullWidth
        >
          <View as="div" padding="medium" borderWidth="small" borderRadius="medium">
            <Heading level="h2">Sample content</Heading>
            <Text as="p">Sample course data only. Replace this with the screen you want to design.</Text>
            <Button color="primary">Primary action</Button>
          </View>
        </DesktopWrapper>
      </View>

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
  )
}

import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  Checkbox,
  Heading,
  InstUISettingsProvider,
  RadioInputGroup,
  RadioInput,
  Text,
  View,
} from '@instructure/ui/v11_7'
import DesktopWrapper from './DesktopWrapper'
import FigmaAlert from './FigmaAlert'
import { SAMPLE_COURSE } from './sampleCourse'
import { AppThemeContext, THEMES, useSurfaceTokens } from './appTheme'
import type { ThemeKey } from './appTheme'

// A card on the page, as in Figma: the theme's container color (not the View "primary" background,
// which is a different shade in Dark), 16px radius and padding, elevation 1 shadow.
function SampleCard({ children }: { children: ReactNode }) {
  const t = useSurfaceTokens()
  return (
    <div
      style={{
        boxSizing: 'border-box',
        background: t.containerColor,
        borderRadius: t.radiusCardMd,
        padding: t.space.lg,
        boxShadow: t.shadowResting,
      }}
    >
      {children}
    </div>
  )
}

// Template page: the wrapper, global nav and theme switcher with a little sample content.
// A design replaces the sample content (and, on its own branch, this file's page).
export default function App() {
  const [themeKey, setThemeKey] = useState<ThemeKey>('light')
  // Layout options to try on the Light and Dark wrapper (see ModernWrapper.tsx).
  const [showFilters, setShowFilters] = useState(true)
  const [showTabList, setShowTabList] = useState(false)
  const [showTrailing, setShowTrailing] = useState(false)
  const [fullWidth, setFullWidth] = useState(true)
  const modern = themeKey !== 'legacy'

  return (
    <AppThemeContext.Provider value={themeKey}>
      <InstUISettingsProvider theme={THEMES[themeKey]}>
        <DesktopWrapper
          pageTitle="Courses"
          breadcrumb={['Home']}
          activeNav="Courses"
          course={SAMPLE_COURSE}
          fullWidth={fullWidth}
          description="Your courses for this term. Replace this page with the screen you want to design."
          actions={
            <>
              <Button color="primary">Primary action</Button>
              <Button color="secondary">Secondary action</Button>
            </>
          }
          showFilters={showFilters}
          contentTabList={
            showTabList
              ? { title: 'On this page', items: ['Overview', 'Schedule', 'Grading', 'Resources'] }
              : undefined
          }
          trailingContent={
            showTrailing ? (
              <SampleCard>
                <Heading level="h2" variant="titleCardRegular">
                  Course details
                </Heading>
                <Text as="p">Supporting information that stays visible next to the main content.</Text>
              </SampleCard>
            ) : undefined
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FigmaAlert variant="info" type="floating">
              Floating alert: page-level messages that need prominent placement.
            </FigmaAlert>
            <FigmaAlert variant="success" type="inline">
              Inline alert: messages that live inside a region of the page.
            </FigmaAlert>
            <SampleCard>
              <Heading level="h2">Sample content</Heading>
              <Text as="p">Sample course data only. Replace this with the screen you want to design.</Text>
              {/* Light and Dark show the page actions in the header. Legacy keeps this one in the content. */}
              {!modern && <Button color="primary">Primary action</Button>}
            </SampleCard>
          </div>
        </DesktopWrapper>

        {/* Theme switcher overlay, bottom right */}
        {/* The wrapper sets --wrapper-panel-width while a utility panel is open, so this moves left of it. */}
        <div style={{ position: 'fixed', right: 'calc(1rem + var(--wrapper-panel-width, 0px))', bottom: 16, zIndex: 9999 }}>
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
            {modern && (
              <View as="div" margin="small 0 0 0">
                <Text weight="bold" size="small">
                  Layout
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  <Checkbox size="small" label="Filter row" checked={showFilters} onChange={() => setShowFilters((v) => !v)} />
                  <Checkbox size="small" label="Content tab list" checked={showTabList} onChange={() => setShowTabList((v) => !v)} />
                  <Checkbox size="small" label="Trailing area" checked={showTrailing} onChange={() => setShowTrailing((v) => !v)} />
                  <Checkbox size="small" label="Full width" checked={fullWidth} onChange={() => setFullWidth((v) => !v)} />
                </div>
              </View>
            )}
          </View>
        </div>
      </InstUISettingsProvider>
    </AppThemeContext.Provider>
  )
}

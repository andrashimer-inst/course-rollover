import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  Checkbox,
  Heading,
  IconButton,
  IconEditLine,
  IconMoreLine,
  IconSettingsLine,
  IconStudentViewLine,
  InstUISettingsProvider,
  Menu,
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

// Legacy side column (plain content on the page, no card): a section title with a line under it, a
// short text and full-width buttons. Sample content only.
function LegacySideColumn() {
  const t = useSurfaceTokens()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
      <div style={{ paddingBottom: t.space.sm, borderBottom: `${t.borderWidth} solid ${t.borderColor}` }}>
        <Heading level="h2" variant="titleCardRegular">
          Sidebar section
        </Heading>
      </div>
      <Text as="p">Shortcuts and supporting information that stay beside the page content.</Text>
      <Button display="block" textAlign="start" renderIcon={<IconEditLine />}>
        Sidebar action
      </Button>
      <Button display="block" textAlign="start" renderIcon={<IconSettingsLine />}>
        Another action
      </Button>
    </div>
  )
}

// Legacy "more options" menu (the kebab at the end of a title row).
function LegacyPageMenu() {
  return (
    <Menu
      placement="bottom end"
      trigger={
        <IconButton screenReaderLabel="More options">
          <IconMoreLine />
        </IconButton>
      }
    >
      <Menu.Item>Menu action</Menu.Item>
      <Menu.Item>Another menu action</Menu.Item>
    </Menu>
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
  // Legacy (Canvas) flow: a plain page, the Courses tray from the nav, then a course page.
  const [legacyPage, setLegacyPage] = useState<'page' | 'course'>('page')
  const [legacyCourseName, setLegacyCourseName] = useState('CS101: Intro to Computer Science')
  const [showLegacySide, setShowLegacySide] = useState(true)
  const legacyCourse = !modern && legacyPage === 'course'

  return (
    <AppThemeContext.Provider value={themeKey}>
      <InstUISettingsProvider theme={THEMES[themeKey]}>
        <DesktopWrapper
          pageTitle={modern ? 'Courses' : legacyCourse ? legacyCourseName : 'Page title'}
          breadcrumb={modern ? ['Home'] : []}
          activeNav={modern || legacyCourse ? 'Courses' : 'Dashboard'}
          course={modern || legacyCourse ? SAMPLE_COURSE : undefined}
          fullWidth={fullWidth}
          // Legacy only: the nav flow and the top bar action
          onNavigate={(label) => label === 'Dashboard' && setLegacyPage('page')}
          onOpenCourse={(c) => {
            setLegacyCourseName(c.name)
            setLegacyPage('course')
          }}
          barActions={
            legacyCourse ? <Button renderIcon={<IconStudentViewLine />}>Preview as student</Button> : undefined
          }
          description="Your courses for this term. Replace this page with the screen you want to design."
          actions={
            <>
              <Button color="primary">Primary action</Button>
              <Button color="secondary">Secondary action</Button>
              {!modern && <LegacyPageMenu />}
            </>
          }
          showFilters={showFilters}
          contentTabList={
            showTabList
              ? { title: 'On this page', items: ['Overview', 'Schedule', 'Grading', 'Resources'] }
              : undefined
          }
          trailingContent={
            !modern ? (
              showLegacySide ? (
                <LegacySideColumn />
              ) : undefined
            ) : showTrailing ? (
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
            {!modern && (
              <View as="div" margin="small 0 0 0">
                <RadioInputGroup
                  name="legacy-page"
                  description={
                    <Text weight="bold" size="small">
                      Layout
                    </Text>
                  }
                  size="small"
                  value={legacyPage}
                  onChange={(_e, value) => setLegacyPage(value as 'page' | 'course')}
                >
                  <RadioInput value="page" label="Page" />
                  <RadioInput value="course" label="Course page" />
                </RadioInputGroup>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  <Checkbox size="small" label="Side column" checked={showLegacySide} onChange={() => setShowLegacySide((v) => !v)} />
                  <Checkbox size="small" label="Full width" checked={fullWidth} onChange={() => setFullWidth((v) => !v)} />
                </div>
              </View>
            )}
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

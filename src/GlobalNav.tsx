import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Avatar,
  Badge,
  BaseButton,
  Drilldown,
  Heading,
  IconCheckMarkLine,
  IconArrowOpenEndLine,
  IconButton,
  IconCalendarMonthLine,
  IconClockLine,
  IconCoursesLine,
  IconDashboardLine,
  IconInboxLine,
  IconMoveEndLine,
  IconMoveStartLine,
  IconPlusLine,
  IconQuestionLine,
  ScreenReaderContent,
  Text,
  Tooltip,
  View,
} from '@instructure/ui/v11_7'
import { useSurfaceTokens } from './appTheme'

// Desktop Global Nav, matching the Figma "GlobalNav/desktop (beta)" layout:
// institution, account, primary items, collapse button, product logo.
// Built from InstUI components because the beta GlobalNav isn't in the package.

export type NavKey = 'Dashboard' | 'Courses' | 'Calendar' | 'Inbox' | 'History' | 'Help' | 'Custom'

type NavItem = {
  key: NavKey
  icon: ReactNode
  hasSubMenu?: boolean
  count?: number
}

const NAV: NavItem[] = [
  { key: 'Dashboard', icon: <IconDashboardLine /> },
  { key: 'Courses', icon: <IconCoursesLine />, hasSubMenu: true },
  { key: 'Calendar', icon: <IconCalendarMonthLine /> },
  { key: 'Inbox', icon: <IconInboxLine />, count: 9 },
  { key: 'History', icon: <IconClockLine /> },
  { key: 'Help', icon: <IconQuestionLine /> },
  { key: 'Custom', icon: <IconPlusLine /> },
]

const row = { display: 'flex', alignItems: 'center', gap: 8 } as const

// Courses sub navigation (Figma "Multilevel Navigation Flow"): level 1 lists Overview, My courses
// (opens level 2) and Course catalog. Sample data only.
const COURSES_SUB = ['Overview', 'My courses', 'Course catalog']
const MY_COURSES = [
  'CS101: Intro to Computer Science',
  'CALC2: Advanced Calculus',
  'ENG1: College Writing',
  'HIST101: World History',
]
type SubNav = 'courses' | 'my-courses'

export type GlobalNavProps = {
  activeNav?: NavKey
  institutionName?: string
  userName?: string
  userRole?: string
}

export default function GlobalNav({
  activeNav = 'Dashboard',
  institutionName = 'Instructure',
  userName = 'User Name',
  userRole = 'student',
}: GlobalNavProps) {
  const [collapsed, setCollapsed] = useState(false)
  // Which sub navigation is open (null = closed) and which course the user went to.
  const [subNav, setSubNav] = useState<SubNav | null>(null)
  const [lastSubNav, setLastSubNav] = useState<SubNav>('courses')
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const t = useSurfaceTokens()
  const openSub = (level: SubNav | null) => {
    setSubNav(level)
    if (level) setLastSubNav(level)
  }
  // Going to a course makes both "Courses" and that course the current location.
  const currentNav: NavKey = selectedCourse ? 'Courses' : activeNav
  // Figma: in Light and Dark the nav is a rounded card with a 12px margin. In Legacy it is
  // flush with the window edge, full height, with no rounding.
  const legacy = t.key === 'legacy'

  return (
    <div style={{ position: 'sticky', top: 0, height: '100vh', padding: legacy ? 0 : 12, boxSizing: 'border-box', flexShrink: 0 }}>
      <nav
        aria-label="Global navigation"
        style={{
          height: '100%',
          boxSizing: 'border-box',
          background: t.containerColor,
          border: legacy ? 'none' : `${t.borderWidth} solid ${t.borderColor}`,
          borderRight: `${t.borderWidth} solid ${t.borderColor}`,
          borderRadius: legacy ? 0 : t.radius,
          boxShadow: legacy ? 'none' : t.shadowResting,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', height: '100%' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            height: '100%',
            boxSizing: 'border-box',
            padding: 12,
            width: collapsed ? 68 : 200,
            flexShrink: 0,
          }}
        >
          {/* Institution */}
          <div style={{ ...row, gap: 12, padding: collapsed ? '4px 0' : 8, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Avatar name={institutionName} shape="rectangle" size="medium" />
            {!collapsed && <Text weight="bold">{institutionName}</Text>}
          </div>

          {/* Account */}
          {collapsed ? (
            <Tooltip renderTip={userName} placement="end">
              <IconButton screenReaderLabel={`Account, ${userName}`} withBackground={false} withBorder={false}>
                <Avatar name={userName} size="x-small" />
              </IconButton>
            </Tooltip>
          ) : (
            <View as="div" borderWidth="small" borderRadius="medium" padding="x-small small">
              <div style={row}>
                <Avatar name={userName} size="x-small" />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <Text size="small">{userName}</Text>
                  <Text size="x-small" color="secondary">{userRole}</Text>
                </div>
              </div>
            </View>
          )}

          {/* Primary items */}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
            {NAV.map(({ key, icon, hasSubMenu, count }) => {
              const current = key === currentNav
              const active = hasSubMenu && !collapsed && subNav !== null
              const selected = current || active
              const label = count ? `${key}, ${count} unread` : key
              return (
                <li key={key}>
                  {collapsed ? (
                    <Tooltip renderTip={key} placement="end">
                      <IconButton
                        screenReaderLabel={label}
                        withBackground={selected}
                        withBorder={false}
                        color="secondary"
                        aria-current={current ? 'page' : undefined}
                      >
                        {icon}
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <BaseButton
                      display="block"
                      textAlign="start"
                      color="secondary"
                      withBorder={false}
                      withBackground={selected}
                      renderIcon={icon}
                      aria-current={current ? 'page' : undefined}
                      aria-expanded={hasSubMenu ? subNav !== null : undefined}
                      onClick={() => {
                        if (hasSubMenu) openSub(subNav ? null : 'courses')
                        else openSub(null)
                      }}
                    >
                      <span style={{ ...row, justifyContent: 'space-between', width: '100%' }}>
                        <Text weight="normal">{key}</Text>
                        {count ? (
                          <Badge standalone count={count} formatOutput={(n) => (
                            <>
                              {n}
                              <ScreenReaderContent> unread</ScreenReaderContent>
                            </>
                          )} />
                        ) : null}
                        {hasSubMenu ? <IconArrowOpenEndLine /> : null}
                      </span>
                    </BaseButton>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Collapse */}
          {collapsed ? (
            <Tooltip renderTip="Expand sidebar" placement="end">
              <IconButton
                screenReaderLabel="Expand sidebar"
                withBackground={false}
                withBorder={false}
                onClick={() => setCollapsed(false)}
              >
                <IconMoveEndLine />
              </IconButton>
            </Tooltip>
          ) : (
            <BaseButton
              display="block"
              withBackground={false}
              withBorder={false}
              color="secondary"
              isCondensed
              renderIcon={<IconMoveStartLine />}
              onClick={() => setCollapsed(true)}
            >
              Collapse sidebar
            </BaseButton>
          )}

          {/* Product logo */}
          <View as="div" borderWidth="small 0 0 0" padding="small 0 0 0" textAlign="center">
            <Text weight="bold" size={collapsed ? 'x-small' : 'medium'}>Canvas</Text>
          </View>
        </div>

        {/* Sub navigation: a 32px strip when closed, a 200px panel when open (Figma) */}
        {!collapsed && (
          <div
            style={{
              width: subNav ? 200 : 32,
              flexShrink: 0,
              height: '100%',
              boxSizing: 'border-box',
              borderLeft: `${t.borderWidth} solid ${t.borderColor}`,
              padding: subNav ? 12 : '12px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: subNav ? 'stretch' : 'center',
              gap: 8,
            }}
          >
            {!subNav ? (
              <Tooltip renderTip="Open sub navigation" placement="end">
                <IconButton
                  size="small"
                  withBackground={false}
                  withBorder={false}
                  screenReaderLabel="Open sub navigation"
                  onClick={() => openSub(lastSubNav)}
                >
                  <IconMoveEndLine />
                </IconButton>
              </Tooltip>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton
                    size="small"
                    withBackground={false}
                    withBorder={false}
                    screenReaderLabel="Close sub navigation"
                    onClick={() => openSub(null)}
                  >
                    <IconMoveStartLine />
                  </IconButton>
                </div>
                <div className="subnav-drilldown">
                <Drilldown
                  rootPageId="courses"
                  width="100%"
                  // Figma draws the options directly on the nav, with no box around them.
                  themeOverride={{ borderColor: 'transparent', borderRadius: '0' }}
                >
                  <Drilldown.Page
                    id="courses"
                    renderTitle={<Heading level="h2" variant="titleCardLarge">Courses</Heading>}
                  >
                    {COURSES_SUB.map((label) =>
                      label === 'My courses' ? (
                        <Drilldown.Option key={label} id={label} subPageId="my-courses">
                          {label}
                        </Drilldown.Option>
                      ) : (
                        <Drilldown.Option key={label} id={label}>
                          {label}
                        </Drilldown.Option>
                      ),
                    )}
                  </Drilldown.Page>
                  <Drilldown.Page
                    id="my-courses"
                    renderTitle={<Heading level="h2" variant="titleCardLarge">My courses</Heading>}
                    renderBackButtonLabel="Courses"
                  >
                    {MY_COURSES.map((course) => (
                      <Drilldown.Option
                        key={course}
                        id={course}
                        onOptionClick={() => setSelectedCourse(course)}
                        renderAfterLabel={selectedCourse === course ? <IconCheckMarkLine /> : undefined}
                      >
                        {course}
                      </Drilldown.Option>
                    ))}
                  </Drilldown.Page>
                </Drilldown>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </nav>
    </div>
  )
}

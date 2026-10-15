import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Avatar,
  Badge,
  BookTextInstUIIcon,
  CalendarDaysInstUIIcon,
  CanvasLogoInstUIIcon,
  CheckInstUIIcon,
  ChevronLeftInstUIIcon,
  ChevronRightInstUIIcon,
  CircleQuestionMarkInstUIIcon,
  ClockInstUIIcon,
  CondensedButton,
  EyeOffInstUIIcon,
  InboxInstUIIcon,
  LayoutDashboardInstUIIcon,
  PanelLeftCloseInstUIIcon,
  PanelLeftOpenInstUIIcon,
  PlusInstUIIcon,
  Drilldown,
  Heading,
  IconButton,
  IconCalendarMonthLine,
  IconClockLine,
  IconCoursesLine,
  IconFolderLine,
  IconAdminLine,
  IconUserLine,
  IconDashboardLine,
  IconInboxLine,
  IconMoveEndLine,
  IconMoveStartLine,
  IconQuestionLine,
  ScreenReaderContent,
  Text,
  Tooltip,
  View,
} from '@instructure/ui/v11_7'
import { useAppThemeKey, useSurfaceTokens } from './appTheme'

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

// Light and Dark nav items. The icons are the Figma ones (the new icon set).
const NAV: NavItem[] = [
  { key: 'Dashboard', icon: <LayoutDashboardInstUIIcon size="lg" /> },
  { key: 'Courses', icon: <BookTextInstUIIcon size="lg" />, hasSubMenu: true },
  { key: 'Calendar', icon: <CalendarDaysInstUIIcon size="lg" /> },
  { key: 'Inbox', icon: <InboxInstUIIcon size="lg" />, count: 9 },
  { key: 'History', icon: <ClockInstUIIcon size="lg" /> },
  { key: 'Help', icon: <CircleQuestionMarkInstUIIcon size="lg" /> },
  { key: 'Custom', icon: <PlusInstUIIcon size="lg" /> },
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
type SubNav = 'course' | 'courses' | 'my-courses'

export type CourseNavItem = { label: string; unpublished?: boolean; current?: boolean }
// The navigation of the course the user is in (Home, Announcements, ...). In Light and Dark it
// lives in the Courses sub navigation. In Legacy the page shows it itself, as in Canvas today.
export type CourseNav = { name: string; items: CourseNavItem[] }


// Legacy (Canvas today): a flush, full-height dark bar with stacked icon and label items, the
// current item shown as a white tab. No sub navigation here: the course menu is drawn by the page.
const LEGACY_ITEMS: { label: string; icon: ReactNode; key?: NavKey; badge?: number }[] = [
  { label: 'Account', icon: <IconUserLine /> },
  { label: 'Admin', icon: <IconAdminLine /> },
  { label: 'Dashboard', icon: <IconDashboardLine />, key: 'Dashboard' },
  { label: 'Courses', icon: <IconCoursesLine />, key: 'Courses' },
  { label: 'Calendar', icon: <IconCalendarMonthLine />, key: 'Calendar' },
  { label: 'Inbox', icon: <IconInboxLine />, key: 'Inbox' },
  { label: 'History', icon: <IconClockLine />, key: 'History' },
  { label: 'Portfolio', icon: <IconFolderLine /> },
  { label: 'Help', icon: <IconQuestionLine />, key: 'Help', badge: 10 },
]

function LegacyNav({ activeNav }: { activeNav: NavKey }) {
  const t = useSurfaceTokens()
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
      <nav
        aria-label="Global navigation"
        style={{
          height: '100%',
          width: collapsed ? 56 : 80,
          boxSizing: 'border-box',
          background: t.inverseColor,
          color: t.onColor,
          fontFamily: t.fontFamily,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '16px 0', textAlign: 'center', fontWeight: 700, fontSize: 12 }} aria-hidden="true">
          Canvas
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, overflowY: 'auto' }}>
          {LEGACY_ITEMS.map(({ label, icon, key, badge }) => {
            const current = key === activeNav
            return (
              <li key={label}>
                <button
                  type="button"
                  aria-current={current ? 'page' : undefined}
                  aria-label={badge ? `${label}, ${badge} unread` : label}
                  style={{
                    all: 'unset',
                    fontFamily: t.fontFamily,
                    boxSizing: 'border-box',
                    width: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '10px 4px',
                    background: current ? t.containerColor : 'transparent',
                    color: current ? t.linkColor : t.onColor,
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ position: 'relative', display: 'flex', fontSize: 24 }}>
                    {label === 'Account' ? <Avatar name="User Name" size="small" /> : icon}
                    {badge && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -14,
                          minWidth: 20,
                          height: 20,
                          borderRadius: 10,
                          background: t.containerColor,
                          color: t.inverseColor,
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </span>
                  {!collapsed && <span aria-hidden="true">{label}</span>}
                </button>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          aria-label={collapsed ? 'Expand global navigation' : 'Collapse global navigation'}
          onClick={() => setCollapsed((c) => !c)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '14px 0',
            display: 'flex',
            justifyContent: 'center',
            color: t.onColor,
          }}
        >
          {collapsed ? <IconMoveEndLine /> : <IconMoveStartLine />}
        </button>
      </nav>
    </div>
  )
}

export type GlobalNavProps = {
  course?: CourseNav
  activeNav?: NavKey
  institutionName?: string
  userName?: string
  userRole?: string
}

export default function GlobalNav(props: GlobalNavProps) {
  const themeKey = useAppThemeKey()
  return themeKey === 'legacy' ? <LegacyNav activeNav={props.activeNav ?? 'Dashboard'} /> : <ModernNav {...props} />
}

type Tokens = ReturnType<typeof useSurfaceTokens>

// One main navigation item (Figma: 44px tall, 36px icon container, 8px side padding, 8px gap). The
// page you are on is filled ("current"); an item whose sub navigation is open is tinted ("selected").
function NavButton({
  t,
  icon,
  label,
  current,
  selected,
  iconOnly,
  count,
  hasSub,
  expanded,
  onClick,
}: {
  t: Tokens
  icon: ReactNode
  label: string
  current?: boolean
  selected?: boolean
  iconOnly?: boolean
  count?: number
  hasSub?: boolean
  expanded?: boolean
  onClick?: () => void
}) {
  const [hover, setHover] = useState(false)
  const { nav } = t
  const background = current
    ? nav.itemCurrentBackground
    : selected
      ? nav.itemSelectedBackground
      : hover
        ? nav.itemHoverBackground
        : 'transparent'
  const unread = count ? <ScreenReaderContent>{`${count} unread`}</ScreenReaderContent> : null
  return (
    <button
      type="button"
      className="gnav-item"
      aria-current={current ? 'page' : undefined}
      aria-expanded={hasSub ? expanded : undefined}
      aria-label={iconOnly ? (count ? `${label}, ${count} unread` : label) : undefined}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: iconOnly ? 'center' : 'flex-start',
        gap: t.space.sm,
        width: iconOnly ? `calc(${nav.iconWrapperHeight} + 2 * ${nav.itemVerticalPadding} )` : '100%',
        height: `calc(${nav.iconWrapperHeight} + 2 * ${nav.itemVerticalPadding})`,
        margin: 0,
        padding: iconOnly ? 0 : `0 ${t.space.sm}`,
        border: 0,
        borderRadius: t.radiusMd,
        background,
        color: current ? nav.itemCurrentText : nav.textColor,
        font: 'inherit',
        fontFamily: t.fontFamily,
        fontSize: '1rem',
        lineHeight: 1.5,
        textAlign: 'start',
        cursor: 'pointer',
      }}
    >
      <span
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: nav.iconWrapperHeight }}
        aria-hidden={iconOnly ? undefined : 'true'}
      >
        {iconOnly && count ? (
          <Badge count={count} placement="top end">
            {icon}
          </Badge>
        ) : (
          icon
        )}
      </span>
      {!iconOnly && (
        <>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          {count ? (
            <>
              {/* The number is read through the "unread" text, so hide it here to avoid saying it twice. */}
              <span aria-hidden="true" style={{ display: 'flex' }}>
                <Badge standalone count={count} />
              </span>
              {unread}
            </>
          ) : null}
          {hasSub ? <ChevronRightInstUIIcon size="md" /> : null}
        </>
      )}
    </button>
  )
}

function ModernNav({
  course,
  activeNav = 'Dashboard',
  institutionName = 'Instructure',
  userName = 'User Name',
  userRole = 'student',
}: GlobalNavProps) {
  const [collapsed, setCollapsed] = useState(false)
  // Which sub navigation is open (null = closed) and which course the user went to.
  const [subNav, setSubNav] = useState<SubNav | null>(null)
  const [lastSubNav, setLastSubNav] = useState<SubNav>(course ? 'course' : 'courses')
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const t = useSurfaceTokens()
  const { nav } = t
  const openSub = (level: SubNav | null) => {
    setSubNav(level)
    if (level) setLastSubNav(level)
  }
  // Going to a course makes both "Courses" and that course the current location.
  const currentNav: NavKey = selectedCourse ? 'Courses' : activeNav
  // Figma (Dismiss and collapse behavior): the nav card has a 12px margin and 232px width. Collapsed,
  // the margin is 6px and the main navigation is 60px wide, icons only. The 32px sub navigation strip
  // stays in both states.
  const margin = collapsed ? nav.minimizedMargin : nav.margin
  const padX = collapsed ? t.space.sm : nav.mainNavMargin

  return (
    <div style={{ position: 'sticky', top: 0, height: '100vh', padding: margin, boxSizing: 'border-box', flexShrink: 0 }}>
      <nav
        aria-label="Global navigation"
        style={{
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          background: nav.backgroundColor,
          color: nav.textColor,
          // The 1px border is drawn inside the card, so the card is exactly 232px wide as in Figma.
          boxShadow: `inset 0 0 0 ${t.borderWidth} ${nav.borderColor}, ${t.shadowResting}`,
          borderRadius: collapsed ? nav.minimizedBorderRadius : t.radius,
          overflow: 'hidden',
        }}
      >
        {/* Main navigation: 200px expanded, 60px collapsed */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: nav.mainNavGap,
            height: '100%',
            boxSizing: 'border-box',
            width: collapsed ? '3.75rem' : '12.5rem',
            flexShrink: 0,
            paddingTop: collapsed ? 0 : nav.mainNavMargin,
          }}
        >
          {/* Institution */}
          {collapsed ? (
            <div
              style={{
                height: '3.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: `${t.borderWidth} solid ${nav.borderColor}`,
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            >
              <Avatar name={institutionName} shape="rectangle" size="small" />
            </div>
          ) : (
            <div style={{ ...row, gap: t.space.md, padding: t.space.sm, margin: `0 ${padX}`, flexShrink: 0 }}>
              <Avatar name={institutionName} shape="rectangle" size="small" />
              <Text variant="contentImportant">{institutionName}</Text>
            </div>
          )}

          {/* Account */}
          <div style={{ padding: `0 ${padX}`, flexShrink: 0 }}>
            {collapsed ? (
              <Tooltip renderTip={`${userName}, ${userRole}`} placement="end">
                <button
                  type="button"
                  className="gnav-item"
                  aria-label={`Account, ${userName}`}
                  style={{
                    boxSizing: 'border-box',
                    width: '2.75rem',
                    height: '2.75rem',
                    padding: 0,
                    border: 0,
                    borderRadius: t.radiusMd,
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Avatar name={userName} size="x-small" />
                </button>
              </Tooltip>
            ) : (
              <div
                style={{
                  ...row,
                  boxSizing: 'border-box',
                  height: '3rem',
                  padding: `0.375rem ${t.space.sm}`,
                  border: `${t.borderWidth} solid ${nav.borderColor}`,
                  borderRadius: t.radiusMd,
                }}
              >
                <Avatar name={userName} size="x-small" />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <Text variant="contentSmall">{userName}</Text>
                  <Text variant="legend">{userRole}</Text>
                </div>
              </div>
            )}
          </div>

          {/* Primary items */}
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: `0 ${padX}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: collapsed ? 'center' : 'stretch',
              gap: nav.navItemsGap,
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
            {NAV.map(({ key, icon, hasSubMenu, count }) => {
              const current = key === currentNav
              const hasSub = Boolean(hasSubMenu) && subNavEnabledFor(t)
              const button = (
                <NavButton
                  t={t}
                  icon={icon}
                  label={key}
                  current={current}
                  selected={hasSub && subNav !== null}
                  iconOnly={collapsed}
                  count={count}
                  hasSub={hasSub}
                  expanded={subNav !== null}
                  onClick={() => {
                    if (hasSub) openSub(subNav ? null : course ? 'course' : 'courses')
                    else openSub(null)
                  }}
                />
              )
              return (
                <li key={key} style={{ width: collapsed ? undefined : '100%' }}>
                  {collapsed ? (
                    <Tooltip renderTip={key} placement="end">
                      {button}
                    </Tooltip>
                  ) : (
                    button
                  )}
                </li>
              )
            })}
          </ul>

          {/* Collapse */}
          <div style={{ padding: `0 ${collapsed ? '0.625rem' : padX}`, flexShrink: 0 }}>
            {collapsed ? (
              <Tooltip renderTip="Expand sidebar" placement="end">
                <IconButton
                  screenReaderLabel="Expand sidebar"
                  withBackground={false}
                  withBorder={false}
                  onClick={() => setCollapsed(false)}
                >
                  <PanelLeftOpenInstUIIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <button
                type="button"
                className="gnav-item"
                onClick={() => setCollapsed(true)}
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: t.space.sm,
                  width: '100%',
                  height: '2.5rem',
                  padding: `0 ${t.space.lg}`,
                  margin: 0,
                  border: 0,
                  borderRadius: t.radiusMd,
                  background: 'transparent',
                  color: nav.textColor,
                  fontFamily: t.fontFamily,
                  fontSize: '1rem',
                  fontWeight: 500,
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                <PanelLeftCloseInstUIIcon />
                Collapse sidebar
              </button>
            )}
          </div>

          {/* Product logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              height: collapsed ? '3.75rem' : '3.5rem',
              margin: collapsed ? 0 : `0 ${padX} ${nav.mainNavMargin}`,
              borderTop: `${t.borderWidth} solid ${nav.borderColor}`,
              flexShrink: 0,
            }}
          >
            {/* The package has the Canvas mark but not the full wordmark: mark plus text stands in for it. */}
            <span style={{ display: 'flex', alignItems: 'center', gap: t.space.sm }}>
              <CanvasLogoInstUIIcon size="lg" inline={false} />
              {!collapsed && <Text variant="contentImportant">Canvas</Text>}
            </span>
          </div>
        </div>

        {/* Sub navigation: a 32px strip when closed, a 200px panel when open (Figma) */}
        {subNavEnabledFor(t) && (
          <div
            style={{
              width: subNav ? '12.5rem' : '2rem',
              flexShrink: 0,
              height: '100%',
              boxSizing: 'border-box',
              borderLeft: `${t.borderWidth} solid ${nav.borderColor}`,
              padding: subNav ? t.space.md : `${t.space.md} 0`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: subNav ? 'stretch' : 'center',
              gap: t.space.sm,
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
                  <PanelLeftOpenInstUIIcon />
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
                    <PanelLeftCloseInstUIIcon />
                  </IconButton>
                </div>
                {subNav === 'course' && course ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
                      <div style={{ display: 'flex', alignItems: 'center', minHeight: 28 }}>
                        <CondensedButton renderIcon={<ChevronLeftInstUIIcon />} onClick={() => openSub('courses')}>
                          Courses
                        </CondensedButton>
                      </div>
                      <Heading level="h2" variant="titleCardLarge">
                        {selectedCourse ? selectedCourse.split(':')[0] : course.name}
                      </Heading>
                      <View as="div" borderWidth="small 0 0 0" />
                    </div>
                    <div className="subnav-drilldown" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                      <Drilldown
                        key="course"
                        rootPageId="course"
                        width="100%"
                        themeOverride={{ borderColor: 'transparent', borderRadius: '0' }}
                      >
                        <Drilldown.Page id="course">
                          {course.items.map((item) => (
                            <Drilldown.Option
                              key={item.label}
                              id={item.label}
                              renderAfterLabel={
                                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  {item.unpublished && (
                                    <>
                                      <EyeOffInstUIIcon />
                                      <ScreenReaderContent>Unpublished</ScreenReaderContent>
                                    </>
                                  )}
                                  {item.current && <CheckInstUIIcon />}
                                </span>
                              }
                            >
                              {item.label}
                            </Drilldown.Option>
                          ))}
                        </Drilldown.Page>
                      </Drilldown>
                    </div>
                  </>
                ) : (
                  <div className="subnav-drilldown" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <Drilldown
                      key="courses"
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
                        {MY_COURSES.map((name) => (
                          <Drilldown.Option
                            key={name}
                            id={name}
                            onOptionClick={() => {
                              setSelectedCourse(name)
                              if (course) openSub('course')
                            }}
                            renderAfterLabel={selectedCourse === name ? <CheckInstUIIcon /> : undefined}
                          >
                            {name}
                          </Drilldown.Option>
                        ))}
                      </Drilldown.Page>
                    </Drilldown>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </nav>
    </div>
  )
}

// Figma's multilevel sub navigation is for the new themes only.
function subNavEnabledFor(t: Tokens) {
  return t.key !== 'legacy'
}

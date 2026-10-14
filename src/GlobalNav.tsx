import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Avatar,
  Badge,
  BaseButton,
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

  return (
    <div style={{ position: 'sticky', top: 0, height: '100vh', padding: 12, boxSizing: 'border-box', flexShrink: 0 }}>
      <View
        as="nav"
        aria-label="Global navigation"
        background="primary"
        borderWidth="small"
        borderRadius="large"
        shadow="resting"
        height="100%"
        display="block"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            height: '100%',
            boxSizing: 'border-box',
            padding: 12,
            width: collapsed ? 68 : 232,
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
              const selected = key === activeNav
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
                        aria-current={selected ? 'page' : undefined}
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
                      aria-current={selected ? 'page' : undefined}
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
      </View>
    </div>
  )
}

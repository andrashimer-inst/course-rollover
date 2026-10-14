import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Breadcrumb,
  Checkbox,
  CheckboxGroup,
  Heading,
  IconAiLine,
  IconAnnouncementLine,
  IconButton,
  IconXLine,
  Text,
  View,
} from '@instructure/ui/v11_7'
import GlobalNav from './GlobalNav'
import type { NavKey } from './GlobalNav'

// Desktop wrapper built only from InstUI components, following the Figma
// "Wrapper Guide": GlobalNav, header with page title, content area, optional
// trailing area, and a user-opened utility panel (one at a time).

type PanelKey = 'aiAgent' | 'notifications' | 'filtering'

export type DesktopWrapperProps = {
  pageTitle: string
  breadcrumb?: string[]
  activeNav?: NavKey
  fullWidth?: boolean
  trailingContent?: ReactNode
  trailingLabel?: string
  // Pages with filterable content can offer the filtering panel.
  filterContent?: ReactNode
  children: ReactNode
}

const PANEL_LABEL: Record<PanelKey, string> = {
  aiAgent: 'AI assistant',
  notifications: 'Notifications',
  filtering: 'Filters',
}

export default function DesktopWrapper({
  pageTitle,
  breadcrumb = [],
  activeNav = 'Dashboard',
  fullWidth = false,
  trailingContent,
  trailingLabel = 'Details',
  filterContent,
  children,
}: DesktopWrapperProps) {
  const [panel, setPanel] = useState<PanelKey | null>(null)
  const toggle = (key: PanelKey) => setPanel((p) => (p === key ? null : key))

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <GlobalNav activeNav={activeNav} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 360, padding: 32 }}>
          <header>
            <Breadcrumb label="You are here:">
              {breadcrumb.map((crumb) => (
                <Breadcrumb.Link key={crumb} href="#">
                  {crumb}
                </Breadcrumb.Link>
              ))}
              <Breadcrumb.Link>{pageTitle}</Breadcrumb.Link>
            </Breadcrumb>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 24,
              }}
            >
              <Heading level="h1">{pageTitle}</Heading>
              <div style={{ display: 'flex', gap: 8 }}>
                <IconButton
                  screenReaderLabel={PANEL_LABEL.aiAgent}
                  withBackground={false}
                  withBorder={false}
                  onClick={() => toggle('aiAgent')}
                >
                  <IconAiLine />
                </IconButton>
                <IconButton
                  screenReaderLabel={PANEL_LABEL.notifications}
                  withBackground={false}
                  withBorder={false}
                  onClick={() => toggle('notifications')}
                >
                  <IconAnnouncementLine />
                </IconButton>
              </div>
            </div>
          </header>

          <main
            style={{
              marginTop: 24,
              maxWidth: fullWidth ? 'none' : 960,
            }}
          >
            {children}
          </main>
        </div>

        {trailingContent && (
          <aside aria-label={trailingLabel} style={{ width: 320, flexShrink: 0 }}>
            <View as="div" borderWidth="0 0 0 small" padding="general.space2xl" height="100%">
              {trailingContent}
            </View>
          </aside>
        )}

        {panel && (
          <aside aria-label={PANEL_LABEL[panel]} style={{ width: 340, flexShrink: 0 }}>
            <View as="div" borderWidth="0 0 0 small" padding="general.spaceXl" height="100%">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Heading level="h2">{PANEL_LABEL[panel]}</Heading>
              <IconButton
                screenReaderLabel="Close panel"
                size="small"
                withBackground={false}
                withBorder={false}
                onClick={() => setPanel(null)}
              >
                <IconXLine />
              </IconButton>
            </div>
            <div style={{ marginTop: 16 }}>
              {panel === 'aiAgent' && <Text>Ask a question about this page.</Text>}
              {panel === 'notifications' && <Text>You have no new notifications.</Text>}
              {panel === 'filtering' && (filterContent ?? <Text>No filters on this page.</Text>)}
            </div>
            </View>
          </aside>
        )}
      </div>
    </div>
  )
}

export function DemoFilters() {
  return (
    <CheckboxGroup name="category" description="Category" defaultValue={[]}>
      <Checkbox label="Science and Technology" value="sci" />
      <Checkbox label="Arts and Humanities" value="arts" />
      <Checkbox label="Business and Management" value="biz" />
      <Checkbox label="Health and Medicine" value="health" />
    </CheckboxGroup>
  )
}

import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
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
} from '@instructure/ui/v11_7'
import GlobalNav from './GlobalNav'
import type { NavKey } from './GlobalNav'
import { useSurfaceTokens } from './appTheme'

// Desktop wrapper built only from InstUI components, following the Figma "Wrapper Guide" and the
// Wrapper example layouts: GlobalNav, then a container on the theme's page color (light grey in
// Light) holding the header area and the content area, an optional trailing area, and a
// utility panel the user opens from the header (one at a time). The panels are floating cards.
// Colors, radius and shadows come from the active theme's tokens.

type PanelKey = 'aiAgent' | 'notifications' | 'filtering'

export type DesktopWrapperProps = {
  pageTitle: string
  breadcrumb?: string[]
  activeNav?: NavKey
  // false: content is capped at the Figma max width (1100px). true: fills the space between panels.
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
  const t = useSurfaceTokens()
  const [panel, setPanel] = useState<PanelKey | null>(null)
  const toggle = (key: PanelKey) => setPanel((p) => (p === key ? null : key))

  // Figma panels: a card with a 12px margin from the window edge, full height, rounded.
  const sideSlot = (width: number): CSSProperties => ({
    width,
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    height: '100vh',
    padding: 12,
    boxSizing: 'border-box',
  })
  const card: CSSProperties = {
    height: '100%',
    boxSizing: 'border-box',
    overflowY: 'auto',
    padding: 12,
    background: t.containerColor,
    border: `${t.borderWidth} solid ${t.borderColor}`,
    borderRadius: t.radius,
    boxShadow: t.shadowResting,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.pageColor }}>
      <GlobalNav activeNav={activeNav} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
        {/* Container: 32px padding around the main container */}
        <div style={{ flex: 1, minWidth: 360, padding: 32, boxSizing: 'border-box' }}>
          <div
            style={{
              maxWidth: fullWidth ? 'none' : 1100,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            {/* Header area (Figma): a 40px row with the breadcrumb centered on the left and the
                global action buttons on the right, then 8px, then the page title. */}
            <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 40,
                  gap: 24,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Breadcrumb label="You are here:">
                    {breadcrumb.map((crumb) => (
                      <Breadcrumb.Link key={crumb} href="#">
                        {crumb}
                      </Breadcrumb.Link>
                    ))}
                    <Breadcrumb.Link>{pageTitle}</Breadcrumb.Link>
                  </Breadcrumb>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
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
              <Heading level="h1">{pageTitle}</Heading>
            </header>

            {/* Content area */}
            <main>{children}</main>
          </div>
        </div>

        {trailingContent && (
          <aside aria-label={trailingLabel} style={sideSlot(324)}>
            <div style={card}>{trailingContent}</div>
          </aside>
        )}

        {panel && (
          <aside aria-label={PANEL_LABEL[panel]} style={sideSlot(344)}>
            <div style={card}>
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
            </div>
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

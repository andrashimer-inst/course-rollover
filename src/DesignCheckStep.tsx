import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  Heading,
  IconArrowOpenDownLine,
  IconArrowOpenEndLine,
  IconAssignmentLine,
  IconCompleteSolid,
  IconDocumentLine,
  IconExportLine,
  IconFilterLine,
  IconLinkLine,
  IconModuleLine,
  IconQuestionLine,
  IconSyllabusLine,
  IconTrashLine,
  IconWarningBorderlessSolid,
  IconWarningSolid,
  IconButton,
  Link,
  Menu,
  ProgressBar,
  Table,
  Text,
  Tooltip,
} from '@instructure/ui/v11_7'
import FigmaAlert from './FigmaAlert'
import { useSurfaceTokens } from './appTheme'
import {
  COURSE_OBJECTIVES,
  DESIGN_RULES,
  DIMENSIONS,
  MODULE_OBJECTIVES,
  SUMMARY_PAGE,
  dimensionCount,
  openRules,
  visibleRules,
} from './designCheckData'
import type {
  DesignResource,
  DesignRule,
  DesignState,
  Dimension,
  ResourceKind,
  Severity,
} from './designCheckData'

// Step 2 of the copy wizard: Course design check. It checks the course against the course design rules
// (one rubric per dimension, from the "Course Design Rule definitions" sheet) and lists what it found:
// the objectives it identified, then every rule with its resources. A finding can be removed from the list
// (trash) when the educator decides it does not apply. What is left open goes into the summary's to-do list.
// Sample data only.

const noFill = { background: 'transparent' }

const KIND_ICON: Record<ResourceKind, ReactNode> = {
  assignment: <IconAssignmentLine />,
  module: <IconModuleLine />,
  page: <IconDocumentLine />,
  link: <IconLinkLine />,
  syllabus: <IconSyllabusLine />,
}

function SeverityIcon({ severity }: { severity: Severity }) {
  const label = { critical: 'Critical', warning: 'Needs attention', pass: 'Passed' }[severity]
  const icon =
    severity === 'critical' ? (
      <IconWarningBorderlessSolid color="error" />
    ) : severity === 'warning' ? (
      <IconWarningSolid color="warning" />
    ) : (
      <IconCompleteSolid color="success" />
    )
  return (
    <span role="img" aria-label={label} style={{ display: 'flex', fontSize: '1.25rem' }}>
      {icon}
    </span>
  )
}

function Chevron({ open, label, onClick }: { open: boolean; label: string; onClick: () => void }) {
  return (
    <IconButton
      screenReaderLabel={label}
      aria-expanded={open}
      size="small"
      withBackground={false}
      withBorder={false}
      onClick={onClick}
    >
      {open ? <IconArrowOpenDownLine /> : <IconArrowOpenEndLine />}
    </IconButton>
  )
}

// ---- What the check identified in the course ------------------------------------------------------------
function Identified() {
  const t = useSurfaceTokens()
  const [objectives, setObjectives] = useState(true)
  const [modules, setModules] = useState(true)
  const withObjectives = MODULE_OBJECTIVES.filter((m) => m.objective).length
  const line = `${t.borderWidth} solid ${t.borderColor}`
  const link = (text: string) => (
    <Link href="#" variant="standalone" onClick={(e: { preventDefault: () => void }) => e.preventDefault()}>
      {text}
    </Link>
  )
  return (
    <section
      aria-label="What the check identified"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: t.space.lg,
        padding: t.space.xl,
        background: t.containerColor,
        border: line,
        borderRadius: t.radiusMd,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: t.space.sm, flexWrap: 'wrap' }}>
        <Text weight="bold">Identified Course Summary:</Text>
        <span style={{ display: 'flex' }}>
          <IconDocumentLine />
        </span>
        {link(SUMMARY_PAGE)}
      </div>

      <div style={{ borderTop: line, paddingTop: t.space.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: t.space.sm }}>
          <Text weight="bold">Learning Objectives</Text>
          <Text color="secondary" size="small">
            {COURSE_OBJECTIVES.length} objectives found
          </Text>
          <Chevron open={objectives} label="Show course learning objectives" onClick={() => setObjectives((o) => !o)} />
        </div>
        {objectives && (
          <Table caption={() => 'Course learning objectives'} themeOverride={noFill}>
            <Table.Head themeOverride={noFill}>
              <Table.Row themeOverride={noFill}>
                <Table.ColHeader themeOverride={noFill} id="objective">Objective</Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="source">Source</Table.ColHeader>
              </Table.Row>
            </Table.Head>
            <Table.Body themeOverride={noFill}>
              {COURSE_OBJECTIVES.map((o) => (
                <Table.Row key={o.objective} themeOverride={noFill}>
                  <Table.Cell themeOverride={noFill}>{o.objective}</Table.Cell>
                  <Table.Cell themeOverride={noFill}>{link(o.source)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>

      <div style={{ borderTop: line, paddingTop: t.space.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: t.space.sm }}>
          <Text weight="bold">Module Learning Objectives</Text>
          <Text color="secondary" size="small">
            {withObjectives} modules with objectives
          </Text>
          <Chevron open={modules} label="Show module learning objectives" onClick={() => setModules((o) => !o)} />
        </div>
        {modules && (
          <Table caption={() => 'Module learning objectives'} themeOverride={noFill}>
            <Table.Head themeOverride={noFill}>
              <Table.Row themeOverride={noFill}>
                <Table.ColHeader themeOverride={noFill} id="module">Module</Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="mobjective">Objective</Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="msource">Source</Table.ColHeader>
              </Table.Row>
            </Table.Head>
            <Table.Body themeOverride={noFill}>
              {MODULE_OBJECTIVES.map((m) => (
                <Table.Row key={m.module} themeOverride={noFill}>
                  <Table.Cell themeOverride={noFill}>
                    <Text weight="bold">{m.module}</Text>
                  </Table.Cell>
                  <Table.Cell themeOverride={noFill}>
                    {m.objective ?? <Text fontStyle="italic">no objectives found</Text>}
                  </Table.Cell>
                  <Table.Cell themeOverride={noFill}>{m.source ? link(m.source) : null}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </section>
  )
}

// ---- One rule in the results ----------------------------------------------------------------------------
function ResourceRow({
  resource,
  kind,
  severity,
  onRemove,
}: {
  resource: DesignResource
  kind: ResourceKind
  severity: Severity
  onRemove: () => void
}) {
  const t = useSurfaceTokens()
  const [open, setOpen] = useState(false)
  const line = `${t.borderWidth} solid ${t.borderColor}`
  return (
    <li style={{ borderTop: line }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: t.space.md, padding: `${t.space.sm} 0` }}>
        <span style={{ display: 'flex', fontSize: '1.25rem' }}>{KIND_ICON[kind]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href="#" variant="standalone" onClick={(e: { preventDefault: () => void }) => e.preventDefault()}>
            {resource.title}
          </Link>
        </div>
        {severity !== 'pass' && (
          <>
            <IconButton
              screenReaderLabel={`Remove ${resource.title} from the results`}
              size="small"
              withBackground={false}
              withBorder={false}
              onClick={onRemove}
            >
              <IconTrashLine />
            </IconButton>
            <Chevron open={open} label={`Show why ${resource.title} was flagged`} onClick={() => setOpen((o) => !o)} />
          </>
        )}
      </div>
      {open && resource.reason && (
        <div
          style={{
            margin: `0 0 ${t.space.md}`,
            padding: t.space.lg,
            borderRadius: t.radiusMd,
            background: 'color-mix(in srgb, currentColor 6%, transparent)',
          }}
        >
          <Text weight="bold" as="p">
            Reason:
          </Text>
          <Text as="p">{resource.reason}</Text>
        </div>
      )}
    </li>
  )
}

function RuleRow({ rule, onRemove }: { rule: DesignRule; onRemove: (id: string) => void }) {
  const t = useSurfaceTokens()
  const [open, setOpen] = useState(false)
  const line = `${t.borderWidth} solid ${t.borderColor}`
  const count = rule.resources?.length
  return (
    <li style={{ borderTop: line }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: t.space.md, padding: `${t.space.md} 0` }}>
        <SeverityIcon severity={rule.severity} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: t.space.sm }}>
          <Text weight="bold">{rule.title}</Text>
          <Tooltip renderTip={rule.why} placement="top">
            <IconButton
              screenReaderLabel={`Why this matters: ${rule.title}`}
              size="small"
              withBackground={false}
              withBorder={false}
            >
              <IconQuestionLine />
            </IconButton>
          </Tooltip>
        </div>
        <Text color="secondary">{count !== undefined ? `${count} ${count === 1 ? 'resource' : 'resources'}` : 'course-level issue'}</Text>
        {count === undefined && (
          <IconButton
            screenReaderLabel={`Remove ${rule.title} from the results`}
            size="small"
            withBackground={false}
            withBorder={false}
            onClick={() => onRemove(rule.id)}
          >
            <IconTrashLine />
          </IconButton>
        )}
        <Chevron open={open} label={`Show details for ${rule.title}`} onClick={() => setOpen((o) => !o)} />
      </div>
      {open && (
        <div style={{ paddingBottom: t.space.md, paddingInlineStart: `calc(1.25rem + ${t.space.md})` }}>
          {rule.resources ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {rule.resources.map((r) => (
                <ResourceRow
                  key={r.id}
                  resource={r}
                  kind={r.kind}
                  severity={rule.severity}
                  onRemove={() => onRemove(r.id)}
                />
              ))}
            </ul>
          ) : (
            <div
              style={{
                padding: t.space.lg,
                borderRadius: t.radiusMd,
                background: 'color-mix(in srgb, currentColor 6%, transparent)',
              }}
            >
              <Text weight="bold" as="p">
                Reason:
              </Text>
              <Text as="p">{rule.reason}</Text>
              {rule.references && (
                <>
                  <Text weight="bold" as="p">
                    References:
                  </Text>
                  <ul style={{ margin: 0, paddingInlineStart: t.space.xl }}>
                    {rule.references.map((ref) => (
                      <li key={ref}>
                        <Text>{ref}</Text>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

// A CSV file of the results, for the Export button.
function exportCsv(rules: DesignRule[]) {
  const rows = [['Rule', 'Result', 'Resource', 'Reason']]
  for (const r of rules) {
    const result = { critical: 'Critical', warning: 'Needs attention', pass: 'Passed' }[r.severity]
    if (r.resources) for (const x of r.resources) rows.push([r.title, result, x.title, x.reason ?? ''])
    else rows.push([r.title, result, 'Course level', r.reason ?? ''])
  }
  const csv = rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'course-design-review.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ---- The step ---------------------------------------------------------------------------------------------
export default function DesignCheckStep({
  state,
  setState,
}: {
  state: DesignState
  setState: (next: DesignState) => void
}) {
  const t = useSurfaceTokens()
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const rules = visibleRules(state)
  const enabledRules = DESIGN_RULES.filter((r) => state.enabled.includes(r.dimension)).length
  const open = openRules(state)
  const critical = open.filter((r) => r.severity === 'critical').length

  useEffect(() => {
    if (!analyzing) return
    const timer = setInterval(() => setProgress((p) => Math.min(100, p + 20)), 200)
    return () => clearInterval(timer)
  }, [analyzing])
  useEffect(() => {
    if (!analyzing || progress < 100) return
    const done = setTimeout(() => {
      setAnalyzing(false)
      setState({ ...state, analyzed: true, removed: [] })
    }, 300)
    return () => clearTimeout(done)
  }, [analyzing, progress, state, setState])

  const analyze = () => {
    setProgress(0)
    setAnalyzing(true)
  }
  const toggleDimension = (d: Dimension) =>
    setState({
      ...state,
      enabled: state.enabled.includes(d) ? state.enabled.filter((x) => x !== d) : [...state.enabled, d],
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.xl }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: t.gapButtons, flexWrap: 'wrap' }}>
        <Menu
          label="Rubrics"
          trigger={
            <Button renderIcon={<IconFilterLine />}>
              Rubrics ({enabledRules}/{DESIGN_RULES.length})
            </Button>
          }
        >
          <Menu.Group label="Choose the rubrics to check" allowMultiple selected={state.enabled}>
            {DIMENSIONS.map((d) => (
              <Menu.Item key={d} value={d} onSelect={() => toggleDimension(d)}>
                {d} ({dimensionCount(DESIGN_RULES, d)})
              </Menu.Item>
            ))}
          </Menu.Group>
        </Menu>
        <Button color="primary" interaction={analyzing ? 'disabled' : 'enabled'} onClick={analyze}>
          {state.analyzed ? 'Analyze Course again' : 'Analyze Course'}
        </Button>
      </div>

      {analyzing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.md }}>
          <Heading level="h4" variant="titleCardMini">
            Checking the course
          </Heading>
          <ProgressBar
            screenReaderLabel="Checking the course"
            valueNow={progress}
            valueMax={100}
            renderValue={({ valueNow }) => `${valueNow}%`}
          />
        </div>
      )}

      {!analyzing && !state.analyzed && (
        <FigmaAlert variant="info" type="inline">
          Choose Analyze Course to check Portfolio Test against the course design rules. You can skip this step. Nothing in
          the copy changes.
        </FigmaAlert>
      )}

      {!analyzing && state.analyzed && (
        <>
          <FigmaAlert variant={critical > 0 ? 'warning' : 'success'} type="inline">
            {open.length === 0
              ? 'No open design issues. The course meets every rule you checked.'
              : `${open.length} design ${open.length === 1 ? 'issue is' : 'issues are'} open, ${critical} critical. They go into your to-do list after the copy.`}
          </FigmaAlert>

          <Identified />

          <section aria-label="Course Design Review Results" style={{ display: 'flex', flexDirection: 'column', gap: t.space.md }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: t.space.lg }}>
              <Heading level="h3" variant="titleCardRegular">
                Course Design Review Results
              </Heading>
              <Button renderIcon={<IconExportLine />} onClick={() => exportCsv(rules)}>
                Export
              </Button>
            </div>
            {rules.length === 0 ? (
              <Text color="secondary">No rubrics are switched on. Choose Rubrics to pick which rules to check.</Text>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {rules.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onRemove={(id) => setState({ ...state, removed: [...state.removed, id] })}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

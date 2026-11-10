import { Button, Checkbox, CloseButton, Heading, IconQuestionLine, Modal, Text, Tooltip } from '@instructure/ui/v11_7'
import { DESIGN_RULES, DIMENSIONS } from './designCheckData'
import { EXTRA_RULES } from './reviewData'
import { useSurfaceTokens } from './appTheme'

// The course readiness checker: the rules the check looks at, grouped by area. It opens after step 2 and from step 3. The educator can switch any of them off for this
// course. A rule that is off is not a finding in the review, and it is not in the readiness check.

const ALL_RULES = [...DESIGN_RULES, ...EXTRA_RULES]

export default function RulesModal({
  open, off, setOff, onClose, onAnalyze,
}: {
  open: boolean
  // The ids of the rules that are switched off.
  off: string[]
  setOff: (ids: string[]) => void
  onClose: () => void
  // Closes the window and starts the analysis with the chosen rules.
  onAnalyze: () => void
}) {
  const t = useSurfaceTokens()
  const on = ALL_RULES.filter((r) => !off.includes(r.id)).length
  const setMany = (ids: string[], value: boolean) =>
    setOff(value ? off.filter((id) => !ids.includes(id)) : [...new Set([...off, ...ids])])

  return (
    <Modal open={open} onDismiss={onClose} size="medium" label="Course readiness checker" shouldCloseOnDocumentClick={false}>
      <Modal.Header>
        <CloseButton placement="end" offset="small" onClick={onClose} screenReaderLabel="Close" />
        <Heading variant="titleSection" level="h2">Course readiness checker</Heading>
      </Modal.Header>
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.lg }}>
          <Text as="div" color="secondary" aria-live="polite">{on} of {ALL_RULES.length} selected</Text>
          <div style={{ display: 'flex', gap: t.space.sm }}>
            <Button size="small" onClick={() => setOff([])}>Select all</Button>
            <Button size="small" onClick={() => setOff(ALL_RULES.map((r) => r.id))}>Deselect all</Button>
          </div>
          {DIMENSIONS.map((d) => {
            const rules = ALL_RULES.filter((r) => r.dimension === d)
            if (rules.length === 0) return null
            const n = rules.filter((r) => !off.includes(r.id)).length
            return (
              <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm }}>
                <Checkbox
                  label={<Text weight="bold">{d}</Text>}
                  checked={n === rules.length}
                  indeterminate={n > 0 && n < rules.length}
                  onChange={() => setMany(rules.map((r) => r.id), n < rules.length)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: t.space.sm, paddingInlineStart: t.space.xl }}>
                  {rules.map((r) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: t.space.sm }}>
                      <Checkbox label={r.title} checked={!off.includes(r.id)} onChange={() => setMany([r.id], off.includes(r.id))} />
                      <Tooltip renderTip={r.why} placement="top">
                        <span tabIndex={0} role="img" aria-label={`Why it matters: ${r.why}`} style={{ display: 'inline-flex', cursor: 'help' }}>
                          <IconQuestionLine />
                        </span>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} margin="0 small 0 0">Cancel</Button>
        <Button color="primary" onClick={onAnalyze}>Analyze</Button>
      </Modal.Footer>
    </Modal>
  )
}

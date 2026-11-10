import { useState } from 'react'
import { Calendar, CalendarInstUIIcon, IconButton, Popover } from '@instructure/ui/v11_7'

// A secondary icon button that opens the same calendar the date field uses (InstUI Calendar in a Popover). Days that are
// not teaching days cannot be picked. `value` and what `onPick` returns are ISO dates (YYYY-MM-DD).

// The calendar hands back full ISO strings in UTC, so a date is read as the local day it stands for.
const isoDay = (iso: string) => iso.slice(0, 10)
const dateOf = (iso: string) => (iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso))
const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function DatePickerButton({
  value, label, onPick,
}: {
  value: string
  // Screen reader label of the button, like "Change the date of Quiz 1".
  label: string
  onPick: (iso: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(isoDay(value))
  return (
    <Popover
      on="click"
      isShowingContent={open}
      onShowContent={() => {
        setMonth(isoDay(value))
        setOpen(true)
      }}
      onHideContent={() => setOpen(false)}
      shouldContainFocus
      shouldReturnFocus
      placement="bottom end"
      screenReaderLabel="Date picker"
      renderTrigger={
        <IconButton size="small" screenReaderLabel={label}>
          <CalendarInstUIIcon />
        </IconButton>
      }
    >
      <div style={{ padding: '0.5rem' }}>
        <Calendar
          visibleMonth={month}
          currentDate={isoDay(value)}
          selectedDate={isoDay(value)}
          selectedLabel="Selected"
          onRequestRenderNextMonth={(_e: unknown, requested: string) => setMonth(requested)}
          onRequestRenderPrevMonth={(_e: unknown, requested: string) => setMonth(requested)}
          onDateSelected={(iso: string) => {
            onPick(localIso(dateOf(iso)))
            setOpen(false)
          }}
        />
      </div>
    </Popover>
  )
}

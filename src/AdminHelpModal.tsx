import { useState } from 'react'
import { Button, CloseButton, Heading, Modal, Text, TextArea, TextInput } from '@instructure/ui/v11_7'
import type { ReviewRow } from './reviewData'

// A quick message to the admin about one item of the review. It opens from the help button on a row, with the
// subject and the message filled in from what was found. Nothing is sent anywhere: this is a prototype.

export default function AdminHelpModal({
  row, onClose, onSend,
}: {
  row: ReviewRow | null
  onClose: () => void
  onSend: (id: string) => void
}) {
  return (
    <Modal open={row !== null} onDismiss={onClose} size="medium" label="Ask your admin for help" shouldCloseOnDocumentClick={false}>
      {row && <Form key={row.id} row={row} onClose={onClose} onSend={onSend} />}
    </Modal>
  )
}

function Form({ row, onClose, onSend }: { row: ReviewRow; onClose: () => void; onSend: (id: string) => void }) {
  const found = row.findings.map((f) => f.detail).join(' ') || row.note?.text || ''
  const [subject, setSubject] = useState(`Help with “${row.title}” in the course copy`)
  const [message, setMessage] = useState(
    `Hi,\n\nI am copying content into my course and the review found a problem I need help with.\n\nItem: ${row.title}\nWhat was found: ${found}\n\nCan you help me fix it before the term starts?\n\nThank you`,
  )
  return (
    <>
      <Modal.Header>
        <CloseButton placement="end" offset="small" onClick={onClose} screenReaderLabel="Close" />
        <Heading level="h2">Ask your admin for help</Heading>
      </Modal.Header>
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Text color="secondary">Your admin gets this message by email. You can change the text first.</Text>
          <TextInput renderLabel="To" value="Your admin" readOnly onChange={() => {}} />
          <TextInput renderLabel="Subject" value={subject} onChange={(_e, v) => setSubject(v)} />
          <TextArea label="Message" height="12rem" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button color="primary" onClick={() => { onSend(row.id); onClose() }}>Send message</Button>
        </div>
      </Modal.Footer>
    </>
  )
}

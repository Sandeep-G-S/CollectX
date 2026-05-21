const map = {
  // general status
  OPEN:        'blue',   ACTIVE:      'green',  CLOSED:    'gray',
  RESOLVED:    'green',  INPROGRESS:  'purple', IN_PROGRESS:'purple',
  PENDING:     'yellow', PROCESSING:  'blue',

  // payment / PTP
  KEPT:        'green',  BROKEN:      'red',    POSTED:     'green',
  FAILED:      'red',    REQUESTED:   'yellow', APPROVED:   'green',
  REJECTED:    'red',    COMPLETED:   'green',  CANCELLED:  'gray',
  PAID:        'green',  PARTIAL:     'yellow', OVERDUE:    'red',

  // legal
  INITIATED:   'blue',   DISPOSED:    'gray',   REVERSED:   'orange',
  EXPIRED:     'gray',   HONORED:     'green',  DEFAULTED:  'red',

  // field
  EMPANELED:   'green',  SUSPENDED:   'red',
  SEIZED:      'red',    STORED:      'yellow', AUCTIONED:  'gray',
  RELEASED:    'green',

  // PTP outcomes
  CONNECTED:      'green',  NO_ANSWER:   'yellow',
  REFUSED:        'red',    PARTIAL_PAYMENT: 'teal',
  PTP_GIVEN:      'blue',   NOT_HOME:    'yellow',

  // DPD buckets
  '0-30':      'green',  '31-60':     'yellow',
  '61-90':     'orange', '90+':       'red',

  // risk
  LOW:         'green',  MED:         'yellow', HIGH:       'red',
  MEDIUM:      'yellow', CRITICAL:    'red',

  // loan status
  CURRENT:     'green',  DELINQUENT:  'yellow', NPA:        'red',

  // channels
  CALL:        'blue',   SMS:         'teal',   EMAIL:      'purple',
  VISIT:       'orange', INAPP:       'gray',

  // notifications
  UNREAD:      'blue',   READ:        'gray',   DISMISSED:  'gray',

  // consent
  ALLOWED:     'green',  OPTOUT:      'red',

  // strategy
  EMPANELLED:  'green',
}

export default function Badge({ value }) {
  const key   = String(value ?? '').toUpperCase().replace(/\s+/g, '_')
  const color = map[key] || 'gray'
  return (
    <span className={`badge badge-${color}`}>
      {String(value ?? '').replace(/_/g, ' ')}
    </span>
  )
}

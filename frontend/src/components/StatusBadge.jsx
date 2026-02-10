const map = {
  ACTIVE: 'success',
  INACTIVE: 'muted',
  AVAILABLE: 'success',
  ASSIGNED: 'warning',
  MAINTENANCE: 'warning',
  LOST: 'danger',
  RETIRED: 'muted',
  GOOD: 'success',
  DAMAGED: 'danger',
  NEEDS_REPAIR: 'warning',
  OPEN: 'warning',
  CLOSED: 'success',
  USED: 'muted',
  EXPIRED: 'danger',
}

export default function StatusBadge({ value }) {
  const variant = map[value] || 'muted'
  const label = value
    ? value
        .toString()
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/(^|\s)\S/g, (t) => t.toUpperCase())
    : '-'
  return <span className={`badge badge--${variant}`}>{label}</span>
}

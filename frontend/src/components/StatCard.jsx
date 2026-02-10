export default function StatCard({ label, value, tone = 'primary', note }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div>
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{value}</h3>
        {note ? <p className="stat-note">{note}</p> : null}
      </div>
      <div className="stat-orb" />
    </div>
  )
}

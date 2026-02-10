export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">Module</p>
        <h1>{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="page-action">{action}</div> : null}
    </div>
  )
}

import DataTable from 'react-data-table-component'

const customStyles = {
  table: {
    style: {
      backgroundColor: 'transparent',
    },
  },
  header: {
    style: {
      minHeight: '56px',
      paddingLeft: '24px',
      paddingRight: '24px',
      color: 'var(--ink)',
      fontFamily: 'var(--font-heading)',
      fontSize: '18px',
    },
  },
  headRow: {
    style: {
      backgroundColor: 'var(--card-alt)',
      borderRadius: '16px',
      border: '1px solid var(--border)',
    },
  },
  headCells: {
    style: {
      fontWeight: 600,
      color: 'var(--muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontSize: '11px',
    },
  },
  rows: {
    style: {
      minHeight: '64px',
      borderBottom: '1px solid var(--border)',
    },
  },
  cells: {
    style: {
      paddingTop: '12px',
      paddingBottom: '12px',
    },
  },
}

export default function AppTable({ title, columns, data, actions, loading }) {
  return (
    <div className="table-card">
      <div className="table-card__header">
        <div>
          <h3>{title}</h3>
          <p>Vue detaillee avec pagination.</p>
        </div>
        {actions ? <div className="table-card__actions">{actions}</div> : null}
      </div>
      <DataTable
        columns={columns}
        data={data}
        pagination
        highlightOnHover
        responsive
        customStyles={customStyles}
        progressPending={loading}
        noDataComponent="Aucune donnee disponible."
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import AppTable from '../components/AppTable'
import StatusBadge from '../components/StatusBadge'
import api from '../api/axios'
import { unwrapResults } from '../utils/format'

export default function Rapports() {
  const [stats, setStats] = useState({
    equipements_by_status: [],
    agents_active: 0,
    agents_inactive: 0,
  })
  const [equipements, setEquipements] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleExport = async (format) => {
    const response = await api.get(`/rapports/?export=${format}`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = format === 'excel' ? 'rapports.xlsx' : 'rapports.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const [reportsRes, equipRes, agentsRes] = await Promise.all([
          api.get('/rapports/'),
          api.get('/equipements/'),
          api.get('/agents/'),
        ])
        setStats(reportsRes.data)
        setEquipements(unwrapResults(equipRes.data))
        setAgents(unwrapResults(agentsRes.data))
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            'Impossible de charger les rapports.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const countByStatus = (status) =>
    stats.equipements_by_status?.find((item) => item.status === status)?.total ||
    0

  const equipementsDisponibles = countByStatus('AVAILABLE')
  const equipementsAffectes = countByStatus('ASSIGNED')

  const columns = [
    { name: 'Type', selector: (row) => row.type, sortable: true },
    { name: 'Serie', selector: (row) => row.serial_number },
    { name: 'Statut', cell: (row) => <StatusBadge value={row.status} /> },
    { name: 'Etat', cell: (row) => <StatusBadge value={row.condition} /> },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Rapports"
        subtitle="Indicateurs synthese et exports prepares."
      />

      {error ? <div className="alert">{error}</div> : null}

      <div className="grid grid--stats">
        <StatCard
          label="Equipements disponibles"
          value={equipementsDisponibles}
          note="Stock mobilisable"
        />
        <StatCard
          label="Equipements affectes"
          value={equipementsAffectes}
          tone="secondary"
          note="En cours de mission"
        />
        <StatCard
          label="Agents totaux"
          value={stats.agents_active + stats.agents_inactive}
          tone="accent"
          note="Base de reference"
        />
      </div>

      <div className="grid grid--two">
        <div className="card">
          <h3>Exports rapides</h3>
          <p className="subtitle">
            Generez un export Excel ou PDF pour les reunions hebdomadaires.
          </p>
          <div className="button-row">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => handleExport('excel')}
            >
              Export Excel
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => handleExport('pdf')}
            >
              Export PDF
            </button>
          </div>
        </div>
        <div className="card card--highlight">
          <h3>Suivi des agents</h3>
          <p>
            {stats.agents_active} agents actifs actuellement sur le terrain.
          </p>
          <div className="mini-list">
            {agents.slice(0, 3).map((agent) => (
              <div key={agent.id}>
                <span>{agent.matricule}</span>
                <p>
                  {agent.first_name} {agent.last_name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AppTable
        title="Equipements recents"
        columns={columns}
        data={equipements}
        loading={loading}
      />
    </div>
  )
}

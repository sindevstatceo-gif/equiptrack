import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import AppTable from '../components/AppTable'
import StatusBadge from '../components/StatusBadge'
import api from '../api/axios'
import { formatDate, unwrapResults } from '../utils/format'

export default function Dashboard() {
  const [stats, setStats] = useState({
    agents_active: 0,
    agents_inactive: 0,
    equipements_by_status: [],
    incidents_by_type: [],
    incidents_by_status: [],
  })
  const [activities, setActivities] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingIncidents, setLoadingIncidents] = useState(true)
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true)
      try {
        const { data } = await api.get('/rapports/')
        setStats(data)
      } catch (err) {
        setError(
          err?.response?.data?.detail || 'Impossible de charger les rapports.'
        )
      } finally {
        setLoadingStats(false)
      }
    }

    const loadIncidents = async () => {
      setLoadingIncidents(true)
      try {
        const { data } = await api.get('/incidents/?page=1')
        setIncidents(unwrapResults(data))
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "Impossible de charger les incidents."
        )
      } finally {
        setLoadingIncidents(false)
      }
    }

    const loadActivities = async () => {
      setLoadingActivities(true)
      try {
        const [affectRes, restRes] = await Promise.all([
          api.get('/affectations/?page=1'),
          api.get('/restitutions/?page=1'),
        ])
        const affectations = unwrapResults(affectRes.data).map((item) => ({
          type: 'Affectation',
          date: item.assigned_at,
          label: `Affectation ${item.equipement_detail?.serial_number || item.equipement} -> ${item.agent_detail?.matricule || item.agent}`,
        }))
        const restitutions = unwrapResults(restRes.data).map((item) => ({
          type: 'Restitution',
          date: item.returned_at,
          label: `Restitution ${item.affectation_detail?.equipement_detail?.serial_number || item.affectation_detail?.equipement || item.affectation}`,
        }))
        const merged = [...affectations, ...restitutions]
          .filter((item) => item.date)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3)
        setActivities(merged)
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "Impossible de charger les activites."
        )
      } finally {
        setLoadingActivities(false)
      }
    }

    loadStats()
    loadIncidents()
    loadActivities()
  }, [])

  const activeAgents = stats.agents_active
  const totalAgents = stats.agents_active + stats.agents_inactive
  const totalEquipements = stats.equipements_by_status.reduce(
    (sum, item) => sum + (item.total || 0),
    0
  )
  const availableEquipements =
    stats.equipements_by_status.find((item) => item.status === 'AVAILABLE')
      ?.total || 0
  const availabilityPercent = totalEquipements
    ? Math.round((availableEquipements / totalEquipements) * 100)
    : 0
  const incidentsOpen =
    stats.incidents_by_status?.find((item) => item.status === 'OPEN')?.total || 0

  const columns = [
    {
      name: 'Equipement',
      selector: (row) =>
        row.equipement_detail?.serial_number || row.equipement,
      sortable: true,
    },
    {
      name: 'Agent',
      selector: (row) => row.agent_detail?.matricule || row.agent,
      sortable: true,
    },
    { name: 'Type', selector: (row) => row.incident_type },
    {
      name: 'Statut',
      cell: (row) => <StatusBadge value={row.status} />,
    },
    { name: 'Date', selector: (row) => formatDate(row.reported_at) },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Dashboard"
        subtitle="Vue globale des equipements, agents et incidents en cours."
      />

      <div className="grid grid--stats">
        <StatCard
          label="Agents actifs"
          value={`${activeAgents}/${totalAgents}`}
          note="Effectif en terrain"
        />
        <StatCard
          label="Equipements suivis"
          value={totalEquipements}
          tone="secondary"
          note="Parc inventorie"
        />
        <StatCard
          label="Incidents ouverts"
          value={incidentsOpen}
          tone="accent"
          note="Suivi prioritaire"
        />
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="grid grid--two">
        <div className="card">
          <h3>Focus deploiement</h3>
          <p className="subtitle">Dernieres affectations et restitutions.</p>
          <div className="mini-list">
            {loadingActivities ? (
              <div>
                <span>Chargement...</span>
                <p>Lecture des donnees en base.</p>
              </div>
            ) : activities.length ? (
              activities.map((item, index) => (
                <div key={`${item.type}-${item.date}-${index}`}>
                  <span>{item.type}</span>
                  <p>{item.label}</p>
                </div>
              ))
            ) : (
              <div>
                <span>Aucune activite</span>
                <p>Pas encore d enregistrement.</p>
              </div>
            )}
          </div>
        </div>
        <div className="card card--highlight">
          <h3>Prochaine priorite</h3>
          <p>
            Consolider les stocks disponibles avant la prochaine vague de
            collecte et valider les maintenances en attente.
          </p>
          <div className="progress">
            <div>
              <span>Disponibilite</span>
              <strong>{availabilityPercent}%</strong>
            </div>
            <div className="progress__bar">
              <div
                className="progress__fill"
                style={{ width: `${availabilityPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <AppTable
        title="Incidents recents"
        columns={columns}
        data={incidents}
        loading={loadingStats || loadingIncidents || loadingActivities}
      />
    </div>
  )
}

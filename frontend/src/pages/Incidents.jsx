import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../components/PageHeader'
import AppTable from '../components/AppTable'
import StatusBadge from '../components/StatusBadge'
import api from '../api/axios'
import { formatDate, toIsoDate, unwrapResults } from '../utils/format'

export default function Incidents() {
  const [rows, setRows] = useState([])
  const [agents, setAgents] = useState([])
  const [equipements, setEquipements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      equipement: '',
      agent: '',
      incident_type: 'BREAKDOWN',
      status: 'OPEN',
      reported_at: '',
      description: '',
    },
  })

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [incidentsRes, agentsRes, equipementsRes] = await Promise.all([
        api.get('/incidents/'),
        api.get('/agents/'),
        api.get('/equipements/'),
      ])
      setRows(unwrapResults(incidentsRes.data))
      setAgents(unwrapResults(agentsRes.data))
      setEquipements(unwrapResults(equipementsRes.data))
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de charger les incidents.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const onSubmit = async (data) => {
    setError('')
    try {
      const payload = {
        ...data,
        reported_at: toIsoDate(data.reported_at),
      }
      const { data: created } = await api.post('/incidents/', payload)
      setRows((prev) => [created, ...prev])
      reset()
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de creer l incident.'
      )
    }
  }

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
    { name: 'Statut', cell: (row) => <StatusBadge value={row.status} /> },
    { name: 'Declare le', selector: (row) => formatDate(row.reported_at) },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Incidents"
        subtitle="Declaration, suivi et cloture des incidents."
      />

      {error ? <div className="alert">{error}</div> : null}

      <div className="card">
        <h3>Declaration incident</h3>
        <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label>Equipement</label>
            <select
              className="select"
              {...register('equipement', { required: 'Champ obligatoire' })}
            >
              <option value="">Selectionner</option>
              {equipements.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.serial_number} ({item.type})
                </option>
              ))}
            </select>
            {errors.equipement && (
              <span className="field__error">{errors.equipement.message}</span>
            )}
          </div>
          <div className="field">
            <label>Agent</label>
            <select
              className="select"
              {...register('agent', { required: 'Champ obligatoire' })}
            >
              <option value="">Selectionner</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.matricule} - {agent.first_name} {agent.last_name}
                </option>
              ))}
            </select>
            {errors.agent && (
              <span className="field__error">{errors.agent.message}</span>
            )}
          </div>
          <div className="field">
            <label>Type incident</label>
            <select className="select" {...register('incident_type')}>
              <option value="LOSS">Perte</option>
              <option value="THEFT">Vol</option>
              <option value="BREAKDOWN">Panne</option>
            </select>
          </div>
          <div className="field">
            <label>Statut</label>
            <select className="select" {...register('status')}>
              <option value="OPEN">Ouvert</option>
              <option value="CLOSED">Cloture</option>
            </select>
          </div>
          <div className="field">
            <label>Date declaration</label>
            <input
              className="input"
              type="date"
              {...register('reported_at', { required: 'Champ obligatoire' })}
            />
            {errors.reported_at && (
              <span className="field__error">{errors.reported_at.message}</span>
            )}
          </div>
          <div className="field field--full">
            <label>Description</label>
            <textarea
              className="textarea"
              rows="3"
              {...register('description', { required: 'Champ obligatoire' })}
            />
            {errors.description && (
              <span className="field__error">{errors.description.message}</span>
            )}
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      <AppTable
        title="Historique incidents"
        columns={columns}
        data={rows}
        loading={loading}
      />
    </div>
  )
}

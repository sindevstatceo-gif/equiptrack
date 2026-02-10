import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../components/PageHeader'
import AppTable from '../components/AppTable'
import StatusBadge from '../components/StatusBadge'
import api from '../api/axios'
import { formatDate, toIsoDate, unwrapResults } from '../utils/format'

export default function Affectations() {
  const [signaturePreview, setSignaturePreview] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')

  const handleFilePreview = (event, setter) => {
    const file = event.target.files?.[0]
    if (!file) {
      setter('')
      return
    }
    const url = URL.createObjectURL(file)
    setter(url)
  }
  const handleDownload = async (id) => {
    const response = await api.get(`/affectations/${id}/pdf/`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `affectation_${id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }
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
      assigned_at: '',
      expected_return_at: '',
      is_active: true,
    },
  })

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [affectationsRes, agentsRes, equipementsRes] = await Promise.all([
        api.get('/affectations/'),
        api.get('/agents/'),
        api.get('/equipements/'),
      ])
      setRows(unwrapResults(affectationsRes.data))
      setAgents(unwrapResults(agentsRes.data))
      setEquipements(unwrapResults(equipementsRes.data))
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de charger les affectations.'
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
      const payload = new FormData()
      payload.append('equipement', data.equipement)
      payload.append('agent', data.agent)
      payload.append('assigned_at', toIsoDate(data.assigned_at))
      if (data.expected_return_at) {
        payload.append('expected_return_at', toIsoDate(data.expected_return_at))
      }
      payload.append(
        'is_active',
        data.is_active === 'true' || data.is_active === true
      )
      if (data.signature?.[0]) {
        payload.append('signature', data.signature[0])
      }
      if (data.equipement_photo?.[0]) {
        payload.append('equipement_photo', data.equipement_photo[0])
      }
      if (data.notes) {
        payload.append('notes', data.notes)
      }
      const { data: created } = await api.post('/affectations/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setRows((prev) => [created, ...prev])
      reset()
      setSignaturePreview('')
      setPhotoPreview('')
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de creer l affectation.'
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
    { name: 'Affecte le', selector: (row) => formatDate(row.assigned_at) },
    {
      name: 'Retour prevu',
      selector: (row) => formatDate(row.expected_return_at),
    },
    {
      name: 'Statut',
      cell: (row) => (
        <StatusBadge value={row.is_active ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      name: 'PDF',
      cell: (row) => (
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => handleDownload(row.id)}
        >
          Telecharger
        </button>
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Affectations"
        subtitle="Suivi des affectations et signatures terrain."
      />

      {error ? <div className="alert">{error}</div> : null}

      <div className="card">
        <h3>Nouvelle affectation</h3>
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
            <label>Date affectation</label>
            <input
              className="input"
              type="date"
              {...register('assigned_at', { required: 'Champ obligatoire' })}
            />
            {errors.assigned_at && (
              <span className="field__error">{errors.assigned_at.message}</span>
            )}
          </div>
          <div className="field">
            <label>Date retour prevue</label>
            <input
              className="input"
              type="date"
              {...register('expected_return_at')}
            />
          </div>
          <div className="field">
            <label>Statut</label>
            <select className="select" {...register('is_active')}>
              <option value="true">Active</option>
              <option value="false">Cloturee</option>
            </select>
          </div>
          <div className="field">
            <label>Signature (image)</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              {...register('signature')}
              onChange={(event) => handleFilePreview(event, setSignaturePreview)}
            />
          </div>
          <div className="field">
            <label>Photo equipement</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              {...register('equipement_photo')}
              onChange={(event) => handleFilePreview(event, setPhotoPreview)}
            />
          </div>
          <div className="field field--full">
            <label>Notes</label>
            <textarea className="textarea" rows="3" {...register('notes')} />
          </div>
          {(signaturePreview || photoPreview) && (
            <div className="field field--full">
              <div className="file-grid">
                {signaturePreview && (
                  <div className="file-preview">
                    <span>Signature</span>
                    <img src={signaturePreview} alt="Signature preview" />
                  </div>
                )}
                {photoPreview && (
                  <div className="file-preview">
                    <span>Equipement</span>
                    <img src={photoPreview} alt="Equipement preview" />
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      <AppTable
        title="Historique affectations"
        columns={columns}
        data={rows}
        loading={loading}
      />
    </div>
  )
}

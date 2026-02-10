import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../components/PageHeader'
import AppTable from '../components/AppTable'
import StatusBadge from '../components/StatusBadge'
import api from '../api/axios'
import { formatDate, toIsoDate, unwrapResults } from '../utils/format'

export default function Restitutions() {
  const [photoPreview, setPhotoPreview] = useState('')

  const handleFilePreview = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setPhotoPreview('')
      return
    }
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
  }
  const [rows, setRows] = useState([])
  const [affectations, setAffectations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      affectation: '',
      returned_at: '',
      condition: 'GOOD',
      notes: '',
    },
  })

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [restitutionsRes, affectationsRes] = await Promise.all([
        api.get('/restitutions/'),
        api.get('/affectations/?is_active=true'),
      ])
      setRows(unwrapResults(restitutionsRes.data))
      setAffectations(unwrapResults(affectationsRes.data))
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de charger les restitutions.'
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
      payload.append('affectation', data.affectation)
      payload.append('returned_at', toIsoDate(data.returned_at))
      payload.append('condition', data.condition)
      if (data.notes) {
        payload.append('notes', data.notes)
      }
      if (data.equipement_photo?.[0]) {
        payload.append('equipement_photo', data.equipement_photo[0])
      }
      const { data: created } = await api.post('/restitutions/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setRows((prev) => [created, ...prev])
      reset()
      setPhotoPreview('')
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de creer la restitution.'
      )
    }
  }

  const columns = [
    {
      name: 'Affectation',
      selector: (row) =>
        row.affectation_detail?.equipement_detail?.serial_number ||
        row.affectation,
      sortable: true,
    },
    { name: 'Retour le', selector: (row) => formatDate(row.returned_at) },
    { name: 'Etat', cell: (row) => <StatusBadge value={row.condition} /> },
    { name: 'Notes', selector: (row) => row.notes },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Restitutions"
        subtitle="Enregistrement des retours et controle d'etat."
      />

      {error ? <div className="alert">{error}</div> : null}

      <div className="card">
        <h3>Nouvelle restitution</h3>
        <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label>Reference affectation</label>
            <select
              className="select"
              {...register('affectation', { required: 'Champ obligatoire' })}
            >
              <option value="">Selectionner</option>
              {affectations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.equipement_detail?.serial_number || item.id} -{' '}
                  {item.agent_detail?.matricule || ''}
                </option>
              ))}
            </select>
            {errors.affectation && (
              <span className="field__error">{errors.affectation.message}</span>
            )}
          </div>
          <div className="field">
            <label>Date restitution</label>
            <input
              className="input"
              type="date"
              {...register('returned_at', { required: 'Champ obligatoire' })}
            />
            {errors.returned_at && (
              <span className="field__error">{errors.returned_at.message}</span>
            )}
          </div>
          <div className="field">
            <label>Etat</label>
            <select className="select" {...register('condition')}>
              <option value="GOOD">Bon</option>
              <option value="DAMAGED">Endommage</option>
              <option value="NEEDS_REPAIR">A reparer</option>
            </select>
          </div>
          <div className="field field--full">
            <label>Observations</label>
            <textarea className="textarea" rows="3" {...register('notes')} />
          </div>
          <div className="field">
            <label>Photo equipement</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              {...register('equipement_photo')}
              onChange={handleFilePreview}
            />
          </div>
          {photoPreview && (
            <div className="field">
              <div className="file-preview">
                <span>Equipement</span>
                <img src={photoPreview} alt="Equipement preview" />
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
        title="Historique restitutions"
        columns={columns}
        data={rows}
        loading={loading}
      />
    </div>
  )
}

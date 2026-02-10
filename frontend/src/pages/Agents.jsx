import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../components/PageHeader'
import AppTable from '../components/AppTable'
import StatusBadge from '../components/StatusBadge'
import api from '../api/axios'
import { unwrapResults } from '../utils/format'

export default function Agents() {
  const [idPreview, setIdPreview] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      id_number: '',
      project_type: '',
      status: 'ACTIVE',
    },
  })

  const loadAgents = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/agents/')
      setRows(unwrapResults(data))
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de charger les agents.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [])

  const handleFilePreview = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setIdPreview('')
      return
    }
    const url = URL.createObjectURL(file)
    setIdPreview(url)
  }

  const onSubmit = async (data) => {
    setError('')
    try {
      const payload = new FormData()
      payload.append('first_name', data.first_name)
      payload.append('last_name', data.last_name)
      payload.append('phone', data.phone)
      if (data.email) payload.append('email', data.email)
      payload.append('id_number', data.id_number)
      payload.append('project_type', data.project_type)
      payload.append('status', data.status)
      if (data.id_document?.[0]) {
        payload.append('id_document', data.id_document[0])
      }
      const { data: created } = await api.post('/agents/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setRows((prev) => [created, ...prev])
      reset()
      setIdPreview('')
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de creer l agent.'
      )
    }
  }

  const columns = [
    { name: 'Matricule', selector: (row) => row.matricule, sortable: true },
    { name: 'Prenom', selector: (row) => row.first_name, sortable: true },
    { name: 'Nom', selector: (row) => row.last_name, sortable: true },
    { name: 'Telephone', selector: (row) => row.phone },
    { name: 'Email', selector: (row) => row.email },
    { name: 'Projet', selector: (row) => row.project_type || '-' },
    { name: 'Statut', cell: (row) => <StatusBadge value={row.status} /> },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Agents"
        subtitle="Creation, suivi et statut des agents terrain."
      />

      {error ? <div className="alert">{error}</div> : null}

      <div className="card">
        <h3>Nouvel agent</h3>
        <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label>Matricule</label>
            <div className="hint">Attribue automatiquement apres creation.</div>
          </div>
          <div className="field">
            <label>Prenom</label>
            <input
              className="input"
              {...register('first_name', { required: 'Champ obligatoire' })}
            />
            {errors.first_name && (
              <span className="field__error">{errors.first_name.message}</span>
            )}
          </div>
          <div className="field">
            <label>Nom</label>
            <input
              className="input"
              {...register('last_name', { required: 'Champ obligatoire' })}
            />
            {errors.last_name && (
              <span className="field__error">{errors.last_name.message}</span>
            )}
          </div>
          <div className="field">
            <label>Telephone</label>
            <input
              className="input"
              {...register('phone', { required: 'Champ obligatoire' })}
            />
            {errors.phone && (
              <span className="field__error">{errors.phone.message}</span>
            )}
          </div>
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              {...register('email')}
            />
          </div>
          <div className="field">
            <label>Numero piece d'identite</label>
            <input
              className="input"
              {...register('id_number', { required: 'Champ obligatoire' })}
            />
            {errors.id_number && (
              <span className="field__error">{errors.id_number.message}</span>
            )}
          </div>
          <div className="field">
            <label>Type de projet</label>
            <input
              className="input"
              {...register('project_type', { required: 'Champ obligatoire' })}
            />
            {errors.project_type && (
              <span className="field__error">{errors.project_type.message}</span>
            )}
          </div>
          <div className="field">
            <label>Photo piece d'identite</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              {...register('id_document', { required: 'Champ obligatoire' })}
              onChange={handleFilePreview}
            />
            {errors.id_document && (
              <span className="field__error">{errors.id_document.message}</span>
            )}
          </div>
          {idPreview && (
            <div className="field">
              <div className="file-preview">
                <span>Piece d'identite</span>
                <img src={idPreview} alt="Piece preview" />
              </div>
            </div>
          )}
          <div className="field">
            <label>Statut</label>
            <select className="select" {...register('status')}>
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      <AppTable
        title="Liste des agents"
        columns={columns}
        data={rows}
        loading={loading}
      />
    </div>
  )
}

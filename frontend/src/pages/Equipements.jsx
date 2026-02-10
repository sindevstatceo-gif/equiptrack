import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../components/PageHeader'
import AppTable from '../components/AppTable'
import StatusBadge from '../components/StatusBadge'
import api from '../api/axios'
import { buildMediaUrl, unwrapResults } from '../utils/format'

export default function Equipements() {
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
      type: 'TABLETTE',
      serial_number: '',
      imei: '',
      status: 'AVAILABLE',
      condition: 'GOOD',
    },
  })

  const loadEquipements = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/equipements/')
      setRows(unwrapResults(data))
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de charger les equipements.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEquipements()
  }, [])

  const onSubmit = async (data) => {
    setError('')
    try {
      const { data: created } = await api.post('/equipements/', data)
      setRows((prev) => [created, ...prev])
      reset()
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de creer l equipement.'
      )
    }
  }

  const columns = [
    { name: 'Type', selector: (row) => row.type, sortable: true },
    {
      name: 'Numero de serie',
      selector: (row) => row.serial_number,
      sortable: true,
    },
    { name: 'IMEI', selector: (row) => row.imei || '-' },
    { name: 'Statut', cell: (row) => <StatusBadge value={row.status} /> },
    { name: 'Etat', cell: (row) => <StatusBadge value={row.condition} /> },
    {
      name: 'QR Code',
      cell: (row) =>
        row.qr_code_image ? (
          <img
            src={buildMediaUrl(row.qr_code_image)}
            alt="QR"
            style={{ width: '44px', height: '44px', borderRadius: '8px' }}
          />
        ) : (
          '-'
        ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Equipements"
        subtitle="Enregistrement, QR code et etat du parc." 
      />

      {error ? <div className="alert">{error}</div> : null}

      <div className="card">
        <h3>Nouvel equipement</h3>
        <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label>Type</label>
            <select className="select" {...register('type')}>
              <option value="TABLETTE">Tablette</option>
              <option value="CHARGEUR">Chargeur</option>
              <option value="POWERBANK">Powerbank</option>
            </select>
          </div>
          <div className="field">
            <label>Numero de serie</label>
            <input
              className="input"
              {...register('serial_number', { required: 'Champ obligatoire' })}
            />
            {errors.serial_number && (
              <span className="field__error">{errors.serial_number.message}</span>
            )}
          </div>
          <div className="field">
            <label>IMEI (optionnel)</label>
            <input className="input" {...register('imei')} />
          </div>
          <div className="field">
            <label>Statut</label>
            <select className="select" {...register('status')}>
              <option value="AVAILABLE">Disponible</option>
              <option value="ASSIGNED">Affecte</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="LOST">Perdu</option>
              <option value="RETIRED">Retire</option>
            </select>
          </div>
          <div className="field">
            <label>Etat</label>
            <select className="select" {...register('condition')}>
              <option value="GOOD">Bon</option>
              <option value="DAMAGED">Endommage</option>
              <option value="NEEDS_REPAIR">A reparer</option>
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
        title="Inventaire"
        columns={columns}
        data={rows}
        loading={loading}
      />
    </div>
  )
}

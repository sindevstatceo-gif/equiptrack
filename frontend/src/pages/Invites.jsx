import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../components/PageHeader'
import AppTable from '../components/AppTable'
import StatusBadge from '../components/StatusBadge'
import api from '../api/axios'
import { formatDate, toIsoDate, unwrapResults } from '../utils/format'

export default function Invites() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedToken, setCopiedToken] = useState('')
  const {
    register,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      email: '',
      phone: '',
      expires_at: '',
      notes: '',
    },
  })

  const loadInvites = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/invites/')
      setRows(unwrapResults(data))
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de charger les invitations.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvites()
  }, [])

  const onSubmit = async (data) => {
    setError('')
    try {
      const payload = {}
      if (data.email) payload.email = data.email
      if (data.phone) payload.phone = data.phone
      if (data.notes) payload.notes = data.notes
      if (data.expires_at) payload.expires_at = toIsoDate(data.expires_at)

      const { data: created } = await api.post('/invites/', payload)
      setRows((prev) => [created, ...prev])
      reset()
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Impossible de creer l invitation.'
      )
    }
  }

  const statusFor = (invite) => {
    if (invite.used_at) return 'USED'
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return 'EXPIRED'
    }
    return 'ACTIVE'
  }

  const copyLink = async (invite) => {
    const link = invite.link || `${window.location.origin}/inscription/${invite.token}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedToken(invite.token)
      setTimeout(() => setCopiedToken(''), 1500)
    } catch {
      setError('Impossible de copier le lien.')
    }
  }

  const columns = [
    {
      name: 'Statut',
      cell: (row) => <StatusBadge value={statusFor(row)} />,
      sortable: true,
    },
    { name: 'Email', selector: (row) => row.email || '-', sortable: true },
    { name: 'Telephone', selector: (row) => row.phone || '-' },
    { name: 'Cree le', selector: (row) => formatDate(row.created_at) },
    { name: 'Expire le', selector: (row) => formatDate(row.expires_at) },
    {
      name: 'Lien',
      cell: (row) => (
        <div className="link-cell">
          <span className="link-text">{row.link || '-'}</span>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => copyLink(row)}
          >
            {copiedToken === row.token ? 'Copie' : 'Copier'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Invitations agents"
        subtitle="Generez un lien unique pour l inscription des agents."
      />

      {error ? <div className="alert">{error}</div> : null}

      <div className="card">
        <h3>Nouvelle invitation</h3>
        <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label>Email (optionnel)</label>
            <input className="input" type="email" {...register('email')} />
          </div>
          <div className="field">
            <label>Telephone (optionnel)</label>
            <input className="input" {...register('phone')} />
          </div>
          <div className="field">
            <label>Expiration (optionnel)</label>
            <input className="input" type="date" {...register('expires_at')} />
          </div>
          <div className="field field--full">
            <label>Notes</label>
            <textarea className="textarea" rows="2" {...register('notes')} />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Generer le lien
            </button>
          </div>
        </form>
      </div>

      <AppTable
        title="Invitations generees"
        columns={columns}
        data={rows}
        loading={loading}
      />
    </div>
  )
}

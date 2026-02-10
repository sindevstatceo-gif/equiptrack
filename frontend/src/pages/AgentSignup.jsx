import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'

export default function AgentSignup() {
  const { token } = useParams()
  const [idPreview, setIdPreview] = useState('')
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [createdMatricule, setCreatedMatricule] = useState('')
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      address: '',
      id_number: '',
      project_type: '',
      username: '',
      password: '',
      password_confirm: '',
    },
  })

  const password = useWatch({ control, name: 'password' })

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
    setServerError('')
    try {
      const payload = new FormData()
      payload.append('first_name', data.first_name)
      payload.append('last_name', data.last_name)
      payload.append('phone', data.phone)
      if (data.email) payload.append('email', data.email)
      if (data.address) payload.append('address', data.address)
      payload.append('id_number', data.id_number)
      payload.append('project_type', data.project_type)
      if (data.username) payload.append('username', data.username)
      payload.append('password', data.password)
      if (data.id_document?.[0]) {
        payload.append('id_document', data.id_document[0])
      }
      const endpoint = token
        ? `/invites/${token}/register/`
        : '/agents/register/'
      const { data: response } = await api.post(endpoint, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setCreatedMatricule(response?.matricule || '')
      setSuccess(true)
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        'Impossible de creer le compte.'
      setServerError(message)
    }
  }

  if (success) {
    return (
      <div className="login">
        <div className="login__right">
          <div className="card form">
            <h2>Compte cree</h2>
            <p className="subtitle">
              Votre compte est actif. Vous pouvez vous connecter.
            </p>
            {createdMatricule ? (
              <p className="subtitle">Votre matricule: {createdMatricule}</p>
            ) : null}
            <Link className="btn btn-primary" to="/login">
              Aller a la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login">
      <div className="login__left">
        <div className="login__brand">
          <span className="login__logo">ET</span>
          <div>
            <h1>EquipTrack</h1>
            <p>Inscription agent via lien securise.</p>
          </div>
        </div>
        <div className="login__panel">
          <h2>Bienvenue sur le terrain.</h2>
          <p>
            Completez vos informations personnelles. Votre compte sera active
            automatiquement.
          </p>
        </div>
        <div className="login__accent" />
      </div>
      <div className="login__right">
        <form className="card form" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <p className="eyebrow">Inscription agent</p>
            <h2>Creation du compte</h2>
          </div>
          <div className="field field--full">
            <div className="hint">Matricule attribue automatiquement.</div>
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
            <input className="input" type="email" {...register('email')} />
          </div>
          <div className="field field--full">
            <label>Adresse</label>
            <textarea className="textarea" rows="3" {...register('address')} />
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
          <div className="field field--full">
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
            <div className="field field--full">
              <div className="file-preview">
                <span>Piece d'identite</span>
                <img src={idPreview} alt="Piece preview" />
              </div>
            </div>
          )}
          <div className="field">
            <label>Nom d'utilisateur (optionnel)</label>
            <input className="input" {...register('username')} />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              className="input"
              type="password"
              {...register('password', {
                required: 'Champ obligatoire',
                minLength: { value: 4, message: 'Minimum 4 caracteres' },
              })}
            />
            {errors.password && (
              <span className="field__error">{errors.password.message}</span>
            )}
          </div>
          <div className="field">
            <label>Confirmer mot de passe</label>
            <input
              className="input"
              type="password"
              {...register('password_confirm', {
                validate: (value) =>
                  value === password || 'Les mots de passe ne correspondent pas',
              })}
            />
            {errors.password_confirm && (
              <span className="field__error">
                {errors.password_confirm.message}
              </span>
            )}
          </div>
          {serverError ? <div className="alert">{serverError}</div> : null}
          <button className="btn btn-primary" type="submit">
            Creer mon compte
          </button>
        </form>
      </div>
    </div>
  )
}

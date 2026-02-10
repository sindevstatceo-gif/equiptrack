import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (formData) => {
    setServerError('')
    const result = await login(formData.username, formData.password)
    if (result.ok) {
      navigate('/')
    } else {
      setServerError(result.message || 'Connexion impossible.')
    }
  }

  return (
    <div className="login">
      <div className="login__left">
        <div className="login__brand">
          <span className="login__logo">ET</span>
          <div>
            <h1>EquipTrack</h1>
            <p>Gestion et tracabilite des equipements terrain.</p>
          </div>
        </div>
        <div className="login__panel">
          <h2>Operations fluides.</h2>
          <p>
            Centralisez les affectations, retours, incidents et rapports dans une
            interface claire pour chaque role.
          </p>
          <ul className="login__list">
            <li>Suivi temps reel des equipements.</li>
            <li>Historique des affectations et restitutions.</li>
            <li>Reporting instantane pour les superviseurs.</li>
          </ul>
        </div>
        <div className="login__accent" />
      </div>
      <div className="login__right">
        <form className="card form" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <p className="eyebrow">Connexion securisee</p>
            <h2>Bienvenue</h2>
            <p className="subtitle">Entrez vos identifiants pour continuer.</p>
          </div>
          <div className="field">
            <label>Identifiant (matricule, email ou telephone)</label>
            <input
              className="input"
              type="text"
              placeholder="ex: admin / AG202602100001 / 770000000"
              {...register('username', { required: 'Champ obligatoire' })}
            />
            {errors.username ? (
              <span className="field__error">{errors.username.message}</span>
            ) : null}
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              {...register('password', {
                required: 'Champ obligatoire',
                minLength: { value: 4, message: 'Minimum 4 caracteres' },
              })}
            />
            {errors.password ? (
              <span className="field__error">{errors.password.message}</span>
            ) : null}
          </div>
          {serverError || error ? (
            <div className="alert">{serverError || error}</div>
          ) : null}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => navigate('/inscription')}
          >
            Inscription agent
          </button>
          <p className="hint">
            Besoin d'un compte ? Contactez votre administrateur.
          </p>
        </form>
      </div>
    </div>
  )
}

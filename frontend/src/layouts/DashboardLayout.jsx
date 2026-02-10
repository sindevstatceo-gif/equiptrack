import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/agents', label: 'Agents' },
  { to: '/equipements', label: 'Equipements' },
  { to: '/affectations', label: 'Affectations' },
  { to: '/restitutions', label: 'Restitutions' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/rapports', label: 'Rapports' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__logo">ET</div>
          <div>
            <p>EquipTrack</p>
            <span>Traçabilite intelligente</span>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive ? 'nav__link nav__link--active' : 'nav__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <div>
            <p className="sidebar__user">{user?.username || 'Utilisateur'}</p>
            <span className="sidebar__role">Session securisee</span>
          </div>
          <button className="btn btn-ghost" type="button" onClick={logout}>
            Deconnexion
          </button>
        </div>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <p className="topbar__eyebrow">Plateforme Sindevstat</p>
            <h2>Gestion et traçabilite des equipements</h2>
          </div>
          <div className="topbar__meta">
            <div className="meta-card">
              <p>Connexion active</p>
              <span>{new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="meta-card meta-card--accent">
              <p>Support</p>
              <span>support@sindevstat.com</span>
            </div>
          </div>
        </header>
        <div className="content__inner">
          <Outlet />
        </div>
      </main>
    </div>
  )
}


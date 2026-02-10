# Documentation API

Base URL: `http://localhost:8000/api/`

## Auth
- `POST /api/login/`
  - Body: `{ "username": "admin", "password": "secret" }`
  - Response: `{ "access": "...", "refresh": "..." }`

- `POST /api/token/refresh/`
  - Body: `{ "refresh": "..." }`

Ajouter l'entete:
```
Authorization: Bearer <access>
```

## Utilisateurs
- `GET /api/users/`
- `POST /api/users/`
- `PUT /api/users/{id}/`
- `DELETE /api/users/{id}/`

## Agents
- `GET /api/agents/`
- `POST /api/agents/`
- `PUT /api/agents/{id}/`
- `DELETE /api/agents/{id}/`
- `POST /api/agents/register/` (Public)

Champs requis (creation agent):
- `matricule`, `first_name`, `last_name`, `phone`
- `id_number`, `project_type`, `id_document` (multipart)

## Equipements
- `GET /api/equipements/`
- `POST /api/equipements/`
- `PUT /api/equipements/{id}/`
- `DELETE /api/equipements/{id}/`

## Affectations
- `GET /api/affectations/`
- `POST /api/affectations/`
- `PUT /api/affectations/{id}/`
- `DELETE /api/affectations/{id}/`
- `GET /api/affectations/{id}/pdf/` (fiche PDF)

## Restitutions
- `GET /api/restitutions/`
- `POST /api/restitutions/`
- `PUT /api/restitutions/{id}/`
- `DELETE /api/restitutions/{id}/`

## Incidents
- `GET /api/incidents/`
- `POST /api/incidents/`
- `PUT /api/incidents/{id}/`
- `DELETE /api/incidents/{id}/`

## Rapports
- `GET /api/rapports/` (JSON)
- `GET /api/rapports/?export=excel` (Excel)
- `GET /api/rapports/?export=pdf` (PDF)

Champs JSON importants:
- `equipements_by_status`
- `incidents_by_type`
- `incidents_by_status`
- `agents_active`, `agents_inactive`

## Logs
- `GET /api/logs/`

## Invitations agents
- `POST /api/invites/` (Admin)
  - Body: `{ "email": "agent@sindevstat.com", "expires_at": "2026-02-20T00:00:00Z" }`
- `GET /api/invites/` (Admin)
- `POST /api/invites/{token}/register/` (Public)

Reponse `POST /api/invites/` inclut le champ `link` pour partager directement:
`http://<frontend>/inscription/<token>`

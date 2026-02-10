# EquipTrack

Application web de gestion et tracabilite des equipements de collecte pour Sindevstat.

## Stack
- Backend: Django + Django REST Framework
- Frontend: React (Vite)
- Base de donnees: MySQL (production) / SQLite (tests)
- Auth: JWT (SimpleJWT)

## Structure
- `equiptrack/` (backend Django)
- `frontend/` (application React)
- `docs/` (documentation)

## Installation rapide
### Backend
```bash
cd equiptrack
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Configurer MySQL avec variables d'environnement:
```bash
set MYSQL_DATABASE=equiptrack
set MYSQL_USER=root
set MYSQL_PASSWORD=root
set MYSQL_HOST=127.0.0.1
set MYSQL_PORT=3306
```

Lancer les migrations:
```bash
python manage.py migrate
```

Creer un superuser:
```bash
python manage.py createsuperuser
```

Lancer le serveur:
```bash
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tests
```bash
python manage.py test core
```

## Docker (optionnel)
```bash
docker compose up --build
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:8000/api/`

## Backups
```bash
python manage.py backup_db
```

## Documentation
- Installation: `docs/installation.md`
- API: `docs/api.md`
- Manuel utilisateur: `docs/user-manual.md`

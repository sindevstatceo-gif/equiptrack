# Guide d'installation

## Pre-requis
- Python 3.11+
- Node.js 20+
- MySQL 8.x

## Backend
1. Creer un environnement virtuel et installer les dependances:
```bash
cd equiptrack
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Creer la base MySQL:
```sql
CREATE DATABASE equiptrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Definir les variables d'environnement:
```bash
set MYSQL_DATABASE=equiptrack
set MYSQL_USER=root
set MYSQL_PASSWORD=root
set MYSQL_HOST=127.0.0.1
set MYSQL_PORT=3306
set DJANGO_SECRET_KEY=change-me
set DJANGO_DEBUG=1
```

4. Migrer et lancer:
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Frontend
1. Installer les dependances:
```bash
cd frontend
npm install
```

2. Configurer l'API (optionnel):
Creer `frontend/.env`:
```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

3. Lancer:
```bash
npm run dev
```

## Production (resume)
- Build frontend: `npm run build`
- Servir `frontend/dist/` via Nginx/Apache
- Backend via Gunicorn/Uvicorn + reverse proxy
- Activer `DEBUG=0` et definir `ALLOWED_HOSTS`

## Docker (optionnel)
```bash
docker compose up --build
```
Frontend: `http://localhost:5173`  
API: `http://localhost:8000/api/`

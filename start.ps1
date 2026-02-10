$env:MYSQL_DATABASE='equiptrack'
$env:MYSQL_USER='root'
$env:MYSQL_PASSWORD='Saloueu'
$env:MYSQL_HOST='127.0.0.1'
$env:MYSQL_PORT='3306'
$env:DJANGO_ALLOWED_HOSTS='*'
$env:DJANGO_DEBUG='1'
$env:VITE_API_BASE_URL='http://localhost:8000/api'

Start-Process -FilePath "python" -ArgumentList "manage.py", "runserver", "0.0.0.0:8000" -WorkingDirectory "c:\xampp\htdocs\apps\equiptrack"
Start-Process -FilePath "npm" -ArgumentList "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173" -WorkingDirectory "c:\xampp\htdocs\apps\equiptrack\frontend"

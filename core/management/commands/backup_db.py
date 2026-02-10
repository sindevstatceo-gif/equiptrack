import os
import subprocess
from datetime import datetime
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Backup MySQL database using mysqldump.'

    def add_arguments(self, parser):
        parser.add_argument('--output', help='Output directory for backups')

    def handle(self, *args, **options):
        db = settings.DATABASES['default']
        engine = db.get('ENGINE', '')
        if 'mysql' not in engine:
            raise CommandError('Backup is only supported for MySQL/MariaDB databases.')

        name = db.get('NAME')
        user = db.get('USER')
        password = db.get('PASSWORD')
        host = db.get('HOST', '127.0.0.1')
        port = db.get('PORT', '3306')

        if not name or not user:
            raise CommandError('Database NAME and USER are required.')

        out_dir = options.get('output') or os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(out_dir, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'{name}_{timestamp}.sql'
        filepath = os.path.join(out_dir, filename)

        cmd = [
            'mysqldump',
            '-h', str(host),
            '-P', str(port),
            '-u', str(user),
            '--single-transaction',
            '--quick',
        ]
        if password:
            cmd.append(f'-p{password}')
        cmd.append(str(name))

        try:
            with open(filepath, 'w', encoding='utf-8') as handle:
                subprocess.check_call(cmd, stdout=handle)
        except FileNotFoundError as exc:
            raise CommandError('mysqldump not found in PATH.') from exc
        except subprocess.CalledProcessError as exc:
            raise CommandError('mysqldump failed.') from exc

        self.stdout.write(self.style.SUCCESS(f'Backup created: {filepath}'))

#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path


def main():
    """Run administrative tasks."""
    # В Docker контейнере manage.py и backend/ лежат рядом в /app/
    # Локально manage.py в корне, backend/ — подпапка
    base_dir = Path(__file__).resolve().parent
    backend_dir = base_dir / 'backend'
    if backend_dir.exists() and str(backend_dir) not in sys.path:
        # Локальная разработка: добавляем backend/ в путь
        sys.path.insert(0, str(backend_dir))
    elif str(base_dir) not in sys.path:
        # В Docker: manage.py скопирован в /app/ вместе с содержимым backend/
        sys.path.insert(0, str(base_dir))

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()

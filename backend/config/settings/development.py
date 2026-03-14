from .base import *  # noqa

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Email в разработке:
#   По умолчанию — вывод в консоль runserver (Celery не нужен).
#   С Mailpit (рекомендуется для просмотра писем):
#     1. Установить: brew install mailpit  (или скачать с github.com/axllent/mailpit)
#     2. Запустить:  mailpit
#     3. Добавить в .env:
#          EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
#          EMAIL_HOST=localhost
#          EMAIL_PORT=1025
#          EMAIL_USE_TLS=False
#     4. Открыть: http://localhost:8025
EMAIL_BACKEND = env(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend',
)

# django-debug-toolbar
INSTALLED_APPS += ['debug_toolbar']  # noqa: F405
MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa: F405
INTERNAL_IPS = ['127.0.0.1']

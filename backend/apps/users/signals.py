from django.dispatch import receiver
from django.conf import settings
from django_rest_passwordreset.signals import reset_password_token_created


@receiver(reset_password_token_created)
def send_password_reset_email(sender, instance, reset_password_token, *args, **kwargs):
    """
    Отправка письма со ссылкой для сброса пароля.
    Сигнал вызывается пакетом django-rest-passwordreset при создании токена.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_url = f'{frontend_url}/reset-password?token={reset_password_token.key}'
    user = reset_password_token.user

    # Пытаемся отправить через Celery; при недоступности — синхронно
    try:
        from tasks.email_tasks import send_password_reset_email_task
        send_password_reset_email_task.delay(user.id, reset_url)
    except Exception:
        from tasks.email_tasks import _send_password_reset_email
        _send_password_reset_email(user, reset_url)

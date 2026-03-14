from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


# ─── Синхронные хелперы (вызываются напрямую при недоступном Celery) ─────────

def _send_registration_email(user):
    """Приветственное письмо после регистрации."""
    name = user.first_name or user.email
    send_mail(
        subject='Добро пожаловать в Zakupki!',
        message=(
            f'Здравствуйте, {name}!\n\n'
            f'Вы успешно зарегистрировались в сервисе Zakupki.\n'
            f'Ваш email: {user.email}\n\n'
            f'Теперь вы можете просматривать каталог товаров и делать заказы.\n\n'
            f'— Команда Zakupki'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


def _send_password_reset_email(user, reset_url: str):
    """Письмо со ссылкой для сброса пароля."""
    name = user.first_name or user.email
    send_mail(
        subject='Сброс пароля — Zakupki',
        message=(
            f'Здравствуйте, {name}!\n\n'
            f'Мы получили запрос на сброс пароля для вашего аккаунта.\n\n'
            f'Для создания нового пароля перейдите по ссылке:\n'
            f'{reset_url}\n\n'
            f'Ссылка действительна 24 часа.\n\n'
            f'Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.\n\n'
            f'— Команда Zakupki'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


# ─── Celery-задачи ────────────────────────────────────────────────────────────

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation_task(self, order_id: int):
    """
    Асинхронная отправка email при подтверждении заказа.
    Отправляет письма покупателю и администратору.
    """
    from apps.orders.models import Order

    try:
        order = Order.objects.select_related('user', 'contact').prefetch_related(
            'order_items__product_info__product',
            'order_items__product_info__shop',
        ).get(id=order_id)
    except Order.DoesNotExist:
        return

    items_text = '\n'.join(
        f'  • {item.product_info.product.name} ({item.product_info.shop.name}) '
        f'x {item.quantity} = {float(item.product_info.price_rrc) * item.quantity:.0f} ₽'
        for item in order.order_items.all()
    )

    # Email покупателю
    try:
        send_mail(
            subject=f'Заказ #{order.id} принят',
            message=(
                f'Ваш заказ #{order.id} успешно оформлен.\n\n'
                f'Состав заказа:\n{items_text}\n\n'
                f'Итого: {order.total_sum} ₽\n\n'
                f'— Команда Zakupki'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)

    # Email администратору
    try:
        send_mail(
            subject=f'Новый заказ #{order.id}',
            message=(
                f'Новый заказ #{order.id} от {order.user.email}.\n\n'
                f'Состав:\n{items_text}\n\n'
                f'Итого: {order.total_sum} ₽'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ADMIN_EMAIL],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_registration_email_task(self, user_id: int):
    """Асинхронная отправка приветственного email после регистрации."""
    from apps.users.models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    try:
        _send_registration_email(user)
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email_task(self, user_id: int, reset_url: str):
    """Асинхронная отправка письма для сброса пароля."""
    from apps.users.models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    try:
        _send_password_reset_email(user, reset_url)
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_status_notification_task(self, order_id: int):
    """Асинхронное уведомление покупателя об изменении статуса заказа."""
    from apps.orders.models import Order

    try:
        order = Order.objects.select_related('user').get(id=order_id)
    except Order.DoesNotExist:
        return

    state_labels = {
        'new': 'Новый',
        'confirmed': 'Подтверждён поставщиком',
        'assembled': 'Собран',
        'sent': 'Отправлен',
        'partially_sent': 'Отправлен частично',
        'delivered': 'Доставлен',
        'cancelled': 'Отменён',
    }
    label = state_labels.get(order.state, order.state)

    try:
        send_mail(
            subject=f'Статус заказа #{order.id} изменён',
            message=(
                f'Статус вашего заказа #{order.id} обновлён:\n\n'
                f'  {label}\n\n'
                f'— Команда Zakupki'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)

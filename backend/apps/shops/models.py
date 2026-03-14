from django.db import models
from django.conf import settings


class Shop(models.Model):
    """Магазин поставщика."""

    name = models.CharField(max_length=50, unique=True, verbose_name='Название')
    url = models.URLField(null=True, blank=True, verbose_name='Ссылка на прайс')
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='shop',
        verbose_name='Пользователь',
    )
    state = models.BooleanField(default=True, verbose_name='Принимает заказы')

    class Meta:
        verbose_name = 'Магазин'
        verbose_name_plural = 'Магазины'
        ordering = ['name']

    def __str__(self):
        return self.name


class ShopOrder(models.Model):
    """Статус заказа у конкретного поставщика."""

    SHOP_ORDER_STATE_CHOICES = [
        ('new', 'Новый'),
        ('confirmed', 'Подтверждён'),
        ('assembled', 'Собран'),
        ('sent', 'Отправлен'),
        ('delivered', 'Доставлен'),
        ('cancelled', 'Отменён'),
    ]

    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='shop_orders',
        verbose_name='Заказ',
    )
    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='shop_orders',
        verbose_name='Магазин',
    )
    state = models.CharField(
        max_length=15,
        choices=SHOP_ORDER_STATE_CHOICES,
        default='new',
        verbose_name='Статус',
    )

    class Meta:
        unique_together = ('order', 'shop')
        verbose_name = 'Статус заказа у поставщика'
        verbose_name_plural = 'Статусы заказов у поставщиков'

    def __str__(self):
        return f'Заказ #{self.order_id} — {self.shop.name}: {self.state}'

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

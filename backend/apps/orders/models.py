from django.db import models
from django.conf import settings
from django.core.validators import MaxValueValidator


class Contact(models.Model):
    """Контактные данные пользователя для доставки."""

    class ContactType(models.TextChoices):
        PHONE = 'phone', 'Телефон'
        ADDRESS = 'address', 'Адрес'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='contacts',
        verbose_name='Пользователь',
    )
    type = models.CharField(
        max_length=10,
        choices=ContactType.choices,
        verbose_name='Тип контакта',
    )
    # Поля для телефона
    phone = models.CharField(max_length=20, blank=True, verbose_name='Телефон')
    # Поля для адреса
    city = models.CharField(max_length=50, blank=True, verbose_name='Город')
    street = models.CharField(max_length=100, blank=True, verbose_name='Улица')
    house = models.CharField(max_length=15, blank=True, verbose_name='Дом')
    structure = models.CharField(max_length=15, blank=True, verbose_name='Корпус')
    building = models.CharField(max_length=15, blank=True, verbose_name='Строение')
    apartment = models.CharField(max_length=15, blank=True, verbose_name='Квартира')

    class Meta:
        verbose_name = 'Контакт'
        verbose_name_plural = 'Контакты'

    def __str__(self):
        if self.type == self.ContactType.PHONE:
            return f'Тел: {self.phone}'
        return f'{self.city}, {self.street}, {self.house}'


class Order(models.Model):
    """Заказ пользователя. Статус «basket» — текущая корзина."""

    class OrderState(models.TextChoices):
        BASKET = 'basket', 'Корзина'
        NEW = 'new', 'Новый'
        CONFIRMED = 'confirmed', 'Подтверждён'
        ASSEMBLED = 'assembled', 'Собран'
        SENT = 'sent', 'Отправлен'
        DELIVERED = 'delivered', 'Доставлен'
        CANCELLED = 'cancelled', 'Отменён'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Пользователь',
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        verbose_name='Контакт доставки',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    state = models.CharField(
        max_length=15,
        choices=OrderState.choices,
        default=OrderState.BASKET,
        verbose_name='Статус',
    )

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']

    def __str__(self):
        return f'Заказ #{self.id} — {self.get_state_display()}'

    @property
    def total_sum(self):
        """Итоговая сумма заказа."""
        return sum(
            item.product_info.price * item.quantity
            for item in self.order_items.select_related('product_info').all()
        )


class OrderItem(models.Model):
    """Позиция заказа: товар из конкретного магазина с количеством."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='order_items',
        verbose_name='Заказ',
    )
    product_info = models.ForeignKey(
        'products.ProductInfo',
        on_delete=models.CASCADE,
        related_name='order_items',
        verbose_name='Товар',
    )
    quantity = models.PositiveIntegerField(
        validators=[MaxValueValidator(9999)],
        verbose_name='Количество',
    )

    class Meta:
        verbose_name = 'Позиция заказа'
        verbose_name_plural = 'Позиции заказа'
        constraints = [
            models.UniqueConstraint(
                fields=['order', 'product_info'],
                name='unique_order_item',
            )
        ]

    def __str__(self):
        return f'{self.product_info} x {self.quantity}'

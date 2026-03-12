from django.db import models


class Category(models.Model):
    """Категория товаров."""

    name = models.CharField(max_length=100, verbose_name='Название')
    shops = models.ManyToManyField(
        'shops.Shop',
        blank=True,
        related_name='categories',
        verbose_name='Магазины',
    )

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """Товар (общее наименование)."""

    name = models.CharField(max_length=200, verbose_name='Название')
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='products',
        verbose_name='Категория',
    )

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['name']

    def __str__(self):
        return self.name


class ProductInfo(models.Model):
    """Информация о товаре в конкретном магазине (цена, остаток)."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='product_infos',
        verbose_name='Товар',
    )
    shop = models.ForeignKey(
        'shops.Shop',
        on_delete=models.CASCADE,
        related_name='product_infos',
        verbose_name='Магазин',
    )
    model = models.CharField(max_length=100, blank=True, verbose_name='Модель')
    external_id = models.PositiveIntegerField(verbose_name='Внешний ID')
    quantity = models.PositiveIntegerField(verbose_name='Остаток')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена')
    price_rrc = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name='Рекомендованная розничная цена'
    )

    class Meta:
        verbose_name = 'Информация о товаре'
        verbose_name_plural = 'Информация о товарах'
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'shop'],
                name='unique_product_shop',
            )
        ]

    def __str__(self):
        return f'{self.product.name} — {self.shop.name}'


class Parameter(models.Model):
    """Название характеристики товара (например, «Цвет», «Объём памяти»)."""

    name = models.CharField(max_length=100, unique=True, verbose_name='Название')

    class Meta:
        verbose_name = 'Характеристика'
        verbose_name_plural = 'Характеристики'
        ordering = ['name']

    def __str__(self):
        return self.name


class ProductParameter(models.Model):
    """Значение характеристики конкретной позиции товара в магазине."""

    product_info = models.ForeignKey(
        ProductInfo,
        on_delete=models.CASCADE,
        related_name='product_parameters',
        verbose_name='Товар',
    )
    parameter = models.ForeignKey(
        Parameter,
        on_delete=models.CASCADE,
        related_name='product_parameters',
        verbose_name='Характеристика',
    )
    value = models.CharField(max_length=200, verbose_name='Значение')

    class Meta:
        verbose_name = 'Значение характеристики'
        verbose_name_plural = 'Значения характеристик'
        constraints = [
            models.UniqueConstraint(
                fields=['product_info', 'parameter'],
                name='unique_product_parameter',
            )
        ]

    def __str__(self):
        return f'{self.parameter.name}: {self.value}'

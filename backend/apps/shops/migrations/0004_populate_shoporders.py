from django.db import migrations


def create_shop_orders(apps, schema_editor):
    """Создаём ShopOrder для всех существующих активных заказов."""
    OrderItem = apps.get_model('orders', 'OrderItem')
    ShopOrder = apps.get_model('shops', 'ShopOrder')

    seen = set()
    for item in OrderItem.objects.filter(
        order__state__in=['new', 'confirmed', 'assembled', 'sent', 'delivered']
    ).select_related('order', 'product_info__shop'):
        key = (item.order_id, item.product_info.shop_id)
        if key not in seen:
            seen.add(key)
            ShopOrder.objects.get_or_create(
                order=item.order,
                shop=item.product_info.shop,
                defaults={'state': item.order.state},
            )


class Migration(migrations.Migration):

    dependencies = [
        ('shops', '0003_shoporder'),
    ]

    operations = [
        migrations.RunPython(create_shop_orders, migrations.RunPython.noop),
    ]

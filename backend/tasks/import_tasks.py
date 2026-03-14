from celery import shared_task


@shared_task(bind=True, max_retries=3, default_retry_delay=60, time_limit=300, soft_time_limit=240)
def import_price_from_url_task(self, url: str, user_id: int):
    """
    Асинхронный импорт прайса по URL.
    Возвращает словарь с результатом импорта.
    """
    from apps.users.models import User
    from apps.products.services import load_price_from_url, import_price

    try:
        user = User.objects.get(id=user_id)
        data = load_price_from_url(url)
        return import_price(data, user)
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60, time_limit=300, soft_time_limit=240)
def export_price_task(self, shop_id: int) -> str:
    """
    Асинхронный экспорт прайса поставщика в YAML-строку.
    """
    import yaml
    from apps.shops.models import Shop
    from apps.products.models import ProductInfo

    try:
        shop = Shop.objects.get(id=shop_id)
        product_infos = (
            ProductInfo.objects.filter(shop=shop)
            .select_related('product__category')
            .prefetch_related('product_parameters__parameter')
        )

        categories = {}
        goods = []

        for pi in product_infos:
            cat = pi.product.category
            if cat.id not in categories:
                categories[cat.id] = {'id': cat.id, 'name': cat.name}

            parameters = {
                pp.parameter.name: pp.value
                for pp in pi.product_parameters.all()
            }

            goods.append({
                'id': pi.external_id,
                'category': cat.id,
                'model': pi.model,
                'name': pi.product.name,
                'price': float(pi.price),
                'price_rrc': float(pi.price_rrc),
                'quantity': pi.quantity,
                'parameters': parameters,
            })

        export_data = {
            'shop': shop.name,
            'categories': list(categories.values()),
            'goods': goods,
        }

        return yaml.dump(export_data, allow_unicode=True, default_flow_style=False, sort_keys=False)

    except Exception as exc:
        raise self.retry(exc=exc)

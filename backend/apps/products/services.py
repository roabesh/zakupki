import ipaddress
import requests
import yaml
from urllib.parse import urlparse
from django.db import transaction

from apps.shops.models import Shop
from apps.products.models import Category, Product, ProductInfo, Parameter, ProductParameter


def _validate_url(url: str) -> None:
    """Проверяет URL на SSRF-уязвимости: запрещает localhost и private IP."""
    parsed = urlparse(url)
    hostname = (parsed.hostname or '').lower()

    # Явно запрещённые имена хостов
    blocked = {'localhost', '127.0.0.1', '0.0.0.0', '::1', '0:0:0:0:0:0:0:1'}
    if hostname in blocked:
        raise ValueError('Загрузка по локальному адресу запрещена')

    # Проверка по IP — запрет private/loopback/reserved диапазонов
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
            raise ValueError('Загрузка по приватному IP-адресу запрещена')
    except ValueError as exc:
        if 'запрещена' in str(exc):
            raise
        # hostname — это доменное имя, а не IP-адрес; всё в порядке


def load_price_from_url(url: str) -> dict:
    """Загружает YAML-прайс по URL и возвращает распарсенный словарь."""
    _validate_url(url)
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return yaml.safe_load(response.content)


def load_price_from_file(file) -> dict:
    """Парсит YAML из файлового объекта."""
    return yaml.safe_load(file)


@transaction.atomic
def import_price(data: dict, user) -> dict:
    """
    Импортирует прайс-лист в базу данных.

    Принимает словарь с ключами: shop, categories, goods.
    Выполняет upsert записей ProductInfo и ProductParameter.
    Возвращает словарь со статистикой: созданные и обновлённые позиции.
    """
    shop_name = data.get('shop')
    if not shop_name:
        raise ValueError('Поле "shop" обязательно')

    # Получаем или создаём магазин, привязанный к пользователю
    shop, _ = Shop.objects.get_or_create(
        user=user,
        defaults={'name': shop_name, 'state': True},
    )
    # Обновляем название, если изменилось
    if shop.name != shop_name:
        shop.name = shop_name
        shop.save(update_fields=['name'])

    # Загружаем категории из прайса
    categories_map = {}  # внешний id → объект Category
    for cat_data in data.get('categories', []):
        category, _ = Category.objects.get_or_create(name=cat_data['name'])
        category.shops.add(shop)
        categories_map[cat_data['id']] = category

    created_count = 0
    updated_count = 0

    for item in data.get('goods', []):
        category = categories_map.get(item.get('category'))
        if not category:
            continue

        # Получаем или создаём общую запись товара
        product, _ = Product.objects.get_or_create(
            name=item['name'],
            defaults={'category': category},
        )

        # Upsert записи с ценой и наличием для этого магазина
        product_info, created = ProductInfo.objects.update_or_create(
            product=product,
            shop=shop,
            defaults={
                'model': item.get('model', ''),
                'external_id': item['id'],
                'quantity': item.get('quantity', 0),
                'price': item['price'],
                'price_rrc': item.get('price_rrc', item['price']),
            },
        )

        if created:
            created_count += 1
        else:
            updated_count += 1

        # Обновляем характеристики товара
        parameters = item.get('parameters', {})
        if parameters:
            # Удаляем старые значения и записываем актуальные
            product_info.product_parameters.all().delete()
            for param_name, param_value in parameters.items():
                parameter, _ = Parameter.objects.get_or_create(name=param_name)
                ProductParameter.objects.create(
                    product_info=product_info,
                    parameter=parameter,
                    value=str(param_value),
                )

    return {
        'status': 'ok',
        'shop': shop.name,
        'created': created_count,
        'updated': updated_count,
    }

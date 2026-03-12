import pytest
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token


@pytest.fixture
def api_client():
    """Неаутентифицированный API-клиент."""
    return APIClient()


@pytest.fixture
def buyer(db):
    """Пользователь-покупатель."""
    from apps.users.models import User
    user = User.objects.create_user(
        email='buyer@test.com',
        password='testpass123',
        type='buyer',
        first_name='Иван',
    )
    return user


@pytest.fixture
def supplier(db):
    """Пользователь-поставщик."""
    from apps.users.models import User
    user = User.objects.create_user(
        email='supplier@test.com',
        password='testpass123',
        type='supplier',
    )
    return user


@pytest.fixture
def buyer_client(buyer):
    """Аутентифицированный клиент покупателя."""
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=buyer)
    client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return client


@pytest.fixture
def supplier_client(supplier):
    """Аутентифицированный клиент поставщика."""
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=supplier)
    client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return client


@pytest.fixture
def shop(supplier, db):
    """Магазин, привязанный к поставщику."""
    from apps.shops.models import Shop
    return Shop.objects.create(name='Тестовый магазин', user=supplier, state=True)


@pytest.fixture
def category(shop, db):
    """Тестовая категория."""
    from apps.products.models import Category
    cat = Category.objects.create(name='Смартфоны')
    cat.shops.add(shop)
    return cat


@pytest.fixture
def product_info(shop, category, db):
    """Тестовый товар с ценой в магазине."""
    from apps.products.models import Product, ProductInfo
    product = Product.objects.create(name='iPhone XS', category=category)
    return ProductInfo.objects.create(
        product=product,
        shop=shop,
        model='apple/iphone/xs',
        external_id=12345,
        quantity=10,
        price=90000,
        price_rrc=99000,
    )

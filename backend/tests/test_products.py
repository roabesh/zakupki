import pytest


@pytest.mark.django_db
class TestCatalog:
    """Тесты каталога товаров."""

    def test_categories_list(self, api_client, category):
        """Список категорий доступен без авторизации."""
        response = api_client.get('/api/v1/categories/')
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_shops_list(self, api_client, shop):
        """Список магазинов доступен без авторизации."""
        response = api_client.get('/api/v1/shops/')
        assert response.status_code == 200
        assert any(s['name'] == 'Тестовый магазин' for s in response.data)

    def test_products_list(self, api_client, product_info):
        """Каталог товаров доступен без авторизации."""
        response = api_client.get('/api/v1/products/')
        assert response.status_code == 200
        assert response.data['count'] >= 1

    def test_products_filter_by_shop(self, api_client, product_info):
        """Фильтрация каталога по магазину."""
        shop_id = product_info.shop.id
        response = api_client.get(f'/api/v1/products/?product_infos__shop={shop_id}')
        assert response.status_code == 200
        assert response.data['count'] >= 1

    def test_products_filter_by_category(self, api_client, product_info):
        """Фильтрация каталога по категории."""
        cat_id = product_info.product.category.id
        response = api_client.get(f'/api/v1/products/?category={cat_id}')
        assert response.status_code == 200
        assert response.data['count'] >= 1

    def test_inactive_shop_hidden(self, api_client, shop, product_info):
        """Товары из закрытого магазина не отображаются."""
        shop.state = False
        shop.save()
        response = api_client.get('/api/v1/products/')
        assert response.status_code == 200
        assert response.data['count'] == 0

    def test_product_detail(self, api_client, product_info):
        """Получение детальной информации о конкретном товаре."""
        pk = product_info.product.id
        response = api_client.get(f'/api/v1/products/{pk}/')
        assert response.status_code == 200
        assert response.data['id'] == pk
        assert 'product_infos' in response.data
        assert len(response.data['product_infos']) >= 1

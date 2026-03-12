import pytest


@pytest.mark.django_db
class TestBasket:
    """Тесты корзины."""

    def test_get_empty_basket(self, buyer_client):
        """Получение пустой корзины."""
        response = buyer_client.get('/api/v1/basket/')
        assert response.status_code == 200
        assert response.data['state'] == 'basket'
        assert response.data['order_items'] == []

    def test_add_to_basket(self, buyer_client, product_info):
        """Добавление товара в корзину."""
        response = buyer_client.post('/api/v1/basket/', {
            'items': [{'product_info': product_info.id, 'quantity': 2}]
        }, format='json')
        assert response.status_code == 200
        assert response.data['status'] == 'ok'

        # Проверяем корзину
        basket = buyer_client.get('/api/v1/basket/')
        assert len(basket.data['order_items']) == 1
        assert basket.data['order_items'][0]['quantity'] == 2

    def test_basket_requires_auth(self, api_client):
        """Корзина недоступна без авторизации."""
        response = api_client.get('/api/v1/basket/')
        assert response.status_code == 401

    def test_remove_from_basket(self, buyer_client, product_info):
        """Удаление товара из корзины."""
        # Добавляем
        buyer_client.post('/api/v1/basket/', {
            'items': [{'product_info': product_info.id, 'quantity': 1}]
        }, format='json')

        # Получаем id позиции
        basket = buyer_client.get('/api/v1/basket/')
        item_id = basket.data['order_items'][0]['id']

        # Удаляем
        response = buyer_client.delete('/api/v1/basket/', {'items': [item_id]}, format='json')
        assert response.status_code == 200

        # Проверяем
        basket = buyer_client.get('/api/v1/basket/')
        assert basket.data['order_items'] == []


@pytest.mark.django_db
class TestOrders:
    """Тесты оформления заказов."""

    def test_confirm_order(self, buyer_client, product_info):
        """Подтверждение заказа из корзины."""
        # Добавляем товар в корзину
        buyer_client.post('/api/v1/basket/', {
            'items': [{'product_info': product_info.id, 'quantity': 1}]
        }, format='json')

        # Подтверждаем
        response = buyer_client.post('/api/v1/orders/', {}, format='json')
        assert response.status_code == 201
        assert response.data['state'] == 'new'

    def test_confirm_empty_basket_fails(self, buyer_client):
        """Нельзя подтвердить пустую корзину."""
        response = buyer_client.post('/api/v1/orders/', {}, format='json')
        assert response.status_code == 400

    def test_orders_list(self, buyer_client, product_info):
        """Список заказов пользователя."""
        # Создаём и подтверждаем заказ
        buyer_client.post('/api/v1/basket/', {
            'items': [{'product_info': product_info.id, 'quantity': 1}]
        }, format='json')
        buyer_client.post('/api/v1/orders/', {}, format='json')

        response = buyer_client.get('/api/v1/orders/')
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['state'] == 'new'

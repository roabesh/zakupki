import pytest


@pytest.mark.django_db
class TestContacts:
    """Тесты управления контактами пользователя (адреса и телефон)."""

    def test_create_phone(self, buyer_client):
        """Создание контакта-телефона."""
        response = buyer_client.post('/api/v1/user/contact/', {
            'type': 'phone',
            'phone': '+79001234567',
        }, format='json')
        assert response.status_code == 201
        assert response.data['type'] == 'phone'
        assert response.data['phone'] == '+79001234567'

    def test_create_address(self, buyer_client):
        """Создание адреса доставки."""
        response = buyer_client.post('/api/v1/user/contact/', {
            'type': 'address',
            'city': 'Москва',
            'street': 'Тверская',
            'house': '1',
        }, format='json')
        assert response.status_code == 201
        assert response.data['city'] == 'Москва'

    def test_cannot_create_two_phones(self, buyer_client):
        """Нельзя добавить более одного телефона."""
        buyer_client.post('/api/v1/user/contact/', {
            'type': 'phone',
            'phone': '+79001234567',
        }, format='json')
        response = buyer_client.post('/api/v1/user/contact/', {
            'type': 'phone',
            'phone': '+79007654321',
        }, format='json')
        assert response.status_code == 400

    def test_max_5_addresses(self, buyer_client):
        """Нельзя добавить более 5 адресов."""
        for i in range(5):
            buyer_client.post('/api/v1/user/contact/', {
                'type': 'address',
                'city': f'Город{i}',
                'street': 'Улица',
                'house': str(i + 1),
            }, format='json')

        # 6-й адрес должен вернуть 400
        response = buyer_client.post('/api/v1/user/contact/', {
            'type': 'address',
            'city': 'ЛишнийГород',
            'street': 'Улица',
            'house': '99',
        }, format='json')
        assert response.status_code == 400

    def test_delete_contact(self, buyer_client):
        """Удаление контакта."""
        # Создаём телефон
        create = buyer_client.post('/api/v1/user/contact/', {
            'type': 'phone',
            'phone': '+79001234567',
        }, format='json')
        contact_id = create.data['id']

        # Удаляем
        response = buyer_client.delete('/api/v1/user/contact/', {
            'items': [contact_id],
        }, format='json')
        assert response.status_code == 200

        # Проверяем что список пуст
        contacts = buyer_client.get('/api/v1/user/contact/')
        assert contacts.status_code == 200
        assert len(contacts.data) == 0

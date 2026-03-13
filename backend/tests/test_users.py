import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestRegistration:
    """Тесты регистрации пользователей."""

    def test_register_buyer(self, api_client):
        """Успешная регистрация покупателя."""
        response = api_client.post('/api/v1/user/register/', {
            'email': 'new@test.com',
            'password': 'strongpass123',
            'type': 'buyer',
        })
        assert response.status_code == 201
        assert 'token' in response.data
        assert response.data['status'] == 'ok'

    def test_register_duplicate_email(self, api_client, buyer):
        """Регистрация с уже существующим email."""
        response = api_client.post('/api/v1/user/register/', {
            'email': 'buyer@test.com',
            'password': 'strongpass123',
            'type': 'buyer',
        })
        assert response.status_code == 400

    def test_register_short_password(self, api_client):
        """Пароль слишком короткий."""
        response = api_client.post('/api/v1/user/register/', {
            'email': 'new2@test.com',
            'password': '123',
            'type': 'buyer',
        })
        assert response.status_code == 400


@pytest.mark.django_db
class TestLogin:
    """Тесты авторизации."""

    def test_login_success(self, api_client, buyer):
        """Успешный вход."""
        response = api_client.post('/api/v1/user/login/', {
            'email': 'buyer@test.com',
            'password': 'testpass123',
        })
        assert response.status_code == 200
        assert 'token' in response.data

    def test_login_wrong_password(self, api_client, buyer):
        """Неверный пароль."""
        response = api_client.post('/api/v1/user/login/', {
            'email': 'buyer@test.com',
            'password': 'wrongpass',
        })
        assert response.status_code == 400


@pytest.mark.django_db
class TestUserDetails:
    """Тесты профиля пользователя."""

    def test_get_profile(self, buyer_client, buyer):
        """Получение профиля."""
        response = buyer_client.get('/api/v1/user/details/')
        assert response.status_code == 200
        assert response.data['email'] == buyer.email

    def test_update_profile(self, buyer_client):
        """Обновление профиля."""
        response = buyer_client.put('/api/v1/user/details/', {
            'first_name': 'Пётр',
            'company': 'ООО Тест',
        })
        assert response.status_code == 200
        assert response.data['first_name'] == 'Пётр'

    def test_profile_requires_auth(self, api_client):
        """Профиль недоступен без авторизации."""
        response = api_client.get('/api/v1/user/details/')
        assert response.status_code == 401


@pytest.mark.django_db
class TestRegistrationEmail:
    """Тесты отправки email при регистрации."""

    def test_registration_sends_email(self, api_client, mailoutbox):
        """После регистрации пользователь получает приветственный email."""
        response = api_client.post('/api/v1/user/register/', {
            'email': 'newuser@test.com',
            'password': 'strongpass123',
            'type': 'buyer',
        })
        assert response.status_code == 201
        assert len(mailoutbox) == 1
        assert mailoutbox[0].to == ['newuser@test.com']
        assert 'Zakupki' in mailoutbox[0].subject

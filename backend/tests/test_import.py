import pytest
import yaml


@pytest.mark.django_db
class TestPriceImport:
    """Тесты импорта прайса."""

    def test_import_yaml(self, supplier):
        """Успешный импорт YAML-прайса."""
        from apps.products.services import import_price

        data = {
            'shop': 'Тест Шоп',
            'categories': [{'id': 1, 'name': 'Электроника'}],
            'goods': [{
                'id': 101,
                'category': 1,
                'model': 'test/model',
                'name': 'Тестовый товар',
                'price': 5000,
                'price_rrc': 5500,
                'quantity': 20,
                'parameters': {'Цвет': 'синий', 'Вес': '200г'},
            }]
        }

        result = import_price(data, supplier)
        assert result['status'] == 'ok'
        assert result['created'] == 1
        assert result['updated'] == 0

    def test_import_upsert(self, supplier):
        """Повторный импорт обновляет записи."""
        from apps.products.services import import_price

        data = {
            'shop': 'Тест Шоп',
            'categories': [{'id': 1, 'name': 'Электроника'}],
            'goods': [{'id': 101, 'category': 1, 'name': 'Товар', 'price': 5000, 'price_rrc': 5500, 'quantity': 20}]
        }

        import_price(data, supplier)
        data['goods'][0]['price'] = 6000
        result = import_price(data, supplier)

        assert result['updated'] == 1
        assert result['created'] == 0

    def test_import_missing_shop_field(self, supplier):
        """Импорт без поля shop возвращает ошибку."""
        from apps.products.services import import_price

        with pytest.raises(ValueError, match='shop'):
            import_price({'categories': [], 'goods': []}, supplier)

    def test_partner_update_endpoint(self, supplier_client, tmp_path):
        """Загрузка прайса через API."""
        yaml_data = {
            'shop': 'API Шоп',
            'categories': [{'id': 10, 'name': 'Категория'}],
            'goods': [{'id': 200, 'category': 10, 'name': 'Товар API', 'price': 1000, 'price_rrc': 1100, 'quantity': 5}]
        }
        yaml_file = tmp_path / 'price.yaml'
        yaml_file.write_text(yaml.dump(yaml_data, allow_unicode=True))

        with open(yaml_file, 'rb') as f:
            response = supplier_client.post(
                '/api/v1/partner/update/',
                {'file': f},
                format='multipart',
            )
        assert response.status_code == 200
        assert response.data['status'] == 'ok'

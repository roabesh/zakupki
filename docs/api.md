# Zakupki API — Спецификация

Base URL: `http://localhost:8000/api/v1/`

Аутентификация: Token `Authorization: Token <token>`

---

## Аутентификация и пользователь

### POST /user/register/
Регистрация нового пользователя.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "strongpassword123",
  "first_name": "Иван",
  "last_name": "Иванов",
  "company": "ООО Рога",
  "position": "Менеджер",
  "type": "buyer"
}
```
**Response 201:**
```json
{"status": "ok", "token": "abc123..."}
```

---

### POST /user/login/
Авторизация. Возвращает токен.

**Request:**
```json
{"email": "user@example.com", "password": "strongpassword123"}
```
**Response 200:**
```json
{"token": "abc123..."}
```

---

### POST /user/password_reset/
Запрос на сброс пароля.

**Request:**
```json
{"email": "user@example.com"}
```

---

### POST /user/password_reset/confirm/
Подтверждение сброса пароля.

**Request:**
```json
{"token": "reset_token", "password": "newpassword123"}
```

---

### GET /user/details/
Получить профиль текущего пользователя.

**Response 200:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Иван",
  "last_name": "Иванов",
  "company": "ООО Рога",
  "position": "Менеджер",
  "type": "buyer"
}
```

---

### PUT /user/details/
Обновить профиль пользователя.

---

### GET /user/contact/
Список контактов пользователя (телефон + адреса).

**Response 200:**
```json
[
  {"id": 1, "type": "phone", "phone": "+79991234567"},
  {"id": 2, "type": "address", "city": "Москва", "street": "Ленина", "house": "1", "apartment": "10"}
]
```

---

### POST /user/contact/
Создать контакт. Ограничения: 1 телефон, до 5 адресов.

---

### PUT /user/contact/
Обновить контакт.

---

### DELETE /user/contact/
Удалить контакт.

---

## Каталог

### GET /categories/
Список всех категорий.

**Response 200:**
```json
[{"id": 1, "name": "Смартфоны"}, {"id": 2, "name": "Аксессуары"}]
```

---

### GET /shops/
Список активных магазинов (state=True).

**Response 200:**
```json
[{"id": 1, "name": "Связной"}, {"id": 2, "name": "МВидео"}]
```

---

### GET /products/
Каталог товаров. Фильтры: `?shop_id=1`, `?category_id=224`.

**Response 200:**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "name": "Смартфон Apple iPhone XS Max 512GB",
      "category": {"id": 224, "name": "Смартфоны"},
      "product_infos": [
        {
          "id": 10,
          "shop": {"id": 1, "name": "Связной"},
          "model": "apple/iphone/xs-max",
          "price": 110000,
          "price_rrc": 116990,
          "quantity": 14,
          "parameters": [
            {"parameter": "Цвет", "value": "золотистый"},
            {"parameter": "Объём встроенной памяти (Гб)", "value": "512"}
          ]
        }
      ]
    }
  ]
}
```

---

## Корзина (покупатель)

### GET /basket/
Текущая корзина.

### POST /basket/
Добавить товар.
```json
{"items": [{"product_info": 10, "quantity": 2}]}
```

### PUT /basket/
Обновить количество.
```json
{"items": [{"id": 5, "quantity": 3}]}
```

### DELETE /basket/
Удалить позиции.
```json
{"items": [5, 6]}
```

---

## Заказы (покупатель)

### GET /orders/
Список всех заказов (кроме корзины).

### POST /orders/
Подтвердить корзину. Переводит state: basket → new.
```json
{"contact": 2}
```
После подтверждения — email покупателю и администратору.

---

## Партнёр (поставщик)

### POST /partner/update/
Загрузить/обновить прайс.

Вариант 1 — по URL:
```json
{"url": "https://example.com/price.yaml"}
```

Вариант 2 — файл (multipart/form-data):
```
file: price.yaml
```

**Response 200:**
```json
{"status": "ok", "message": "Прайс обновлён"}
```

---

### GET /partner/export/
Экспортировать текущий прайс в YAML.

**Response 200:** файл `price.yaml`

---

### GET /partner/state/
Текущий статус приёма заказов.

**Response 200:**
```json
{"state": true}
```

### PUT /partner/state/
Изменить статус.
```json
{"state": false}
```

---

### GET /partner/orders/
Список заказов, содержащих товары данного поставщика.

---

## Администратор

### GET /admin/orders/
Все заказы системы.

### PUT /admin/order/
Изменить статус заказа.
```json
{"id": 5, "state": "confirmed"}
```
После изменения — email покупателю.

**Возможные статусы:**
- `basket` — корзина
- `new` — новый
- `confirmed` — подтверждён
- `assembled` — собран
- `sent` — отправлен
- `delivered` — доставлен
- `cancelled` — отменён

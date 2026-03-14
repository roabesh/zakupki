# Zakupki API — Спецификация

Base URL: `http://localhost:8000/api/v1/`

Аутентификация: Token `Authorization: Token <token>`

Интерактивная документация (Swagger): http://localhost:8000/api/docs/

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
Поле `type`: `"buyer"` (покупатель) или `"supplier"` (поставщик).

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
Запрос на сброс пароля. Отправляет письмо на указанный email.

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
Обновить профиль пользователя (любые поля из GET-ответа).

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

**Телефон:**
```json
{"type": "phone", "phone": "+79991234567"}
```
**Адрес:**
```json
{
  "type": "address",
  "city": "Москва",
  "street": "Ленина",
  "house": "1",
  "structure": "",
  "building": "",
  "apartment": "10"
}
```

---

### PUT /user/contact/
Обновить контакт.
```json
{"id": 2, "city": "Санкт-Петербург"}
```

---

### DELETE /user/contact/
Удалить контакт.
```json
{"id": 2}
```

---

## Каталог

### GET /categories/
Список всех категорий.

**Response 200:**
```json
[
  {"id": 1, "name": "Смартфоны"},
  {"id": 2, "name": "Аксессуары"}
]
```

---

### GET /shops/
Список активных магазинов (`state=True`).

**Response 200:**
```json
[
  {"id": 1, "name": "ТехноМир"},
  {"id": 2, "name": "ДигиМаг"}
]
```

---

### GET /products/
Каталог товаров. Фильтры: `?shop_id=1`, `?category_id=1`, `?search=samsung`.

Пагинация: `?page=2` (20 товаров на страницу).

**Response 200:**
```json
{
  "count": 57,
  "next": "http://localhost:8000/api/v1/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Смартфон Samsung Galaxy S24 256GB",
      "category": {"id": 1, "name": "Смартфоны"},
      "product_infos": [
        {
          "id": 10,
          "shop": "ТехноМир",
          "model": "samsung/galaxy-s24",
          "price": "69000.00",
          "price_rrc": "74990.00",
          "quantity": 10,
          "parameters": [
            {"parameter": "Цвет", "value": "черный"},
            {"parameter": "Объём памяти (ГБ)", "value": "256"}
          ]
        }
      ]
    }
  ]
}
```

---

### GET /products/{id}/
Детали одного товара (все поставщики с ценами).

---

## Корзина (покупатель)

### GET /basket/
Текущая корзина с позициями.

### POST /basket/
Добавить товар.
```json
{"items": [{"product_info": 10, "quantity": 2}]}
```

### PUT /basket/
Обновить количество позиции.
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
Список всех оформленных заказов пользователя (кроме корзины).

**Response 200:**
```json
[
  {
    "id": 4,
    "state": "sent",
    "created_at": "2025-03-10T12:00:00Z",
    "total_sum": "311930.00",
    "contact": {"city": "Москва", "street": "Ленина", "house": "1"},
    "order_items": [...],
    "shop_states": {
      "ТехноМир": "sent",
      "ТехноЦентр": "confirmed"
    }
  }
]
```

---

### POST /orders/
Оформить заказ (перевести корзину в статус `new`).
```json
{"contact": 2}
```
После оформления отправляется email покупателю и администратору.

---

### GET /orders/{id}/
Детали заказа. Содержит `shop_states` — статус каждого поставщика.

**Response 200:**
```json
{
  "id": 4,
  "state": "partially_sent",
  "created_at": "2025-03-10T12:00:00Z",
  "total_sum": "311930.00",
  "contact": {
    "city": "Москва",
    "street": "Ленина",
    "house": "1",
    "apartment": "15"
  },
  "order_items": [
    {
      "id": 10,
      "product_info": {
        "id": 5,
        "shop": "ТехноМир",
        "model": "apple/iphone-15",
        "price": "89990.00",
        "price_rrc": "99990.00"
      },
      "quantity": 1
    }
  ],
  "shop_states": {
    "ТехноМир": "sent",
    "ТехноЦентр": "confirmed"
  }
}
```

---

## Партнёр (поставщик)

> Все эндпоинты требуют аутентификации пользователя с `type=supplier`.

### GET /partner/state/
Текущий статус приёма заказов.

**Response 200:**
```json
{"state": true}
```

### PUT /partner/state/
Изменить статус приёма заказов.
```json
{"state": false}
```

---

### POST /partner/update/
Загрузить/обновить прайс-лист. Запускает импорт асинхронно (Celery).

**Вариант 1 — по URL:**
```json
{"url": "https://example.com/price.yaml"}
```

**Вариант 2 — файл (`multipart/form-data`):**
```
file: price.yaml
```

**Response 200:**
```json
{"status": "ok", "message": "Прайс обновлён"}
```

---

### GET /partner/export/
Экспортировать текущий прайс-лист в YAML.

**Response 200:** файл `price.yaml`

---

### GET /partner/orders/
Список заказов, содержащих товары данного поставщика.

Возвращает только позиции (`order_items`) текущего поставщика. Поле `state` — статус именно этого поставщика в заказе (из `ShopOrder`).

**Response 200:**
```json
[
  {
    "id": 4,
    "state": "confirmed",
    "created_at": "2025-03-10T12:00:00Z",
    "total_sum": "99990.00",
    "order_items": [
      {
        "id": 10,
        "product_info": {
          "id": 5,
          "shop": "ТехноМир",
          "model": "apple/iphone-15",
          "price_rrc": "99990.00"
        },
        "quantity": 1
      }
    ]
  }
]
```

---

### GET /partner/orders/{id}/
Детали заказа покупателя (только позиции текущего поставщика).

Поле `state` — статус текущего поставщика в этом заказе.

---

### PUT /partner/orders/{id}/
Обновить свой статус в заказе. Общий статус `Order.state` пересчитывается автоматически.

**Допустимые переходы:**
- `new` → `confirmed`, `cancelled`
- `confirmed` → `assembled`, `cancelled`
- `assembled` → `sent`
- `sent` → `delivered`

**Request:**
```json
{"state": "confirmed"}
```

**Response 200:**
```json
{"status": "ok"}
```

---

## Администратор

> Требует `is_staff=True` (суперпользователь Django).

### GET /admin/orders/
Все заказы системы.

---

### PUT /admin/order/
Изменить статус любого заказа. После изменения отправляется email покупателю.

```json
{"id": 5, "state": "confirmed"}
```

---

## Статусы заказа

| Статус | Описание |
|--------|----------|
| `basket` | Корзина (черновик, не оформлен) |
| `new` | Оформлен покупателем |
| `confirmed` | Подтверждён поставщиком |
| `assembled` | Собран |
| `sent` | Отправлен (все поставщики отправили) |
| `partially_sent` | Отправлен частично (часть поставщиков отправила) |
| `delivered` | Доставлен (все поставщики подтвердили) |
| `cancelled` | Отменён |

При заказе с несколькими поставщиками у каждого поставщика — свой независимый статус (`ShopOrder`). Итоговый статус заказа вычисляется автоматически по всем поставщикам.

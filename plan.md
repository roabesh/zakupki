# Plan: Zakupki — Трекер этапов разработки

## Этапы разработки

### Этап 1: Настройка проекта [x]
- [x] Создать virtualenv
- [x] Установить зависимости (requirements/)
- [x] Инициализировать Django-проект с разделёнными settings (base/dev/prod)
- [x] Создать `.env.example`
- [x] Инициализировать git, добавить `.gitignore`
- [x] Создать `plan.md` и `README.md`
- [x] Первый коммит → push

---

### Этап 2: Модели данных [x]
- [x] Кастомный User (email, type: buyer/supplier)
- [x] Shop (name, url, user, state)
- [x] Category, Product, ProductInfo, Parameter, ProductParameter
- [x] Contact (phone x1, address x5), Order, OrderItem
- [x] Миграции + Django Admin

---

### Этап 3: Импорт товаров [x]
- [x] POST /api/v1/partner/update/ (url или файл YAML)
- [x] Парсинг YAML: shop, categories, goods + parameters
- [x] Upsert ProductInfo + ProductParameter по external_id

---

### Этап 4: API Views [x]
- [x] Аутентификация: регистрация, login (Token), сброс пароля
- [x] Профиль пользователя и контакты
- [x] Каталог: categories, shops, products (фильтрация)
- [x] Корзина: CRUD
- [x] Заказы: подтверждение + email
- [x] Партнёр: state, orders
- [x] Admin: статус заказа

---

### Этап 5: Полный backend [x]
- [x] Экспорт прайса в YAML
- [x] Email: покупателю + администратору
- [x] Email при изменении статуса заказа
- [x] Тесты (pytest) — 25 тестов
- [x] OpenAPI документация (drf-spectacular)

---

### Этап 6: Celery async [x]
- [x] Настройка Celery + Redis
- [x] Async задачи: email, импорт, экспорт
- [x] 202 Accepted для долгих операций

---

### Этап 7: Django Admin (расширенная) [ ]
- [ ] Список заказов с фильтрами
- [ ] Action: смена статуса + email клиенту
- [ ] Inline OrderItem в заказе

---

### Этап 8: Docker [ ]
- [ ] Dockerfile (multi-stage)
- [ ] docker-compose.yml: web, db, redis, celery
- [ ] Проверка: `docker-compose up`

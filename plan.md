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

### Этап 2: Модели данных [ ]
- [ ] Кастомный User (email, type: buyer/supplier)
- [ ] Shop (name, url, user, state)
- [ ] Category, Product, ProductInfo, Parameter, ProductParameter
- [ ] Contact (phone x1, address x5), Order, OrderItem
- [ ] Миграции + Django Admin

---

### Этап 3: Импорт товаров [ ]
- [ ] POST /api/v1/partner/update/ (url или файл YAML)
- [ ] Парсинг YAML: shop, categories, goods + parameters
- [ ] Upsert ProductInfo + ProductParameter по external_id

---

### Этап 4: API Views [ ]
- [ ] Аутентификация: регистрация, login (Token), сброс пароля
- [ ] Профиль пользователя и контакты
- [ ] Каталог: categories, shops, products (фильтрация)
- [ ] Корзина: CRUD
- [ ] Заказы: подтверждение + email
- [ ] Партнёр: state, orders
- [ ] Admin: статус заказа

---

### Этап 5: Полный backend [ ]
- [ ] Экспорт прайса в YAML
- [ ] Email: покупателю + администратору
- [ ] Email при изменении статуса заказа
- [ ] Тесты (pytest)
- [ ] OpenAPI документация (drf-spectacular)

---

### Этап 6: Celery async [ ]
- [ ] Настройка Celery + Redis
- [ ] Async задачи: email, импорт, экспорт
- [ ] 202 Accepted для долгих операций

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

# Zakupki — Сервис автоматизации закупок

Fullstack-сервис для автоматизации закупок. Покупатели формируют заказы из товаров нескольких поставщиков через единый каталог. Поставщики управляют прайс-листом и отслеживают статусы своих заказов.

## Содержание

- [Стек технологий](#стек-технологий)
- [Структура проекта](#структура-проекта)
- [Тестовые аккаунты и демо-данные](#тестовые-аккаунты-и-демо-данные)
- [Быстрый старт](#быстрый-старт)
- [Docker](#docker)
- [API документация](#api-документация)
- [Импорт товаров](#импорт-товаров)
- [Тесты](#тесты)
- [Переменные окружения](#переменные-окружения)

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Backend | Python 3.13, Django 5.0, DRF 3.15 |
| API-документация | drf-spectacular (Swagger / ReDoc) |
| Frontend | React 18, TypeScript, Vite 6 |
| UI | Tailwind CSS v4, lucide-react |
| Стейт | Zustand + TanStack Query v5 |
| База данных | PostgreSQL (prod) / SQLite (dev) |
| Очередь задач | Celery 5.4 + Redis |
| Тесты | pytest + pytest-django (36 тестов) |
| Деплой | Docker + Docker Compose |

---

## Структура проекта

```
zakupki/
│
├── manage.py                       # Точка входа Django (добавляет backend/ в sys.path)
├── db.sqlite3                      # SQLite база разработчика (в .gitignore)
├── .env                            # Локальные переменные окружения (в .gitignore)
├── .env.example                    # Шаблон переменных окружения
│
├── docs/                           # Документация и демо-данные
│   ├── api.md                      # Полная спецификация REST API
│   ├── demo.sqlite3                # Готовая демо-база с тестовыми данными ✅
│   ├── shop_data_example.yaml      # Пример YAML-прайса для импорта
│   ├── digiмаg_prices.yaml         # Прайс-лист магазина ДигиМаг
│   ├── audiomarket_prices.yaml     # Прайс-лист магазина АудиоМаркет
│   └── technocentr_prices.yaml     # Прайс-лист магазина ТехноЦентр
│
├── requirements/
│   ├── base.txt                    # Зависимости для всех окружений
│   ├── development.txt             # + pytest, debug-toolbar, ipython
│   └── production.txt              # + gunicorn, whitenoise, sentry-sdk
│
├── docker/
│   ├── Dockerfile                  # Multi-stage образ backend (python:3.13-slim)
│   └── docker-compose.yml          # web + postgres + redis + celery + frontend
│
├── backend/
│   ├── conftest.py                 # Фикстуры pytest
│   │
│   ├── config/                     # Настройки и конфигурация Django
│   │   ├── settings/
│   │   │   ├── base.py             # Общие настройки (apps, DRF, Celery, email)
│   │   │   ├── development.py      # SQLite, DEBUG=True, debug-toolbar
│   │   │   └── production.py       # PostgreSQL, WhiteNoise, HTTPS, HSTS
│   │   ├── urls.py                 # Корневой URL-роутер
│   │   ├── celery.py               # Celery application
│   │   └── wsgi.py                 # WSGI entry point (gunicorn)
│   │
│   ├── apps/
│   │   ├── users/                  # Пользователи, аутентификация, контакты
│   │   │   ├── models.py           # User (email-based), Contact
│   │   │   ├── serializers.py
│   │   │   ├── views.py            # register, login, details, contact CRUD
│   │   │   └── migrations/
│   │   │
│   │   ├── shops/                  # Магазины поставщиков
│   │   │   ├── models.py           # Shop, ShopOrder (статус заказа у поставщика)
│   │   │   ├── views.py            # partner state/orders/update/export
│   │   │   ├── admin.py
│   │   │   └── migrations/
│   │   │
│   │   ├── products/               # Каталог товаров
│   │   │   ├── models.py           # Category, Product, ProductInfo, Parameter
│   │   │   ├── services.py         # Импорт YAML-прайса
│   │   │   ├── views.py            # categories, shops, products (с фильтрацией)
│   │   │   └── migrations/
│   │   │
│   │   └── orders/                 # Заказы и корзина
│   │       ├── models.py           # Order, OrderItem (state: basket→delivered)
│   │       ├── serializers.py      # OrderSerializer + shop_states
│   │       ├── views.py            # basket CRUD, order place, order list/detail
│   │       └── migrations/
│   │
│   ├── tasks/
│   │   ├── email_tasks.py          # Celery-задачи отправки email
│   │   └── import_tasks.py         # Celery-задача импорта прайса по URL
│   │
│   └── tests/                      # 36 тестов
│       ├── test_users.py           # Регистрация, логин, профиль
│       ├── test_contacts.py        # Создание, лимиты контактов
│       ├── test_import.py          # Импорт YAML, upsert, ошибки
│       ├── test_products.py        # Каталог, фильтры, скрытые магазины
│       └── test_basket_orders.py   # Корзина → заказ, email-уведомления
│
└── frontend/
    ├── Dockerfile                  # Multi-stage: node:18 (сборка) → nginx (раздача)
    ├── nginx.conf                  # SPA fallback + proxy /api/ → backend:8000
    ├── vite.config.ts              # Proxy /api/ → localhost:8000 (dev)
    ├── tailwind.config.ts
    ├── package.json
    │
    └── src/
        ├── router.tsx              # React Router v6 (защищённые маршруты)
        ├── api/                    # Axios-клиент + функции запросов к API
        ├── store/                  # Zustand: authStore, basketStore
        ├── types/                  # TypeScript-интерфейсы (Order, Product, User…)
        ├── utils/                  # formatPrice, formatDate, orderStateConfig
        ├── components/
        │   ├── layout/             # AppShell, Header, BottomBar
        │   └── ui/                 # Общие UI-компоненты
        └── pages/
            ├── auth/               # LoginPage, RegisterPage
            ├── catalog/            # CatalogPage, ProductDetailPage
            ├── basket/             # BasketPage
            ├── checkout/           # CheckoutPage
            ├── orders/             # OrdersPage, OrderDetailPage
            ├── profile/            # ProfilePage
            ├── admin/              # AdminOrdersPage
            └── partner/            # PartnerDashboard, PartnerOrdersPage,
                                    # PartnerOrderDetailPage, UploadPage
```

---

## Тестовые аккаунты и демо-данные

> Все аккаунты используют пароль: **`Test1234!`**

### Покупатель

| Email | Роль |
|-------|------|
| `buyer@test.com` | Покупатель |

В базе есть **3 оформленных заказа** для этого покупателя:
- Заказ #1 — 2 позиции от ТехноМир, статус **Отправлен**
- Заказ #3 — 2 позиции от ТехноМир, статус **Собран**
- Заказ #4 — 3 позиции от ТехноМир + ТехноЦентр, статус **Отправлен** (оба поставщика)

### Поставщики

| Email | Магазин | Категории |
|-------|---------|-----------|
| `supplier@test.com` | ТехноМир | Смартфоны, Ноутбуки, Аксессуары, Аудиотехника, Бытовая техника |
| `digiмаg@test.com` | ДигиМаг | Смартфоны, Ноутбуки, Аксессуары |
| `audio@test.com` | АудиоМаркет | Аудиотехника, Аксессуары |
| `technocentr@test.com` | ТехноЦентр | Смартфоны, Ноутбуки, Бытовая техника |

### Администратор (Django Admin)

| Email | Пароль | URL |
|-------|--------|-----|
| `admin@test.com` | `Test1234!` | http://localhost:8000/admin/ |

### Каталог демо-данных

**57 товаров**, **82 позиции** (с ценами по магазинам) в **5 категориях**:

| Категория | Позиций в каталоге |
|-----------|-------------------|
| Смартфоны | 17 |
| Аудиотехника | 17 |
| Аксессуары | 19 |
| Ноутбуки | 15 |
| Бытовая техника | 14 |

Многие товары пересекаются между поставщиками — можно сравнивать цены в карточке товара.

### Использование демо-базы

```bash
# Скопировать демо-базу как рабочую (заменит текущую)
cp docs/demo.sqlite3 db.sqlite3
```

Демо-база содержит всех тестовых пользователей, товары 4 поставщиков и 3 оформленных заказа.

---

## Быстрый старт

### Backend (локально)

```bash
# 1. Клонировать репозиторий
git clone git@github.com:roabesh/zakupki.git
cd zakupki

# 2. Создать виртуальное окружение
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# 3. Установить зависимости
pip install -r requirements/development.txt

# 4. Настроить переменные окружения
cp .env.example .env
# При необходимости отредактировать .env

# 5a. Использовать готовую демо-базу (рекомендуется для тестирования)
cp docs/demo.sqlite3 db.sqlite3

# 5b. Или применить миграции и загрузить данные с нуля
python manage.py migrate
python manage.py createsuperuser

# 6. Запустить сервер
python manage.py runserver       # http://localhost:8000
```

> `manage.py` находится в корне проекта и автоматически добавляет `backend/` в `sys.path`.
> `DJANGO_SETTINGS_MODULE=config.settings.development` задан в `.env.example`.

### Frontend (локально)

```bash
# В отдельном терминале
cd frontend
npm install
npm run dev    # http://localhost:5173
```

Vite автоматически проксирует все `/api/*` запросы на `http://localhost:8000`.

---

## Docker

```bash
# Запустить всё окружение
docker-compose -f docker/docker-compose.yml up --build
```

Сервисы после запуска:

| Сервис | URL |
|--------|-----|
| Фронтенд (Nginx + React) | http://localhost |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/api/docs/ |
| Django Admin | http://localhost:8000/admin/ |

Состав `docker-compose.yml`:
- `postgres:16-alpine` — база данных
- `redis:7-alpine` — брокер задач
- `web` — Django (gunicorn, 3 workers)
- `frontend` — Nginx, раздаёт React SPA и проксирует `/api/`
- `celery` — воркер задач (2 concurrency)
- `celery-beat` — планировщик периодических задач

---

## API документация

После запуска сервера:

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI схема**: http://localhost:8000/api/schema/

Полная спецификация всех эндпоинтов — [`docs/api.md`](docs/api.md).

### Основные эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/v1/user/register/` | Регистрация |
| POST | `/api/v1/user/login/` | Авторизация, возвращает токен |
| GET/PUT | `/api/v1/user/details/` | Профиль пользователя |
| GET/POST/PUT/DELETE | `/api/v1/user/contact/` | Контакты (телефон, адреса) |
| GET | `/api/v1/categories/` | Список категорий |
| GET | `/api/v1/shops/` | Список активных магазинов |
| GET | `/api/v1/products/` | Каталог товаров (фильтры: `?shop_id=`, `?category_id=`) |
| GET/POST/PUT/DELETE | `/api/v1/basket/` | Корзина |
| GET/POST | `/api/v1/orders/` | Список заказов / оформление |
| GET | `/api/v1/orders/{id}/` | Детали заказа |
| GET/PUT | `/api/v1/partner/state/` | Статус приёма заказов (поставщик) |
| POST | `/api/v1/partner/update/` | Загрузить/обновить прайс |
| GET | `/api/v1/partner/export/` | Экспортировать прайс в YAML |
| GET | `/api/v1/partner/orders/` | Заказы покупателей (поставщик) |
| GET | `/api/v1/partner/orders/{id}/` | Детали заказа покупателя (поставщик) |
| PUT | `/api/v1/partner/orders/{id}/` | Обновить статус заказа (поставщик) |
| GET | `/api/v1/admin/orders/` | Все заказы (администратор) |
| PUT | `/api/v1/admin/order/` | Изменить статус любого заказа |

---

## Импорт товаров

Поставщик загружает прайс через API (по URL или файлом). Примеры прайсов — в `docs/`.

### Формат YAML

```yaml
shop: Название магазина
categories:
  - id: 1
    name: Смартфоны
goods:
  - id: 1001
    category: 1
    model: samsung/galaxy-s24
    name: Смартфон Samsung Galaxy S24 256GB
    price: 69000
    price_rrc: 74990
    quantity: 10
    parameters:
      Цвет: черный
      Объём памяти (ГБ): 256
      Диагональ экрана (дюйм): 6.2
```

Полный пример — [`docs/shop_data_example.yaml`](docs/shop_data_example.yaml).
Готовые прайс-листы тестовых магазинов:
- [`docs/digiмаg_prices.yaml`](docs/digiмаg_prices.yaml) — ДигиМаг
- [`docs/audiomarket_prices.yaml`](docs/audiomarket_prices.yaml) — АудиоМаркет
- [`docs/technocentr_prices.yaml`](docs/technocentr_prices.yaml) — ТехноЦентр

### Загрузка через API

```bash
# По URL
curl -X POST http://localhost:8000/api/v1/partner/update/ \
  -H "Authorization: Token <ваш_токен>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/price.yaml"}'

# Файлом
curl -X POST http://localhost:8000/api/v1/partner/update/ \
  -H "Authorization: Token <ваш_токен>" \
  -F "file=@docs/shop_data_example.yaml"
```

---

## Статусы заказа

```
basket → new → confirmed → assembled → sent ─┐
                                              ├→ delivered
                              partially_sent ─┘
                        ↓
                    cancelled
```

| Статус | Описание | Кто меняет |
|--------|----------|-----------|
| `basket` | Корзина (черновик) | — |
| `new` | Оформлен покупателем | Покупатель при оформлении |
| `confirmed` | Подтверждён поставщиком | Поставщик |
| `assembled` | Собран | Поставщик |
| `sent` | Отправлен (все поставщики) | Поставщики |
| `partially_sent` | Отправлен частично | Автоматически (часть поставщиков отправила) |
| `delivered` | Доставлен (все поставщики подтвердили) | Поставщики |
| `cancelled` | Отменён | Поставщик / Администратор |

При заказе с несколькими поставщиками каждый поставщик управляет **своим** статусом (`ShopOrder`). Общий статус заказа вычисляется автоматически.

---

## Тесты

```bash
# Запуск всех тестов
source venv/bin/activate
DJANGO_SETTINGS_MODULE=config.settings.development \
PYTHONPATH=backend \
pytest backend/tests/ -v

# С отчётом о покрытии
pytest backend/tests/ --cov=backend --cov-report=html
# Отчёт: backend/htmlcov/index.html
```

Покрытие тестами (36 тестов):

| Модуль | Что тестируется |
|--------|----------------|
| `test_users.py` | Регистрация, логин, профиль, email-уведомление |
| `test_contacts.py` | Создание телефона, адресов, лимиты, удаление |
| `test_import.py` | YAML-импорт, upsert, обработка ошибок |
| `test_products.py` | Каталог, фильтры, скрытые магазины |
| `test_basket_orders.py` | Корзина, оформление заказа, email |

---

## Переменные окружения

Полный шаблон — [`.env.example`](.env.example).

| Переменная | Описание | По умолчанию |
|-----------|---------|------------|
| `SECRET_KEY` | Секретный ключ Django | — |
| `DEBUG` | Режим отладки | `False` |
| `ALLOWED_HOSTS` | Разрешённые хосты | `localhost,127.0.0.1` |
| `DJANGO_SETTINGS_MODULE` | Модуль настроек | `config.settings.development` |
| `DATABASE_URL` | URL базы данных | SQLite (`db.sqlite3`) |
| `CELERY_BROKER_URL` | URL Redis-брокера | `redis://localhost:6379/0` |
| `EMAIL_HOST_USER` | Email для отправки писем | — |
| `ADMIN_EMAIL` | Email администратора | — |

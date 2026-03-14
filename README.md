# Zakupki — Сервис автоматизации закупок

Fullstack-сервис для автоматизации закупок в розничной сети. Backend — Django REST Framework, Frontend — React 18 + TypeScript.

## Описание

Сервис позволяет покупателям формировать заказы из товаров нескольких поставщиков через единый каталог. Поставщики управляют своим прайс-листом через API.

### Пользователи системы

**Покупатель:**
- Регистрация и авторизация через API
- Просмотр каталога с фильтрацией по магазинам и категориям
- Формирование корзины из товаров разных поставщиков
- Оформление и отслеживание заказов

**Поставщик:**
- Загрузка и обновление прайс-листа (YAML)
- Управление статусом приёма заказов
- Просмотр заказов со своими товарами

## Стек технологий

| Компонент | Технология |
|-----------|-----------|
| Backend | Python 3.13, Django 5.0 |
| API | Django REST Framework 3.15 |
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + lucide-react |
| Стейт | Zustand + TanStack Query v5 |
| Маршрутизация | React Router v6 |
| База данных | PostgreSQL (prod) / SQLite (dev) |
| Очередь задач | Celery 5.4 + Redis |
| Документация API | drf-spectacular (Swagger/ReDoc) |
| Тесты | pytest + pytest-django (36 тестов) |
| Деплой | Docker + Docker Compose |

## Быстрый старт

### Локальная разработка

#### Backend

```bash
# 1. Клонировать репозиторий
git clone git@github.com:roabesh/zakupki.git
cd zakupki

# 2. Создать и активировать виртуальное окружение
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# 3. Установить зависимости
pip install -r requirements/development.txt

# 4. Настроить переменные окружения
cp .env.example .env
# Отредактировать .env по необходимости

# 5. Применить миграции
cd backend
python manage.py migrate

# 6. Создать суперпользователя
python manage.py createsuperuser

# 7. Запустить сервер
python manage.py runserver  # http://localhost:8000
```

#### Frontend

```bash
# В отдельном терминале (из корня проекта)
cd frontend
npm install
npm run dev  # http://localhost:5173
```

Vite автоматически проксирует `/api/*` запросы на `http://localhost:8000`.

### Через Docker

```bash
docker-compose -f docker/docker-compose.yml up --build
```

После запуска:
- Фронтенд: http://localhost:80
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/api/docs/

## API Документация

После запуска сервера документация доступна:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- Схема OpenAPI: http://localhost:8000/api/schema/

## Структура проекта

```
zakupki/
├── backend/
│   ├── config/              # Настройки Django
│   │   ├── settings/
│   │   │   ├── base.py      # Базовые настройки
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── celery.py
│   ├── apps/
│   │   ├── users/           # Пользователи и контакты
│   │   ├── shops/           # Магазины поставщиков
│   │   ├── products/        # Каталог товаров
│   │   └── orders/          # Заказы и корзина
│   ├── tasks/               # Celery-задачи
│   └── tests/               # pytest-тесты (36 шт.)
├── frontend/
│   ├── src/                 # Исходный код React
│   │   ├── api/             # Axios клиент + API функции
│   │   ├── components/      # UI и layout компоненты
│   │   ├── pages/           # Страницы приложения
│   │   ├── store/           # Zustand (auth, basket)
│   │   ├── types/           # TypeScript типы
│   │   └── utils/           # Утилиты (formatPrice и др.)
│   ├── Dockerfile           # Multi-stage сборка (node → nginx)
│   ├── nginx.conf           # SPA fallback + /api/ proxy
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── api.md               # Спецификация API
│   └── shop_data_example.yaml
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.example
└── manage.py
```

## Импорт товаров

Поставщик загружает прайс через API или по URL файла. Формат YAML:

```yaml
shop: Название магазина
categories:
  - id: 224
    name: Смартфоны
goods:
  - id: 4216292
    category: 224
    model: apple/iphone/xs-max
    name: Смартфон Apple iPhone XS Max 512GB
    price: 110000
    price_rrc: 116990
    quantity: 14
    parameters:
      Цвет: золотистый
      Объём встроенной памяти (Гб): 512
```

## Запуск тестов

```bash
cd backend
pytest
# С покрытием:
pytest --cov=. --cov-report=html
```

## Переменные окружения

Полный список переменных см. в `.env.example`.

| Переменная | Описание | По умолчанию |
|-----------|---------|------------|
| SECRET_KEY | Секретный ключ Django | — |
| DEBUG | Режим отладки | False |
| DATABASE_URL | URL подключения к БД | SQLite |
| REDIS_URL | URL Redis | redis://localhost:6379/0 |
| EMAIL_HOST_USER | Email для отправки | — |
| ADMIN_EMAIL | Email администратора | — |

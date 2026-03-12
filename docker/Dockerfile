# --- Этап сборки зависимостей ---
FROM python:3.13-slim AS builder

WORKDIR /build

# Устанавливаем системные зависимости для psycopg2 и Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/production.txt .
RUN pip install --upgrade pip && \
    pip wheel --no-cache-dir --wheel-dir /wheels -r production.txt


# --- Финальный образ ---
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production

WORKDIR /app

# Системные зависимости для работы приложения
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Копируем собранные wheels и устанавливаем без компиляции
COPY --from=builder /wheels /wheels
COPY requirements/production.txt .
RUN pip install --no-cache --no-index --find-links=/wheels -r production.txt && \
    rm -rf /wheels

# Копируем код приложения
COPY backend/ /app/
COPY manage.py /app/

# Создаём непривилегированного пользователя
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]

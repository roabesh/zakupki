# Этап 1: Сборка приложения
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

# Этап 2: Сервер nginx для production
FROM nginx:alpine
# Копируем собранные файлы
COPY --from=builder /app/dist /usr/share/nginx/html
# Копируем конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

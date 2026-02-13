# Freelance Platform

Платформа для взаимодействия фрилансеров и клиентов с поддержкой безопасных платежей через escrow-сервис.

## Структура проекта

- `backend/` - NestJS API сервер с TypeScript, Prisma ORM, PostgreSQL
- `frontend/` - Next.js клиент с TypeScript и Tailwind CSS

## Требования

- Node.js 18+
- PostgreSQL
- Redis (для очередей)
- Docker (опционально, для локального запуска)

## Установка и запуск

### 1. Клонирование репозитория

```bash
git clone <URL_REPOSITORY>
cd <REPOSITORY_NAME>
```

### 2. Установка зависимостей

```bash
# Установка зависимостей для backend
cd backend
npm install

# Установка зависимостей для frontend
cd ../frontend
npm install
```

### 3. Настройка переменных окружения

Создайте файлы `.env` в директориях `backend` и `frontend`:

**backend/.env:**
```
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/freelance_platform"
JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_jwt_refresh_secret"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
REDIS_URL="redis://localhost:6379"
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_S3_BUCKET_NAME="your_bucket_name"
AWS_REGION="us-east-1"
```

**frontend/.env.local:**
```
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 4. Настройка базы данных

```bash
# В директории backend/
npx prisma db push
# или для миграции
npx prisma migrate dev
```

### 5. Запуск приложения

**Локальный запуск:**

```bash
# Запуск backend
cd backend
npm run start:dev

# Запуск frontend
cd frontend
npm run dev
```

**Запуск с Docker:**

```bash
docker-compose up --build
```

## Заполнение начальных данных

Для заполнения базы начальными данными выполните:

```bash
cd backend
npx prisma db seed
```

Сиды находятся в файле `backend/prisma/seed.ts`

## Тестовые карты Stripe

Для тестирования платежей используйте следующие тестовые данные:

- Номер карты: `4242 4242 4242 4242`
- Месяц/Год: Любой будущий срок
- CVC: Любые 3 цифры
- Почта: Любая валидная почта

Другие тестовые карты Stripe:
- `4000000003220` - Отклоненная карта
- `40000000003063` - Карта, требующая 3D Secure
- `4000000003055` - Карта с недостаточными средствами

## API документация

Swagger UI доступен по адресу: `http://localhost:3000/api` после запуска backend сервера.

## Основные функции

1. **Аутентификация**
   - Регистрация/вход пользователей
   - JWT токены (access/refresh)
   - Роли: клиент и фрилансер

2. **Управление профилями**
   - CRUD операции с профилями
   - Загрузка аватаров через S3

3. **Управление проектами**
   - Создание проектов (только для клиентов)
   - Фильтрация по навыкам, бюджету и поисковому запросу

4. **Управление предложениями**
   - Отклики на проекты (только для фрилансеров)
   - Ограничение количества откликов

5. **Платежи**
   - Создание сделок с escrow
   - Подтверждение выполнения работы
   - Вывод средств с комиссией

6. **Споры**
   - Создание споров по сделкам
   - Административное разрешение споров

7. **Общение**
   - Реалтайм чат через WebSocket
   - Только для участников сделки
   - Поддержка вложений

8. **Уведомления**
   - Email уведомления
   - Push-уведомления
   - Через фоновые очереди

## Архитектура

- **Backend**: NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **База данных**: PostgreSQL
- **Очереди**: BullMQ, Redis
- **Файловое хранилище**: AWS S3
- **Платежи**: Stripe
- **Реалтайм коммуникации**: Socket.IO
- **Документация API**: Swagger/OpenAPI

## CI/CD

Репозиторий настроен с GitHub Actions:
- Линтинг, тестирование и сборка при пуше
- Деплой в staging при слиянии в main
- Автоматические миграции базы данных
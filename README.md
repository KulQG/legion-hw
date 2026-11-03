# Legion HW

Два NestJS приложения:

- `user-service` принимает HTTP-запросы на `http://localhost:8080` и записывает события переводов в outbox.
- `notification-service` читает события из Kafka и отправляет уведомления через Socket.IO на `http://localhost:8081`.

PostgreSQL, Redis, MinIO, Kafka и Kafka UI запускаются через Docker Compose. Команды ниже выполняются из корня репозитория; оба NestJS приложения запускаются на компьютере, вне Docker.

## Подготовка

1. Установите зависимости:

   ```bash
   pnpm install
   ```

2. Создайте `.env` на основе `.env.example` и заполните обязательные переменные. Для локального запуска используйте следующие адреса:

   | Переменная | Значение |
   | --- | --- |
   | `USER_SERVICE_PORT` | `8080` |
   | `NOTIFICATION_SERVICE_PORT` | `8081` |
   | `KAFKA_URL` | `localhost:9092` |
   | `REDIS_URL` | `redis://localhost:6379` |
   | `MINIO_URL` | `http://localhost:9000` |

   `DATABASE_URL` должен указывать на PostgreSQL по адресу `localhost:5432` и базу `mybd`, указанную в `docker-compose.yml`. Укажите в нём того же пользователя и пароль, что и в настройках контейнера. Задайте `POSTGRES_PASSWORD`, `MINIO_PASSWORD`, `JWT_SECRET`, `REFRESH_JWT_SECRET` и `CRON_SCHEDULE`. Для MinIO используйте `MINIO_ACCESS_KEY=minioadmin` и задайте `MINIO_SECRET_KEY` равным `MINIO_PASSWORD`. Не публикуйте `.env` в репозитории.

   `KAFKA_PORT` из `.env.example` сейчас не используется: порт Kafka задан в `docker-compose.yml`.

3. Запустите инфраструктуру и дождитесь готовности PostgreSQL и Kafka:

   ```bash
   docker compose up -d
   ```

4. Примените миграции и сгенерируйте Prisma Client:

   ```bash
   pnpm exec prisma migrate dev --config prisma7.config.ts
   pnpm exec prisma generate --config prisma7.config.ts
   ```

   Kafka UI доступен по адресу `http://localhost:8090`. Адрес `kafka:29092` предназначен для контейнеров внутри сети Docker; локальные приложения подключаются к `localhost:9092`.

## Запуск приложений

Откройте два терминала в корне репозитория:

```bash
pnpm exec nest start user-service --watch
```

```bash
pnpm exec nest start notification-service --watch
```

Для запуска собранного кода вместо режима разработки:

```bash
pnpm run build:user
pnpm run build:notification
pnpm run start:prod:user
pnpm run start:prod:notification
```

Последние две команды также запускаются в разных терминалах. Swagger user-service доступен по адресу `http://localhost:8080/api`.

## Проверка перевода и уведомлений

1. Создайте двух пользователей через `POST http://localhost:8080/auth/register`, затем войдите под каждым через `POST http://localhost:8080/auth/login`. В ответе на вход находится `access_token`. ID получателя можно получить через `GET http://localhost:8080/users/me` с его токеном в заголовке `Authorization: Bearer <token>`.

2. У нового пользователя баланс равен нулю. Для локальной проверки пополните баланс отправителя тестовыми данными, подставив его email:

   ```bash
   docker compose exec postgres psql -U postgres -d mybd -c "UPDATE users SET balance = 100 WHERE email = 'sender@example.com';"
   ```

3. Откройте консоль браузера и подключите обоих пользователей к Socket.IO. Подставьте их `access_token`:

   ```js
   const { io } = await import('https://cdn.socket.io/4.8.4/socket.io.esm.min.js');

   const sender = io('http://localhost:8081', {
     auth: { token: '<ACCESS_TOKEN_ОТПРАВИТЕЛЯ>' },
     transports: ['websocket'],
   });
   const recipient = io('http://localhost:8081', {
     auth: { token: '<ACCESS_TOKEN_ПОЛУЧАТЕЛЯ>' },
     transports: ['websocket'],
   });

   sender.on('connect', () => console.log('sender connected'));
   recipient.on('connect', () => console.log('recipient connected'));
   sender.on('connect_error', console.error);
   recipient.on('connect_error', console.error);
   sender.on('notification', (event) => console.log('sender:', event));
   recipient.on('notification', (event) => console.log('recipient:', event));
   ```

4. Отправьте HTTP-запрос через любой клиент, например Postman. Используйте токен **отправителя** и новый UUID в заголовке `idempotency-key`:

   ```http
   POST http://localhost:8080/transfers
   Authorization: Bearer <ACCESS_TOKEN_ОТПРАВИТЕЛЯ>
   idempotency-key: <UUID>
   Content-Type: application/json

   {"toUserId":"<ID_ПОЛУЧАТЕЛЯ>","amount":"10.00"}
   ```

   После публикации события из outbox в Kafka отправитель увидит событие `notification` с типом `transfer-sent`, а получатель — `notification` с типом `transfer-received`. Публикация выполняется фоновым заданием, поэтому уведомления могут прийти через несколько секунд после HTTP-ответа.

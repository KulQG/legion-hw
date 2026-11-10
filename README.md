# Legion HW

Два NestJS приложения:

- `user-service` принимает HTTP-запросы на `http://localhost:8080` и записывает события переводов в outbox.
- `notification-service` читает события из Kafka, сохраняет уведомления в MongoDB и отправляет их через Socket.IO на `http://localhost:8081`.

PostgreSQL, MongoDB, Redis, MinIO, Kafka и Kafka UI запускаются через Docker Compose. Команды ниже выполняются из корня репозитория; оба NestJS приложения запускаются на компьютере, вне Docker.

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
   | `MONGO_URL` | `mongodb://USER:PASSWORD@127.0.0.1:27017/notifications?authSource=admin` |

   `DATABASE_URL` должен указывать на PostgreSQL по адресу `localhost:5432` и базу `mybd`, указанную в `docker-compose.yml`. Укажите в нём того же пользователя и пароль, что и в настройках контейнера. Задайте `POSTGRES_PASSWORD`, `MINIO_PASSWORD`, `JWT_SECRET`, `REFRESH_JWT_SECRET` и `CRON_SCHEDULE`. Для MinIO используйте `MINIO_ACCESS_KEY=minioadmin` и задайте `MINIO_SECRET_KEY` равным `MINIO_PASSWORD`. Не публикуйте `.env` в репозитории.

   `KAFKA_PORT` из `.env.example` сейчас не используется: порт Kafka задан в `docker-compose.yml`.

   Добавьте `MONGO_USER`, `MONGO_PASSWORD` и `MONGO_URL`, если их нет в шаблоне. В `MONGO_URL` замените `USER` и `PASSWORD` значениями из `MONGO_USER` и `MONGO_PASSWORD`; специальные символы в логине и пароле должны быть URL-кодированы. `authSource=admin` нужен для пользователя, создаваемого настройками контейнера. Локальное приложение подключается к `127.0.0.1:27017`; имя `mongodb` предназначено для общей Docker-сети. Данные MongoDB хранятся в volume `mongodata`; переменные создания пользователя применяются при первой инициализации пустой базы.

3. Запустите инфраструктуру и дождитесь готовности PostgreSQL, MongoDB и Kafka:

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
     autoConnect: false,
     auth: { token: '<ACCESS_TOKEN_ОТПРАВИТЕЛЯ>' },
     transports: ['websocket'],
   });
   const recipient = io('http://localhost:8081', {
     autoConnect: false,
     auth: { token: '<ACCESS_TOKEN_ПОЛУЧАТЕЛЯ>' },
     transports: ['websocket'],
   });

   sender.on('connect', () => console.log('sender connected'));
   recipient.on('connect', () => console.log('recipient connected'));
   sender.on('connect_error', console.error);
   recipient.on('connect_error', console.error);
   function handleNotifications(socket, label) {
     const receivedIds = new Set();

     socket.on('notification', (event, acknowledge) => {
       if (!receivedIds.has(event.id)) {
         console.log(label, event);
         receivedIds.add(event.id);
       }

       // Подтверждаем также повторы: предыдущий ACK мог не дойти.
       acknowledge(true);
     });
   }

   handleNotifications(sender, 'sender:');
   handleNotifications(recipient, 'recipient:');
   sender.connect();
   recipient.connect();
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

   Формат события — `{ id, data }`: `id` идентифицирует уведомление, `data.type` задаёт его тип, а `data.transferId` — ID перевода. Для отправителя в `data` передаются `sum` и `toUser`, для получателя — `sum` и `fromUser`.

5. Проверьте доставку после отключения: выполните `recipient.disconnect()`, создайте ещё один перевод с новым `idempotency-key` и дождитесь публикации события. Затем выполните `recipient.connect()`: сохранённое неполученное уведомление должно прийти с прежним обработчиком ACK. После подтверждения повторное отключение и подключение не должно заново доставлять эту запись из истории.

## Сохранение и подтверждение доставки

- Kafka offset коммитится вручную после сохранения уведомлений обоих участников в MongoDB, до отправки по Socket.IO.
- Повторное событие использует существующие записи благодаря `upsert` и уникальному индексу `{ userId, eventId }`. В поле `eventId` сейчас сохраняется `idempotencyKey` перевода. Для защиты от конкурентных вставок индекс должен быть создан в MongoDB.
- События отправляются в комнату пользователя всем его подключённым вкладкам и устройствам. ACK `true` хотя бы одного устройства позволяет выставить `received: true` для уведомления пользователя. Это подтверждение получения клиентом, а не прочтения человеком и не доставки каждому устройству.
- Сервер ждёт ACK до пяти секунд. Без подтверждения уведомление остаётся с `received: false`; история повторно отправляется при подключении группами до 10 уведомлений одновременно. Фонового повтора по таймеру нет.
- При обычном сетевом обрыве клиент Socket.IO автоматически пытается переподключиться. После явного `disconnect()` в примере нужно вызвать `connect()` вручную.
- Повторные доставки возможны, например при потере ACK. Клиент должен устранять повторы по `id` и подтверждать их. В примере `Set` живёт только до перезагрузки страницы; в приложении подтверждайте событие после успешной обработки и обеспечьте дедупликацию в используемом хранилище уведомлений.

# LEGION HW

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# start postgres & redis
$ docker compose up -d

# prisma client init
$ npx prisma generate

# prisma pull migrates
$ npx prisma migrate dev

# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

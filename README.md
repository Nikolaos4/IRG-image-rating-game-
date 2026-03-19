# compairy

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)

Игровая платформа для соревнований по угадыванию популярности изображений.

## Как запустить

1. Заполните файл `api/.env`, указав необходимые переменные окружения. Вы можете использовать файл `api/.env.example` в качестве шаблона.
2. Установите зависимости сервера:
    ```
    cd api
    npm ci
    ```
3. Запустите сервер:
    ```
    npm run dev
    ```
    Сервер будет доступен по адресу `http://localhost:3000`.
4. Установите зависимости клиента:
    ```
    cd client
    npm ci
    ```
5. Запустите клиент:
    ```
    npm run dev
    ```
    Клиент будет доступен по адресу `http://localhost:5173`.

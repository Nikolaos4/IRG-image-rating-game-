# compairy

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)

Игровая платформа для соревнований по угадыванию популярности изображений.

## Как запустить

Инструкция для `api`:<br>
1. В папке `api` самостоятельно создайте файл `.env` (перед `.` ничего писать не нужно). В файле `api/.env.sample` находятся объявления необходимых переменных, их надо скопировать и заполнить.<br>
***Заполнение переменных в .env:***<br>
1.1 В JWT_SECRET не писать что-то в ковычках -> приведет к ошибке.<br>
1.2 На своем устройстве откройте pgAdmin и сформируйте там базу данных, затем создайте к ней ссылку по следующему шаблону:<br>
    `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`<br>
    **В USER** обычно postgres (если другой, то надо искать в Login/Group Roles)<br>
    **В PASSWORD** пишите пароль, который был создан при установке PostgreSQL<br>
    **В HOST** обычно localhost<br>
    **В PORT** по умолчанию стоит 5432 (можно найти в свойства сервера → Connection)<br>
    **В DATABASE** пишите название созданной базы данных<br>
    Затем получившуюся ссылку надо вписать в DATABASE_URL в `""` <- таких ковычках.
2. Установите зависимости сервера:
    ```
    cd api
    npm ci
    ```
3. Запустите миграции (перед этим надо обязательно создать базу данных, иначе приведет к ошибке):
    ```
    npx prisma generate
    npx prisma migrate dev
    ```
4. Заполняет базу данных тестовыми данными (лучше запустить):
    ```
    npm run seed
    ```
5. Запустите сервер:
    ```
    npm run dev
    ```
    Сервер будет доступен по адресу `http://localhost:3000`.

Инструкция для `client`:<br>
(Следующее прописывать в отдельном терминале)<br>
1. Установите зависимости клиента:
    ```
    cd client
    npm ci
    ```
2. Запустите клиент:
    ```
    npm run dev
    ```
    Клиент будет доступен по адресу `http://localhost:5173`.

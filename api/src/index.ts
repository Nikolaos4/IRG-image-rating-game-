import fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";

import "dotenv/config";

import {
    fastifyZodOpenApiPlugin,
    fastifyZodOpenApiTransformers,
    serializerCompiler,
    validatorCompiler,
} from "fastify-zod-openapi";
import createGame from "./routes/games/create-game.js";
import gameRealtime from "./routes/games/game-ws.js";
import getGame from "./routes/games/get-game.js";
import joinGame from "./routes/games/join-game.js";
import getResult from "./routes/games/result.js";
import roundRealtime from "./routes/games/round-ws.js";
import getRound from "./routes/games/round.js";
import editGame from "./routes/games/settings-game.js";
import startGame from "./routes/games/start-game.js";
import account from "./routes/account.js";
import admin from "./routes/admin.js";
import auth from "./routes/auth.js";
import news from "./routes/news.js";
import rating from "./routes/rating.js";
import themes from "./routes/themes.js";
const app = fastify();

app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

await app.register(fastifyZodOpenApiPlugin);

app.register(jwt, {
    secret: process.env.JWT_SECRET,
});

app.register(websocket);

app.register(swagger, {
    openapi: {
        openapi: "3.0.0",
        info: {
            title: "Compairy API",
            description: "API documentation for Compairy",
            version: "1.0.0",
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server",
            },
        ],
        tags: [
            { name: "auth", description: "auth" },
            { name: "game", description: "game" },
            { name: "theme", description: "theme" },
            { name: "rating", description: "rating" },
            { name: "admin", description: "admin" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    ...fastifyZodOpenApiTransformers,
});

app.register(swaggerUi, {
    routePrefix: "/docs",
});

app.after(() => {
    app.register(
        (app) => {
            app.register(createGame);
            app.register(gameRealtime);
            app.register(getGame);
            app.register(joinGame);
            app.register(getResult);
            app.register(roundRealtime);
            app.register(getRound);
            app.register(editGame);
            app.register(startGame);

            app.register(account);
            app.register(admin);
            app.register(auth);
            app.register(news);
            app.register(rating);
            app.register(themes);
        },
        { prefix: "/api" },
    );
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.listen({ host: "0.0.0.0", port: 3000 }, (err, address) => {
    if (err) {
        console.error(err);
    }

    console.log(`Server is running at ${address}`);
});
await app.ready();

app.swagger();

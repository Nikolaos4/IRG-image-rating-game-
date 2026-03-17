import fastify from "fastify";
import autoload from "@fastify/autoload";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
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
const app = fastify();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.register(cors, {
    origin: "*",
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

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(autoload, {
    dir: join(__dirname, "routes"),
    routeParams: true,
    options: { prefix: "/api" },
});

app.listen({ port: 3000 }, (err, address) => {
    if (err) {
        console.error(err);
    }

    console.log(`Server is running at ${address}`);
});

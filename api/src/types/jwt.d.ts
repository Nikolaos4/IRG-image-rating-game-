import "@fastify/jwt";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: {
            user_id: number;
            role: number;
        };
        user: {
            user_id: number;
            role: number;
        };
    }
}

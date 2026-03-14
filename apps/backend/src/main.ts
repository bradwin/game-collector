import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { env } from "./config/env.js";
import { registerHealthRoutes } from "./health/routes.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { registerGameRoutes } from "./games/routes.js";
import { registerOwnershipRoutes } from "./ownership/routes.js";
import { registerPurchaseRoutes } from "./purchases/routes.js";

export const buildApp = () => {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });
  app.register(jwt, { secret: env.AUTH_JWT_SECRET });

  app.decorate("authenticate", async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ message: "Unauthorized" });
    }
  });

  app.register(registerHealthRoutes, { prefix: "/health" });
  app.register(registerAuthRoutes, { prefix: "/auth" });
  app.register(registerGameRoutes, { prefix: "/games" });
  app.register(registerOwnershipRoutes, { prefix: "/ownership" });
  app.register(registerPurchaseRoutes, { prefix: "/purchases" });

  return app;
};

const app = buildApp();

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

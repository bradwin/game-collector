import { FastifyPluginAsync } from "fastify";
import { prisma } from "../common/prisma.js";

export const registerHealthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/live", async () => ({ status: "ok" }));

  app.get("/ready", async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ready" };
    } catch (error) {
      request.log.error({ error }, "Readiness check failed");
      return reply.code(503).send({ status: "not_ready", message: "Database unavailable" });
    }
  });
};

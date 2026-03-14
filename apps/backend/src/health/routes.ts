import { FastifyPluginAsync } from "fastify";

export const registerHealthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/live", async () => ({ status: "ok" }));

  app.get("/ready", async () => {
    // TODO: add database and external dependency checks.
    return { status: "ready" };
  });
};

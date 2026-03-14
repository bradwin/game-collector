import { FastifyPluginAsync } from "fastify";
import { platformService } from "./service.js";

export const registerPlatformRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async () => {
    const items = await platformService.list();
    return { items };
  });
};

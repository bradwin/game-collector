import { FastifyPluginAsync } from "fastify";

export const registerGameRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    // TODO: return persisted games list.
    return { items: [] };
  });

  app.post("/", async () => {
    // TODO: persist created game.
    return { id: "todo-game-id" };
  });
};

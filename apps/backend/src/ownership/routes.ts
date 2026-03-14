import { FastifyPluginAsync } from "fastify";

export const registerOwnershipRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    // TODO: return ownership records.
    return { items: [] };
  });

  app.post("/", async () => {
    // TODO: persist ownership record.
    return { id: "todo-ownership-id" };
  });
};

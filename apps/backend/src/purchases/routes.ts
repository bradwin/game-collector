import { FastifyPluginAsync } from "fastify";

export const registerPurchaseRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    // TODO: return purchase records.
    return { items: [] };
  });

  app.post("/", async () => {
    // TODO: persist purchase record.
    return { id: "todo-purchase-id" };
  });
};

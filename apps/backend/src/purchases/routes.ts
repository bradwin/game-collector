import { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../common/errors.js";
import { purchaseIdSchema, purchaseBodySchema, purchasePatchSchema } from "./schemas.js";
import { purchaseService } from "./service.js";

const getUserId = (request: any) => String(request.user.sub);

export const registerPurchaseRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async (request) => {
    const items = await purchaseService.listByUser(getUserId(request));
    return { items };
  });

  app.get("/:id", async (request, reply) => {
    try {
      const params = purchaseIdSchema.parse(request.params);
      const item = await purchaseService.getByIdForUser(params.id, getUserId(request));
      return { item };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ message: "Invalid id", issues: error.issues });
      }
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ message: error.message });
      }
      throw error;
    }
  });

  app.post("/", async (request, reply) => {
    try {
      const body = purchaseBodySchema.parse(request.body);
      const item = await purchaseService.createForUser(getUserId(request), body);
      return reply.code(201).send({ item });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ message: "Invalid payload", issues: error.issues });
      }
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ message: error.message });
      }
      throw error;
    }
  });

  app.patch("/:id", async (request, reply) => {
    try {
      const params = purchaseIdSchema.parse(request.params);
      const body = purchasePatchSchema.parse(request.body);
      const item = await purchaseService.updateForUser(params.id, getUserId(request), body);
      return { item };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ message: "Invalid request", issues: error.issues });
      }
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ message: error.message });
      }
      throw error;
    }
  });
};

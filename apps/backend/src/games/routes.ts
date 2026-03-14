import { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../common/errors.js";
import { gameService } from "./service.js";
import { gameBodySchema, gameListQuerySchema, gamePatchSchema, idParamSchema } from "./schemas.js";

export const registerGameRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async (request, reply) => {
    try {
      const query = gameListQuerySchema.parse(request.query);
      const items = await gameService.list(query);
      return { items };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ message: "Invalid query", issues: error.issues });
      }
      throw error;
    }
  });

  app.get("/:id", async (request, reply) => {
    try {
      const params = idParamSchema.parse(request.params);
      const item = await gameService.getById(params.id);
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
      const body = gameBodySchema.parse(request.body);
      const item = await gameService.create(body);
      return reply.code(201).send({ item });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ message: "Invalid request payload", issues: error.issues });
      }
      throw error;
    }
  });

  app.patch("/:id", async (request, reply) => {
    try {
      const params = idParamSchema.parse(request.params);
      const body = gamePatchSchema.parse(request.body);
      const item = await gameService.update(params.id, body);
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

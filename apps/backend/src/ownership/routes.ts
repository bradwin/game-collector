import { FastifyPluginAsync } from "fastify";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../common/errors.js";
import {
  ownershipBodySchema,
  ownershipIdSchema,
  ownershipListQuerySchema,
  ownershipPatchSchema
} from "./schemas.js";
import { ownershipService } from "./service.js";

const getUserId = (request: any) => String(request.user.sub);

export const registerOwnershipRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async (request, reply) => {
    try {
      const filters = ownershipListQuerySchema.parse(request.query);
      const items = await ownershipService.listByUser(getUserId(request), filters);
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
      const params = ownershipIdSchema.parse(request.params);
      const item = await ownershipService.getByIdForUser(params.id, getUserId(request));
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
      const body = ownershipBodySchema.parse(request.body);
      const item = await ownershipService.createForUser(getUserId(request), body);
      return reply.code(201).send({ item });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ message: "Invalid payload", issues: error.issues });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return reply.code(400).send({ message: "Referenced game or platform was not found" });
      }
      throw error;
    }
  });

  app.patch("/:id", async (request, reply) => {
    try {
      const params = ownershipIdSchema.parse(request.params);
      const body = ownershipPatchSchema.parse(request.body);
      const item = await ownershipService.updateForUser(params.id, getUserId(request), body);
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

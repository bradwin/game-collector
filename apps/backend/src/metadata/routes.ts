import { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";
import { metadataImportBodySchema, metadataSearchQuerySchema } from "./schemas.js";
import { metadataService } from "./service.js";

export const registerMetadataRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/search", async (request, reply) => {
    try {
      const query = metadataSearchQuerySchema.parse(request.query);
      return await metadataService.search(query.q);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ message: "Invalid query", issues: error.issues });
      }

      request.log.error(error);
      return reply.code(502).send({ message: "Metadata provider request failed" });
    }
  });

  app.post("/import", async (request, reply) => {
    try {
      const body = metadataImportBodySchema.parse(request.body);
      const item = await metadataService.importGame(body);
      return reply.code(201).send({ item });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ message: "Invalid payload", issues: error.issues });
      }
      throw error;
    }
  });
};

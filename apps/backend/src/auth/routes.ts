import { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../common/errors.js";
import { authPayloadSchema } from "./schemas.js";
import { authService } from "./service.js";
import { env } from "../config/env.js";

export const registerAuthRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (request, reply) => {
    try {
      const payload = authPayloadSchema.parse(request.body);
      const user = await authService.register(payload.email, payload.password);
      return reply.code(201).send({ user });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ message: "Invalid request payload", issues: error.issues });
      }
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ message: error.message });
      }
      throw error;
    }
  });

  app.post("/login", async (request, reply) => {
    try {
      const payload = authPayloadSchema.parse(request.body);
      const user = await authService.login(payload.email, payload.password);
      const token = await reply.jwtSign(
        { sub: user.id, email: user.email },
        { expiresIn: env.AUTH_JWT_EXPIRES_IN }
      );

      return { accessToken: token, user };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ message: "Invalid request payload", issues: error.issues });
      }
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ message: error.message });
      }
      throw error;
    }
  });
};

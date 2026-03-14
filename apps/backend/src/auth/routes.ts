import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerAuthRoutes: FastifyPluginAsync = async (app) => {
  app.post("/login", async (request, reply) => {
    const payload = loginSchema.parse(request.body);

    // TODO: validate credentials against persisted users.
    const token = await reply.jwtSign({ sub: payload.email });

    return { accessToken: token };
  });

  app.post("/register", async (request) => {
    const payload = loginSchema.parse(request.body);

    // TODO: create user in database and hash password.
    return { user: { id: "todo-user-id", email: payload.email } };
  });
};

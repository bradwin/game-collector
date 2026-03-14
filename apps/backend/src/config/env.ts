import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  AUTH_JWT_SECRET: z.string().min(8).default("dev-secret-change-me"),
  AUTH_JWT_EXPIRES_IN: z.string().default("1h"),
  RAWG_API_KEY: z.string().optional()
});

export const env = schema.parse(process.env);

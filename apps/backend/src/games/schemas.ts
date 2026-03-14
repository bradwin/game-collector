import { z } from "zod";

export const gameListQuerySchema = z.object({
  q: z.string().trim().min(1).optional()
});

export const gameBodySchema = z.object({
  title: z.string().trim().min(1),
  releaseDate: z.string().datetime().optional().nullable()
});

export const gamePatchSchema = gameBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
});

export const idParamSchema = z.object({
  id: z.string().min(1)
});

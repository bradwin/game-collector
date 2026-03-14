import { z } from "zod";

export const metadataSearchQuerySchema = z.object({
  q: z.string().trim().min(1)
});

export const metadataImportBodySchema = z.object({
  provider: z.literal("RAWG"),
  externalId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  releaseDate: z.string().date().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable()
});

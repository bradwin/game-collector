import { z } from "zod";
import { OWNERSHIP_MEDIUM, OWNERSHIP_STATUS, PLAY_STATUS } from "./constants.js";

export const ownershipListQuerySchema = z.object({
  platformId: z.string().min(1).optional(),
  medium: z.enum(OWNERSHIP_MEDIUM).optional(),
  status: z.enum(OWNERSHIP_STATUS).optional(),
  q: z.string().trim().min(1).optional()
});

export const ownershipBodySchema = z.object({
  gameId: z.string().min(1),
  platformId: z.string().min(1),
  medium: z.enum(OWNERSHIP_MEDIUM),
  status: z.enum(OWNERSHIP_STATUS).optional(),
  playStatus: z.enum(PLAY_STATUS).optional(),
  editionName: z.string().trim().min(1).optional().nullable(),
  region: z.string().trim().min(1).optional().nullable(),
  digitalStore: z.string().trim().min(1).optional().nullable(),
  source: z.string().trim().min(1).optional().nullable(),
  notes: z.string().trim().min(1).optional().nullable(),
  acquiredAt: z.string().datetime().optional().nullable()
});

export const ownershipPatchSchema = ownershipBodySchema
  .omit({ gameId: true, platformId: true, medium: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided"
  });

export const ownershipIdSchema = z.object({
  id: z.string().min(1)
});

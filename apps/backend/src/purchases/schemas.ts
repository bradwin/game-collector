import { z } from "zod";

export const purchaseBodySchema = z.object({
  ownershipEntryId: z.string().min(1),
  purchasedAt: z.string().datetime().optional().nullable(),
  priceCents: z.number().int().nonnegative().optional().nullable(),
  currencyCode: z.string().trim().min(3).max(3).optional().nullable(),
  vendor: z.string().trim().min(1).optional().nullable(),
  notes: z.string().trim().min(1).optional().nullable()
});

export const purchasePatchSchema = purchaseBodySchema
  .omit({ ownershipEntryId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided"
  });

export const purchaseIdSchema = z.object({
  id: z.string().min(1)
});

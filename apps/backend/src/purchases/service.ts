import { Prisma } from "@prisma/client";
import { AppError } from "../common/errors.js";
import { prisma } from "../common/prisma.js";
import { purchaseRepository } from "./repository.js";

const normalizeString = (value?: string | null) => value ?? null;

export const purchaseService = {
  listByUser: (userId: string) => purchaseRepository.listByUser(userId),

  async getByIdForUser(id: string, userId: string) {
    const purchase = await purchaseRepository.getById(id);
    if (!purchase || purchase.userId !== userId) {
      throw new AppError(404, "Purchase not found");
    }
    return purchase;
  },

  async createForUser(
    userId: string,
    input: {
      ownershipEntryId: string;
      purchasedAt?: string | null;
      priceCents?: number | null;
      currencyCode?: string | null;
      vendor?: string | null;
      notes?: string | null;
    }
  ) {
    const ownership = await prisma.ownershipEntry.findUnique({
      where: { id: input.ownershipEntryId }
    });

    if (!ownership || ownership.userId !== userId) {
      throw new AppError(404, "Ownership entry not found");
    }

    return purchaseRepository.create({
      user: { connect: { id: userId } },
      ownershipEntry: { connect: { id: input.ownershipEntryId } },
      purchasedAt: input.purchasedAt ? new Date(input.purchasedAt) : null,
      priceCents: input.priceCents ?? null,
      currencyCode: normalizeString(input.currencyCode?.toUpperCase()),
      vendor: normalizeString(input.vendor),
      notes: normalizeString(input.notes)
    });
  },

  async updateForUser(
    id: string,
    userId: string,
    input: {
      purchasedAt?: string | null;
      priceCents?: number | null;
      currencyCode?: string | null;
      vendor?: string | null;
      notes?: string | null;
    }
  ) {
    await this.getByIdForUser(id, userId);

    try {
      return await purchaseRepository.update(id, {
        purchasedAt: input.purchasedAt === undefined ? undefined : input.purchasedAt ? new Date(input.purchasedAt) : null,
        priceCents: input.priceCents === undefined ? undefined : input.priceCents,
        currencyCode:
          input.currencyCode === undefined ? undefined : normalizeString(input.currencyCode?.toUpperCase()),
        vendor: input.vendor === undefined ? undefined : normalizeString(input.vendor),
        notes: input.notes === undefined ? undefined : normalizeString(input.notes)
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Purchase not found");
      }
      throw error;
    }
  }
};

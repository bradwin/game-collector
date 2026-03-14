import { Prisma } from "@prisma/client";
import { prisma } from "../common/prisma.js";

const ownershipIncludes = {
  game: {
    include: {
      providerRefs: true,
      mediaAssets: {
        orderBy: { sortOrder: "asc" }
      }
    }
  },
  platform: true,
  purchases: {
    orderBy: [{ purchasedAt: "desc" }, { createdAt: "desc" }]
  }
} satisfies Prisma.OwnershipEntryInclude;

export const ownershipRepository = {
  listByUser: (userId: string, filters: { platformId?: string; medium?: string; status?: string; q?: string }) => {
    const where: Prisma.OwnershipEntryWhereInput = { userId };

    if (filters.platformId) where.platformId = filters.platformId;
    if (filters.medium) where.medium = filters.medium;
    if (filters.status) where.status = filters.status;
    if (filters.q) {
      where.game = {
        title: { contains: filters.q }
      };
    }

    return prisma.ownershipEntry.findMany({
      where,
      include: ownershipIncludes,
      orderBy: [{ createdAt: "desc" }]
    });
  },

  getById: (id: string) =>
    prisma.ownershipEntry.findUnique({
      where: { id },
      include: ownershipIncludes
    }),

  create: (input: Prisma.OwnershipEntryCreateInput) =>
    prisma.ownershipEntry.create({
      data: input,
      include: ownershipIncludes
    }),

  update: (id: string, input: Prisma.OwnershipEntryUpdateInput) =>
    prisma.ownershipEntry.update({
      where: { id },
      data: input,
      include: ownershipIncludes
    })
};

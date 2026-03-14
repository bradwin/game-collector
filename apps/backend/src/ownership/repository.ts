import { Prisma } from "@prisma/client";
import { prisma } from "../common/prisma.js";

export const ownershipRepository = {
  listByUser: (userId: string, filters: { platformId?: string; medium?: string; status?: string }) => {
    const where: Prisma.OwnershipEntryWhereInput = { userId };

    if (filters.platformId) where.platformId = filters.platformId;
    if (filters.medium) where.medium = filters.medium;
    if (filters.status) where.status = filters.status;

    return prisma.ownershipEntry.findMany({
      where,
      include: {
        game: true,
        platform: true,
        purchases: true
      },
      orderBy: [{ createdAt: "desc" }]
    });
  },

  getById: (id: string) =>
    prisma.ownershipEntry.findUnique({
      where: { id },
      include: {
        game: true,
        platform: true,
        purchases: true
      }
    }),

  create: (input: Prisma.OwnershipEntryCreateInput) =>
    prisma.ownershipEntry.create({
      data: input,
      include: {
        game: true,
        platform: true,
        purchases: true
      }
    }),

  update: (id: string, input: Prisma.OwnershipEntryUpdateInput) =>
    prisma.ownershipEntry.update({
      where: { id },
      data: input,
      include: {
        game: true,
        platform: true,
        purchases: true
      }
    })
};

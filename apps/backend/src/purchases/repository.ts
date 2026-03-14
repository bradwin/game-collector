import { Prisma } from "@prisma/client";
import { prisma } from "../common/prisma.js";

export const purchaseRepository = {
  listByUser: (userId: string) =>
    prisma.purchase.findMany({
      where: { userId },
      include: {
        ownershipEntry: {
          include: {
            game: true,
            platform: true
          }
        }
      },
      orderBy: [{ purchasedAt: "desc" }, { createdAt: "desc" }]
    }),

  getById: (id: string) =>
    prisma.purchase.findUnique({
      where: { id },
      include: {
        ownershipEntry: {
          include: {
            game: true,
            platform: true
          }
        }
      }
    }),

  create: (input: Prisma.PurchaseCreateInput) =>
    prisma.purchase.create({
      data: input,
      include: {
        ownershipEntry: {
          include: {
            game: true,
            platform: true
          }
        }
      }
    }),

  update: (id: string, input: Prisma.PurchaseUpdateInput) =>
    prisma.purchase.update({
      where: { id },
      data: input,
      include: {
        ownershipEntry: {
          include: {
            game: true,
            platform: true
          }
        }
      }
    })
};

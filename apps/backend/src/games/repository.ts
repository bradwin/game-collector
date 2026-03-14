import { Prisma } from "@prisma/client";
import { prisma } from "../common/prisma.js";

export const gameRepository = {
  list: (query: { q?: string }) =>
    prisma.game.findMany({
      where: query.q
        ? {
            title: {
              contains: query.q
            }
          }
        : undefined,
      orderBy: [{ title: "asc" }],
      include: {
        providerRefs: true,
        mediaAssets: true
      }
    }),

  getById: (id: string) =>
    prisma.game.findUnique({
      where: { id },
      include: {
        providerRefs: true,
        mediaAssets: true
      }
    }),

  create: (input: Prisma.GameCreateInput) =>
    prisma.game.create({
      data: input,
      include: {
        providerRefs: true,
        mediaAssets: true
      }
    }),

  update: (id: string, input: Prisma.GameUpdateInput) =>
    prisma.game.update({
      where: { id },
      data: input,
      include: {
        providerRefs: true,
        mediaAssets: true
      }
    })
};

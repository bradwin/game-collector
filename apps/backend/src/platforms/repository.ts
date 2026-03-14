import { prisma } from "../common/prisma.js";

export const platformRepository = {
  list: () =>
    prisma.platform.findMany({
      orderBy: [{ name: "asc" }]
    })
};

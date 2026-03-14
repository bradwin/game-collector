import { prisma } from "../common/prisma.js";

export const authRepository = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email }
    }),
  createUser: (email: string, passwordHash: string) =>
    prisma.user.create({
      data: { email, passwordHash }
    })
};

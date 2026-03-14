import { Prisma } from "@prisma/client";
import { AppError } from "../common/errors.js";
import { hashPassword, verifyPassword } from "../common/auth-password.js";
import { authRepository } from "./repository.js";

const sanitizeUser = (user: { id: string; email: string; createdAt: Date; updatedAt: Date }) => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const authService = {
  async register(email: string, password: string) {
    try {
      const user = await authRepository.createUser(email, hashPassword(password));
      return sanitizeUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "Email already registered");
      }
      throw error;
    }
  },

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new AppError(401, "Invalid email or password");
    }

    return sanitizeUser(user);
  }
};

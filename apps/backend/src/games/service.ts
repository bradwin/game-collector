import { Prisma } from "@prisma/client";
import { AppError } from "../common/errors.js";
import { gameRepository } from "./repository.js";

export const gameService = {
  list: (query: { q?: string }) => gameRepository.list(query),

  async getById(id: string) {
    const game = await gameRepository.getById(id);
    if (!game) {
      throw new AppError(404, "Game not found");
    }
    return game;
  },

  create: (input: { title: string; releaseDate?: string | null }) =>
    gameRepository.create({
      title: input.title,
      releaseDate: input.releaseDate ? new Date(input.releaseDate) : null
    }),

  async update(id: string, input: { title?: string; releaseDate?: string | null }) {
    const data: Prisma.GameUpdateInput = {};

    if (input.title !== undefined) {
      data.title = input.title;
    }

    if (input.releaseDate !== undefined) {
      data.releaseDate = input.releaseDate ? new Date(input.releaseDate) : null;
    }

    try {
      return await gameRepository.update(id, data);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Game not found");
      }
      throw error;
    }
  }
};

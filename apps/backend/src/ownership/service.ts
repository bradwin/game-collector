import { Prisma } from "@prisma/client";
import { AppError } from "../common/errors.js";
import { ownershipRepository } from "./repository.js";
import { OwnershipMedium, OwnershipStatus, PlayStatus } from "./constants.js";

const normalizeString = (value?: string | null) => value ?? null;

export const ownershipService = {
  listByUser: (userId: string, filters: { platformId?: string; medium?: string; status?: string; q?: string }) =>
    ownershipRepository.listByUser(userId, filters),

  async getByIdForUser(id: string, userId: string) {
    const entry = await ownershipRepository.getById(id);
    if (!entry || entry.userId !== userId) {
      throw new AppError(404, "Ownership entry not found");
    }
    return entry;
  },

  createForUser: (userId: string, input: {
    gameId: string;
    platformId: string;
    medium: OwnershipMedium;
    status?: OwnershipStatus;
    playStatus?: PlayStatus;
    editionName?: string | null;
    region?: string | null;
    digitalStore?: string | null;
    source?: string | null;
    notes?: string | null;
    acquiredAt?: string | null;
  }) =>
    ownershipRepository.create({
      user: { connect: { id: userId } },
      game: { connect: { id: input.gameId } },
      platform: { connect: { id: input.platformId } },
      medium: input.medium,
      status: input.status,
      playStatus: input.playStatus,
      editionName: normalizeString(input.editionName),
      region: normalizeString(input.region),
      digitalStore: normalizeString(input.digitalStore),
      source: normalizeString(input.source),
      notes: normalizeString(input.notes),
      acquiredAt: input.acquiredAt ? new Date(input.acquiredAt) : null
    }),

  async updateForUser(
    id: string,
    userId: string,
    input: {
      status?: OwnershipStatus;
      playStatus?: PlayStatus;
      editionName?: string | null;
      region?: string | null;
      digitalStore?: string | null;
      source?: string | null;
      notes?: string | null;
      acquiredAt?: string | null;
    }
  ) {
    await this.getByIdForUser(id, userId);

    try {
      return await ownershipRepository.update(id, {
        status: input.status,
        playStatus: input.playStatus,
        editionName: input.editionName === undefined ? undefined : normalizeString(input.editionName),
        region: input.region === undefined ? undefined : normalizeString(input.region),
        digitalStore: input.digitalStore === undefined ? undefined : normalizeString(input.digitalStore),
        source: input.source === undefined ? undefined : normalizeString(input.source),
        notes: input.notes === undefined ? undefined : normalizeString(input.notes),
        acquiredAt: input.acquiredAt === undefined ? undefined : input.acquiredAt ? new Date(input.acquiredAt) : null
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Ownership entry not found");
      }
      throw error;
    }
  }
};

import { prisma } from "../common/prisma.js";
import { rawgMetadataAdapter } from "./providers/rawg.adapter.js";

export const metadataService = {
  async search(query: string) {
    return {
      providerConfigured: rawgMetadataAdapter.isConfigured(),
      items: await rawgMetadataAdapter.searchGames(query)
    };
  },

  async importGame(input: {
    provider: "RAWG";
    externalId: string;
    title: string;
    releaseDate?: string | null;
    coverImageUrl?: string | null;
    sourceUrl?: string | null;
  }) {
    const existingRef = await prisma.gameProviderRef.findUnique({
      where: {
        provider_externalId: {
          provider: input.provider,
          externalId: input.externalId
        }
      },
      include: {
        game: {
          include: {
            providerRefs: true,
            mediaAssets: true
          }
        }
      }
    });

    if (existingRef?.game) {
      return existingRef.game;
    }

    return prisma.game.create({
      data: {
        title: input.title,
        releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
        providerRefs: {
          create: {
            provider: input.provider,
            externalId: input.externalId,
            sourceUrl: input.sourceUrl ?? null
          }
        },
        mediaAssets: input.coverImageUrl
          ? {
              create: {
                type: "COVER",
                url: input.coverImageUrl,
                sortOrder: 0
              }
            }
          : undefined
      },
      include: {
        providerRefs: true,
        mediaAssets: true
      }
    });
  }
};

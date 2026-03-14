import { MetadataProvider, GameMetadata } from "./provider.interface.js";

export class RawgMetadataAdapter implements MetadataProvider {
  constructor(private readonly apiKey: string) {}

  async searchGames(query: string): Promise<GameMetadata[]> {
    void query;
    void this.apiKey;
    // TODO: call RAWG search endpoint and map response.
    return [];
  }

  async getGameById(providerGameId: string): Promise<GameMetadata | null> {
    void providerGameId;
    void this.apiKey;
    // TODO: call RAWG game details endpoint and map response.
    return null;
  }
}

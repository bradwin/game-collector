export interface GameMetadata {
  providerGameId: string;
  title: string;
  releaseDate?: string;
  genres: string[];
}

export interface MetadataProvider {
  searchGames(query: string): Promise<GameMetadata[]>;
  getGameById(providerGameId: string): Promise<GameMetadata | null>;
}

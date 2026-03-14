export interface MetadataSearchResult {
  provider: "RAWG";
  externalId: string;
  title: string;
  releaseDate: string | null;
  coverImageUrl: string | null;
  sourceUrl: string | null;
}

export interface MetadataProvider {
  isConfigured(): boolean;
  searchGames(query: string): Promise<MetadataSearchResult[]>;
}

import { env } from "../../config/env.js";
import { MetadataProvider, MetadataSearchResult } from "./provider.interface.js";

interface RawgGameResult {
  id: number;
  name: string;
  released: string | null;
  background_image: string | null;
  slug: string;
}

const RAWG_BASE_URL = "https://api.rawg.io/api";

const mapRawgGame = (item: RawgGameResult): MetadataSearchResult => ({
  provider: "RAWG",
  externalId: String(item.id),
  title: item.name,
  releaseDate: item.released,
  coverImageUrl: item.background_image,
  sourceUrl: item.slug ? `https://rawg.io/games/${item.slug}` : null
});

export class RawgMetadataAdapter implements MetadataProvider {
  constructor(private readonly apiKey?: string) {}

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async searchGames(query: string): Promise<MetadataSearchResult[]> {
    if (!this.apiKey) {
      return [];
    }

    const url = new URL(`${RAWG_BASE_URL}/games`);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("search", query);
    url.searchParams.set("page_size", "10");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`RAWG request failed with status ${response.status}`);
    }

    const json = (await response.json()) as { results?: RawgGameResult[] };
    return (json.results ?? []).map(mapRawgGame);
  }
}

export const rawgMetadataAdapter = new RawgMetadataAdapter(env.RAWG_API_KEY);

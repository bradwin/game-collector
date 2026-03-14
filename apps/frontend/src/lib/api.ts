
export interface HealthResponse {
  status: string;
}

export interface ApiErrorPayload {
  message: string;
  issues?: { message: string }[];
}

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Platform {
  id: string;
  slug: string;
  name: string;
  manufacturer: string | null;
}

export interface Game {
  id: string;
  title: string;
  releaseDate: string | null;
  mediaAssets: { id: string; type: string; url: string; sortOrder: number }[];
  providerRefs: { id: string; provider: string; externalId: string; sourceUrl: string | null }[];
}

export interface OwnershipEntry {
  id: string;
  gameId: string;
  platformId: string;
  medium: "PHYSICAL" | "DIGITAL";
  status: string;
  playStatus: string;
  editionName: string | null;
  region: string | null;
  digitalStore: string | null;
  purchases: Purchase[];
  game: Game;
  platform: Platform;
}

export interface Purchase {
  id: string;
  purchasedAt: string | null;
  priceCents: number | null;
  currencyCode: string | null;
  vendor: string | null;
}

export interface MetadataSearchResult {
  provider: "RAWG";
  externalId: string;
  title: string;
  releaseDate: string | null;
  coverImageUrl: string | null;
  sourceUrl: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const buildHeaders = (token?: string, json = true) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(token, options.body !== undefined),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | undefined;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = undefined;
    }

    throw new ApiError(response.status, payload?.message ?? `Request failed (${response.status})`, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  register: (email: string, password: string) =>
    request<{ user: User }>(`/auth/register`, { method: "POST", body: JSON.stringify({ email, password }) }),

  login: (email: string, password: string) =>
    request<AuthResponse>(`/auth/login`, { method: "POST", body: JSON.stringify({ email, password }) }),

  getPlatforms: (token: string) => request<{ items: Platform[] }>(`/platforms`, {}, token),

  listGames: (token: string, query?: string) =>
    request<{ items: Game[] }>(`/games${query ? `?q=${encodeURIComponent(query)}` : ""}`, {}, token),

  getGameById: (token: string, id: string) => request<{ item: Game }>(`/games/${id}`, {}, token),

  createGame: (token: string, payload: { title: string; releaseDate?: string | null }) =>
    request<{ item: Game }>(`/games`, { method: "POST", body: JSON.stringify(payload) }, token),

  updateGame: (token: string, id: string, payload: { title?: string; releaseDate?: string | null }) =>
    request<{ item: Game }>(`/games/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token),

  listOwnership: (
    token: string,
    filters: { q?: string; platformId?: string; medium?: string; status?: string } = {}
  ) => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => Boolean(value)) as [string, string][]
    ).toString();
    return request<{ items: OwnershipEntry[] }>(`/ownership${query ? `?${query}` : ""}`, {}, token);
  },

  createOwnership: (
    token: string,
    payload: {
      gameId: string;
      platformId: string;
      medium: "PHYSICAL" | "DIGITAL";
      status?: string;
      playStatus?: string;
      editionName?: string | null;
      region?: string | null;
      digitalStore?: string | null;
      source?: string | null;
      notes?: string | null;
      acquiredAt?: string | null;
    }
  ) => request<{ item: OwnershipEntry }>(`/ownership`, { method: "POST", body: JSON.stringify(payload) }, token),

  createPurchase: (
    token: string,
    payload: {
      ownershipEntryId: string;
      purchasedAt?: string | null;
      priceCents?: number | null;
      currencyCode?: string | null;
      vendor?: string | null;
      notes?: string | null;
    }
  ) => request<{ item: Purchase }>(`/purchases`, { method: "POST", body: JSON.stringify(payload) }, token),

  metadataSearch: (token: string, query: string) =>
    request<{ providerConfigured: boolean; items: MetadataSearchResult[] }>(
      `/metadata/search?q=${encodeURIComponent(query)}`,
      {},
      token
    ),

  metadataImport: (token: string, payload: MetadataSearchResult) =>
    request<{ item: Game }>(`/metadata/import`, { method: "POST", body: JSON.stringify(payload) }, token)
};

export const fetchHealth = () => request<HealthResponse>("/health/live", {}, undefined);

export interface HealthResponse {
  status: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await fetch(`${API_BASE_URL}/health/live`);

  if (!response.ok) {
    throw new Error("Health request failed");
  }

  return response.json() as Promise<HealthResponse>;
};

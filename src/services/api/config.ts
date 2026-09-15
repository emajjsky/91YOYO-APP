export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
}

export function getApiConfig(environment: Record<string, string | undefined> = process.env): ApiConfig | null {
  const rawBaseUrl = environment.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';
  if (!rawBaseUrl || rawBaseUrl.includes('api.example.com')) return null;

  const rawTimeout = Number(environment.EXPO_PUBLIC_API_TIMEOUT_MS ?? 15000);
  return {
    baseUrl: rawBaseUrl.replace(/\/+$/, ''),
    timeoutMs: Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 15000,
  };
}

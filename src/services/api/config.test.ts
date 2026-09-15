import { describe, expect, it } from 'vitest';
import { getApiConfig } from './config';

describe('getApiConfig', () => {
  it('returns null when the API URL is missing or still a placeholder', () => {
    expect(getApiConfig({})).toBeNull();
    expect(getApiConfig({ EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com' })).toBeNull();
  });

  it('normalizes a configured API URL', () => {
    expect(getApiConfig({ EXPO_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8791/' })).toEqual({
      baseUrl: 'http://127.0.0.1:8791',
      timeoutMs: 15000,
    });
  });
});
